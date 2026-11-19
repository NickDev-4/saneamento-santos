package com.example.backend.application.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.api.auth.dto.SignupRequest;
import com.example.backend.api.exception.ApiException;
import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.user.UserAccount;
import com.example.backend.infrastructure.persistence.user.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;

class AuthServiceTests {

	private final UserAccountRepository accounts = mock(UserAccountRepository.class);
	private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
	private final AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
	private final SecurityContextRepository securityContextRepository = mock(SecurityContextRepository.class);
	private final AuthService authService = new AuthService(
			accounts, passwordEncoder, authenticationManager, securityContextRepository);

	@Test
	void registersOnlyCitizenAndStoresNormalizedEmailAndPasswordHash() {
		when(accounts.existsByEmail("ana@example.test")).thenReturn(false);
		when(passwordEncoder.encode("senha-segura")).thenReturn("bcrypt-hash");
		when(accounts.save(any(UserAccount.class))).thenAnswer(invocation -> {
			UserAccount account = invocation.getArgument(0);
			return new UserAccount("user-id", account.email(), account.nome(), account.telefone(),
					account.passwordHash(), account.perfil(), account.criadoEm());
		});

		var response = authService.register(new SignupRequest(
				" Ana Santos ",
				" Ana@Example.Test ",
				"senha-segura",
				" 13999990000 "));

		assertEquals("user-id", response.id());
		assertEquals("ana@example.test", response.email());
		assertEquals("Ana Santos", response.nome());
		assertEquals("13999990000", response.telefone());
		assertEquals(UserRole.CIDADAO, response.perfil());
		verify(accounts).save(any(UserAccount.class));
	}

	@Test
	void rejectsDuplicateEmailWithoutSavingAnotherAccount() {
		when(accounts.existsByEmail("ana@example.test")).thenReturn(true);

		ApiException exception = assertThrows(ApiException.class, () -> authService.register(
				new SignupRequest("Ana Santos", "ana@example.test", "senha-segura", null)));

		assertEquals(HttpStatus.CONFLICT, exception.status());
		assertEquals("EMAIL_ALREADY_REGISTERED", exception.code());
		verify(accounts, never()).save(any(UserAccount.class));
	}

	@Test
	void rejectsBcryptPasswordsLongerThanItsByteLimit() {
		String password = "á".repeat(37);

		ApiException exception = assertThrows(ApiException.class, () -> authService.register(
				new SignupRequest("Ana Santos", "ana@example.test", password, null)));

		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
		assertEquals("A senha excede o limite permitido.", exception.fieldErrors().get("senha"));
		verify(accounts, never()).save(any(UserAccount.class));
	}
}
