package com.example.backend.api.cases;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.domain.user.UserRole;
import com.example.backend.application.cases.CitizenCaseService;
import com.example.backend.infrastructure.persistence.user.UserAccount;
import com.example.backend.infrastructure.persistence.user.UserAccountRepository;
import com.example.backend.security.UserPrincipal;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class CitizenCaseControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@MockitoBean
	private UserAccountRepository accounts;

	@MockitoBean
	private CitizenCaseService cases;

	@Test
	void requiresCitizenSessionToListPrivateCases() throws Exception {
		mockMvc.perform(get("/api/v1/me/chamados"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void requiresCsrfForMultipartCaseCreation() throws Exception {
		MockHttpSession session = login(UserRole.CIDADAO);
		Cookie csrf = issueCsrfCookie();

		mockMvc.perform(multipart("/api/v1/chamados")
				.file(dataPart())
				.file(imagePart())
				.session(session)
				.cookie(csrf))
				.andExpect(status().isForbidden());
	}

	@Test
	void createsCitizenCaseFromMultipartContract() throws Exception {
		MockHttpSession session = login(UserRole.CIDADAO);
		Cookie csrf = issueCsrfCookie();
		CitizenCaseResponse created = new CitizenCaseResponse(
				"case-id",
				"SS-2026-UUID",
				"tipo-id",
				"Vazamento",
				"Relato",
				Instant.parse("2026-11-18T12:00:00Z"),
				Instant.parse("2026-11-19T12:00:00Z"),
				Instant.parse("2026-11-19T12:00:00Z"),
				null,
				null,
				CaseStatus.RECEBIDO,
				PublicationState.PENDENTE,
				List.of(),
				null,
				List.of(),
				null,
				null,
				List.of("editar", "cancelar"));
		when(cases.create(any(CaseWriteRequest.class), anyList(), any(UserPrincipal.class))).thenReturn(created);

		mockMvc.perform(multipart("/api/v1/chamados")
				.file(dataPart())
				.file(imagePart())
				.file(new MockMultipartFile("imagensMantidas", "", MediaType.APPLICATION_JSON_VALUE, "[]".getBytes()))
				.session(session)
				.cookie(csrf)
				.header("X-XSRF-TOKEN", csrf.getValue()))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value("case-id"))
				.andExpect(jsonPath("$.status").value("RECEBIDO"))
				.andExpect(jsonPath("$.publicacao").value("PENDENTE"));

		verify(cases).create(any(CaseWriteRequest.class), anyList(), any(UserPrincipal.class));
	}

	@Test
	void invalidMultipartDataIsRejectedBeforeCallingService() throws Exception {
		MockHttpSession session = login(UserRole.CIDADAO);
		Cookie csrf = issueCsrfCookie();

		mockMvc.perform(multipart("/api/v1/chamados")
				.file(new MockMultipartFile("dados", "dados.json", MediaType.APPLICATION_JSON_VALUE, "{}".getBytes()))
				.file(imagePart())
				.session(session)
				.cookie(csrf)
				.header("X-XSRF-TOKEN", csrf.getValue()))
				.andExpect(status().isBadRequest());
	}

	private MockHttpSession login(UserRole role) throws Exception {
		String email = role.name().toLowerCase() + "@example.test";
		UserAccount account = new UserAccount(
				role.name().toLowerCase() + "-id",
				email,
				"Usuário de teste",
				null,
				passwordEncoder.encode("senha-segura"),
				role,
				Instant.now());
		when(accounts.findByEmail(email)).thenReturn(Optional.of(account));
		when(accounts.findById(account.id())).thenReturn(Optional.of(account));
		Cookie csrf = issueCsrfCookie();
		MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
				.cookie(csrf)
				.header("X-XSRF-TOKEN", csrf.getValue())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"" + email + "\",\"senha\":\"senha-segura\"}"))
				.andExpect(status().isOk())
				.andReturn();
		MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
		assertNotNull(session);
		return session;
	}

	private Cookie issueCsrfCookie() throws Exception {
		MvcResult result = mockMvc.perform(get("/api/v1/auth/csrf"))
				.andExpect(status().isNoContent())
				.andReturn();
		return result.getResponse().getCookie("XSRF-TOKEN");
	}

	private MockMultipartFile dataPart() {
		return new MockMultipartFile(
				"dados",
				"dados.json",
				MediaType.APPLICATION_JSON_VALUE,
				"""
				{"tipoId":"tipo-id","descricao":"Relato","observadoEm":"2026-11-18T12:00:00Z",
				 "endereco":{"cep":"11060-000","logradouro":"Rua Teste","numero":"10","semNumero":false,
				 "bairro":"Gonzaga","cidade":"Santos","uf":"SP","referencia":""},
				 "localizacao":{"latitude":-23.96,"longitude":-46.33},"reincidenciaDe":null}
				""".getBytes());
	}

	private MockMultipartFile imagePart() {
		byte[] image = new byte[24];
		byte[] signature = new byte[] {
				(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
		};
		System.arraycopy(signature, 0, image, 0, signature.length);
		image[11] = 13;
		image[12] = 'I';
		image[13] = 'H';
		image[14] = 'D';
		image[15] = 'R';
		return new MockMultipartFile("imagens", "photo.png", "image/png", image);
	}
}
