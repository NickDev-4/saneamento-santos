package com.example.backend.application.auth;

import com.example.backend.api.auth.dto.PasswordResetRequest;
import com.example.backend.api.auth.dto.RecoveryRequest;
import com.example.backend.api.exception.ApiException;
import com.example.backend.infrastructure.persistence.user.PasswordRecoveryToken;
import com.example.backend.infrastructure.persistence.user.PasswordRecoveryTokenRepository;
import com.example.backend.infrastructure.persistence.user.UserAccount;
import com.example.backend.infrastructure.persistence.user.UserAccountRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordRecoveryService {
	private static final System.Logger LOGGER = System.getLogger(PasswordRecoveryService.class.getName());
	private static final SecureRandom RANDOM = new SecureRandom();

	private final UserAccountRepository accounts;
	private final PasswordRecoveryTokenRepository tokens;
	private final MongoTemplate mongoTemplate;
	private final PasswordEncoder passwordEncoder;
	private final JavaMailSender mailSender;
	private final String senderAddress;
	private final String frontendUrl;
	private final long tokenLifetimeMinutes;

	public PasswordRecoveryService(
			UserAccountRepository accounts,
			PasswordRecoveryTokenRepository tokens,
			MongoTemplate mongoTemplate,
			PasswordEncoder passwordEncoder,
			ObjectProvider<JavaMailSender> mailSender,
			@Value("${recovery.email.from:}") String senderAddress,
			@Value("${recovery.frontend-url:}") String frontendUrl,
			@Value("${recovery.token-lifetime-minutes:30}") long tokenLifetimeMinutes,
			@Value("${spring.mail.host:}") String mailHost) {
		this.accounts = accounts;
		this.tokens = tokens;
		this.mongoTemplate = mongoTemplate;
		this.passwordEncoder = passwordEncoder;
		this.mailSender = mailSender.getIfAvailable();
		this.senderAddress = senderAddress;
		this.frontendUrl = frontendUrl;
		this.tokenLifetimeMinutes = tokenLifetimeMinutes;
		this.mailConfigured = !mailHost.isBlank() && !senderAddress.isBlank()
				&& !frontendUrl.isBlank() && this.mailSender != null;
	}

	private final boolean mailConfigured;

	public void requestRecovery(RecoveryRequest request) {
		ensureDeliveryConfigured();
		String email = request.email().trim().toLowerCase(Locale.ROOT);
		Optional<UserAccount> account = accounts.findByEmail(email);
		if (account.isEmpty()) {
			return;
		}

		String token = newToken();
		Instant expiresAt = Instant.now().plus(Duration.ofMinutes(tokenLifetimeMinutes));
		tokens.deleteByAccountId(account.get().id());
		tokens.save(new PasswordRecoveryToken(
				null, hashToken(token), account.get().id(), expiresAt, false, null));
		try {
			SimpleMailMessage message = new SimpleMailMessage();
			message.setFrom(senderAddress);
			message.setTo(account.get().email());
			message.setSubject("Recuperação de acesso — Saneamento Santos");
			message.setText("Para criar uma nova senha, acesse este link. Ele expira em "
					+ tokenLifetimeMinutes + " minutos:\n\n"
					+ frontendUrl.replaceAll("/+$", "") + "/redefinir-senha?token="
					+ java.net.URLEncoder.encode(token, StandardCharsets.UTF_8));
			mailSender.send(message);
		} catch (RuntimeException exception) {
			tokens.deleteByAccountId(account.get().id());
			LOGGER.log(System.Logger.Level.WARNING, "A mensagem de recuperação não pôde ser entregue.");
		}
	}

	@Transactional
	public void resetPassword(PasswordResetRequest request) {
		if (request.novaSenha().getBytes(StandardCharsets.UTF_8).length > 72) {
			throw validationError("A senha excede o limite permitido.");
		}
		Instant now = Instant.now();
		PasswordRecoveryToken token = mongoTemplate.findAndModify(
				Query.query(Criteria.where("tokenHash").is(hashToken(request.token()))
						.and("consumed").is(false).and("expiresAt").gt(now)),
				new Update().set("consumed", true).set("consumedAt", now),
				org.springframework.data.mongodb.core.FindAndModifyOptions.options().returnNew(false),
				PasswordRecoveryToken.class);
		if (token == null) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "PASSWORD_RESET_TOKEN_INVALID",
					"O link de recuperação expirou ou já foi utilizado.");
		}
		UserAccount account = accounts.findById(token.accountId())
				.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "PASSWORD_RESET_TOKEN_INVALID",
						"O link de recuperação expirou ou já foi utilizado."));
		UserAccount updated = new UserAccount(
				account.id(), account.email(), account.nome(), account.telefone(),
				passwordEncoder.encode(request.novaSenha()), account.perfil(), account.criadoEm(),
				account.effectivePasswordVersion() + 1);
		accounts.save(updated);
		tokens.deleteByAccountId(account.id());
	}

	private void ensureDeliveryConfigured() {
		if (!mailConfigured || tokenLifetimeMinutes < 5 || tokenLifetimeMinutes > 1440) {
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "RECOVERY_DELIVERY_UNAVAILABLE",
					"Recuperação de senha indisponível até a configuração do serviço de entrega.");
		}
	}

	private String newToken() {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private String hashToken(String token) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
					.digest(token.getBytes(StandardCharsets.UTF_8)));
		} catch (java.security.NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is unavailable", exception);
		}
	}

	private ApiException validationError(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
				"Revise os campos indicados.", Map.of("novaSenha", message));
	}
}
