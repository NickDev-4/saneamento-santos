package com.example.backend.application.auth;

import com.example.backend.api.auth.dto.LoginRequest;
import com.example.backend.api.auth.dto.PasswordResetRequest;
import com.example.backend.api.auth.dto.ProfileUpdateRequest;
import com.example.backend.api.auth.dto.RecoveryRequest;
import com.example.backend.api.auth.dto.SignupRequest;
import com.example.backend.api.auth.dto.UserResponse;
import com.example.backend.api.exception.ApiException;
import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.user.UserAccount;
import com.example.backend.infrastructure.persistence.user.UserAccountRepository;
import com.example.backend.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

	private final UserAccountRepository accounts;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final SecurityContextRepository securityContextRepository;
	private final PasswordRecoveryService passwordRecovery;

	@Autowired
	public AuthService(
			UserAccountRepository accounts,
			PasswordEncoder passwordEncoder,
			AuthenticationManager authenticationManager,
			SecurityContextRepository securityContextRepository,
			PasswordRecoveryService passwordRecovery) {
		this.accounts = accounts;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.securityContextRepository = securityContextRepository;
		this.passwordRecovery = passwordRecovery;
	}

	public AuthService(
			UserAccountRepository accounts,
			PasswordEncoder passwordEncoder,
			AuthenticationManager authenticationManager,
			SecurityContextRepository securityContextRepository) {
		this(accounts, passwordEncoder, authenticationManager, securityContextRepository, null);
	}

	public UserResponse register(SignupRequest request) {
		validateBcryptLength(request.senha());
		String email = normalizeEmail(request.email());
		if (accounts.existsByEmail(email)) {
			throw emailAlreadyRegistered();
		}

		UserAccount account = new UserAccount(
				null,
				email,
				request.nome().trim(),
				normalizeOptional(request.telefone()),
				passwordEncoder.encode(request.senha()),
				UserRole.CIDADAO,
				Instant.now(),
				0L);
		try {
			return UserResponse.from(accounts.save(account));
		} catch (DuplicateKeyException exception) {
			throw emailAlreadyRegistered();
		}
	}

	public UserResponse login(LoginRequest request, HttpServletRequest servletRequest, HttpServletResponse response) {
		Authentication authentication;
		try {
			authentication = authenticationManager.authenticate(
					UsernamePasswordAuthenticationToken.unauthenticated(
							normalizeEmail(request.email()),
							request.senha()));
		} catch (AuthenticationException exception) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
					"E-mail ou senha inválidos.");
		}

		servletRequest.getSession(true);
		servletRequest.changeSessionId();
		UserPrincipal sessionPrincipal = ((UserPrincipal) authentication.getPrincipal()).withoutPassword();
		Authentication sessionAuthentication = UsernamePasswordAuthenticationToken.authenticated(
				sessionPrincipal,
				null,
				sessionPrincipal.getAuthorities());
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(sessionAuthentication);
		SecurityContextHolder.setContext(context);
		securityContextRepository.saveContext(context, servletRequest, response);

		return new UserResponse(
				sessionPrincipal.id(),
				sessionPrincipal.nome(),
				sessionPrincipal.username(),
				sessionPrincipal.telefone(),
				sessionPrincipal.perfil());
	}

	public UserResponse currentUser(Authentication authentication) {
		UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
		return accounts.findById(principal.id())
				.map(UserResponse::from)
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "SESSION_EXPIRED",
						"Sessão inválida ou expirada."));
	}

	public UserResponse updateProfile(Authentication authentication, ProfileUpdateRequest request) {
		UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
		UserAccount account = accounts.findById(principal.id())
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "SESSION_EXPIRED",
						"Sessão inválida ou expirada."));
		if (request.nome() == null && request.telefone() == null) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
					"Informe ao menos um campo para atualizar.", Map.of("body", "Nenhum campo informado."));
		}

		UserAccount updated = new UserAccount(
				account.id(),
				account.email(),
				request.nome() == null ? account.nome() : request.nome().trim(),
				request.telefone() == null ? account.telefone() : normalizeOptional(request.telefone()),
				account.passwordHash(),
				account.perfil(),
				account.criadoEm(),
				account.effectivePasswordVersion());
		return UserResponse.from(accounts.save(updated));
	}

	public void logout(HttpServletRequest request) {
		var session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}
		SecurityContextHolder.clearContext();
	}

	public void recover(RecoveryRequest request) {
		if (passwordRecovery == null) {
			throw recoveryUnavailable();
		}
		passwordRecovery.requestRecovery(request);
	}

	public void resetPassword(PasswordResetRequest request) {
		if (passwordRecovery == null) {
			throw recoveryUnavailable();
		}
		passwordRecovery.resetPassword(request);
	}

	private ApiException recoveryUnavailable() {
		return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "RECOVERY_DELIVERY_UNAVAILABLE",
				"Recuperação de senha indisponível até a configuração do serviço de entrega.");
	}

	private ApiException emailAlreadyRegistered() {
		return new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED",
				"Não foi possível cadastrar esta conta.");
	}

	private void validateBcryptLength(String password) {
		if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
					"Revise os campos indicados.", Map.of("senha", "A senha excede o limite permitido."));
		}
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

	private String normalizeOptional(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
