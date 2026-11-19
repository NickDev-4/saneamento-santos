package com.example.backend.api.auth;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import jakarta.servlet.http.Cookie;

@SpringBootTest
@AutoConfigureMockMvc
class CsrfControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void issuesReadableCsrfCookieForBrowserClient() throws Exception {
		mockMvc.perform(get("/api/v1/auth/csrf"))
				.andExpect(status().isNoContent())
				.andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("XSRF-TOKEN=")));
	}

	@Test
	void acceptsRawCookieTokenInExpectedHeader() throws Exception {
		MvcResult csrfResult = mockMvc.perform(get("/api/v1/auth/csrf"))
				.andExpect(status().isNoContent())
				.andReturn();
		Cookie csrfCookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");

		mockMvc.perform(post("/api/v1/auth/login")
				.cookie(csrfCookie)
				.header("X-XSRF-TOKEN", csrfCookie.getValue()))
				.andExpect(status().isBadRequest());
	}
}
