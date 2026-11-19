package com.example.backend.api.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.user.UserAccount;
import com.example.backend.infrastructure.persistence.user.UserAccountRepository;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@MockitoBean
	private UserAccountRepository accounts;

	@Test
	void signupCreatesCitizenWithoutReturningPasswordHash() throws Exception {
		when(accounts.existsByEmail("ana@example.test")).thenReturn(false);
		when(accounts.save(any(UserAccount.class))).thenAnswer(invocation -> {
			UserAccount account = invocation.getArgument(0);
			return new UserAccount("user-id", account.email(), account.nome(), account.telefone(),
					account.passwordHash(), account.perfil(), account.criadoEm());
		});
		Cookie csrfCookie = issueCsrfCookie();

		mockMvc.perform(post("/api/v1/auth/cadastro")
				.cookie(csrfCookie)
				.header("X-XSRF-TOKEN", csrfCookie.getValue())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"nome":"Ana Santos","email":"Ana@Example.Test","senha":"senha-segura","perfil":"SABESP"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value("user-id"))
				.andExpect(jsonPath("$.perfil").value("CIDADAO"))
				.andExpect(jsonPath("$.passwordHash").doesNotExist());
	}

	@Test
	void loginPersistsSessionAndMeRestoresIt() throws Exception {
		UserAccount account = new UserAccount(
				"user-id",
				"ana@example.test",
				"Ana Santos",
				null,
				passwordEncoder.encode("senha-segura"),
				UserRole.CIDADAO,
				Instant.now());
		when(accounts.findByEmail("ana@example.test")).thenReturn(Optional.of(account));
		when(accounts.findById("user-id")).thenReturn(Optional.of(account));
		Cookie csrfCookie = issueCsrfCookie();

		MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
				.cookie(csrfCookie)
				.header("X-XSRF-TOKEN", csrfCookie.getValue())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"email":"ANA@EXAMPLE.TEST","senha":"senha-segura"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("ana@example.test"))
				.andReturn();
		MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);
		assertNotNull(session);

		mockMvc.perform(get("/api/v1/auth/me").session(session))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value("user-id"))
				.andExpect(jsonPath("$.perfil").value("CIDADAO"));

		mockMvc.perform(post("/api/v1/auth/logout")
				.session(session)
				.cookie(csrfCookie)
				.header("X-XSRF-TOKEN", csrfCookie.getValue()))
				.andExpect(status().isNoContent());
		mockMvc.perform(get("/api/v1/auth/me").session(session))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void reportsRecoveryAsUnavailableUntilDeliveryIsConfigured() throws Exception {
		Cookie csrfCookie = issueCsrfCookie();

		mockMvc.perform(post("/api/v1/auth/recuperacao")
				.cookie(csrfCookie)
				.header("X-XSRF-TOKEN", csrfCookie.getValue())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"email":"ana@example.test"}
						"""))
				.andExpect(status().isServiceUnavailable())
				.andExpect(jsonPath("$.code").value("RECOVERY_DELIVERY_UNAVAILABLE"));

		mockMvc.perform(post("/api/v1/auth/redefinicao")
				.cookie(csrfCookie)
				.header("X-XSRF-TOKEN", csrfCookie.getValue())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"token":"temporary-token","novaSenha":"nova-senha-segura"}
						"""))
				.andExpect(status().isServiceUnavailable())
				.andExpect(jsonPath("$.code").value("RECOVERY_DELIVERY_UNAVAILABLE"));
	}

	private Cookie issueCsrfCookie() throws Exception {
		MvcResult csrfResult = mockMvc.perform(get("/api/v1/auth/csrf"))
				.andExpect(status().isNoContent())
				.andReturn();
		return csrfResult.getResponse().getCookie("XSRF-TOKEN");
	}
}
