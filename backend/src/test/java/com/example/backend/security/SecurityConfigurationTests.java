package com.example.backend.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigurationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void permitsAnonymousPublicApiReads() throws Exception {
		mockMvc.perform(get("/api/v1/public/rota-inexistente"))
				.andExpect(status().isNotFound());
	}

	@Test
	void protectsPrivateApiRoutesWithUnauthorizedResponse() throws Exception {
		mockMvc.perform(get("/api/v1/me/chamados"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
	}

	@Test
	void rejectsStateChangingRequestsWithoutCsrfToken() throws Exception {
		mockMvc.perform(post("/api/v1/auth/logout"))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
	}

	@Test
	void publishesOpenApiDocumentWithoutAuthentication() throws Exception {
		mockMvc.perform(get("/v3/api-docs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.info.title").value("API Saneamento Santos"));
	}
}
