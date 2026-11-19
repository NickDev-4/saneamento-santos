package com.example.backend.api.publicapi;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.application.publicapi.PublicCaseQueryService;
import com.example.backend.infrastructure.persistence.cases.CaseTypeDocument;
import com.example.backend.infrastructure.persistence.cases.CaseTypeRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class PublicApiControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private CaseTypeRepository caseTypes;

	@MockitoBean
	private PublicCaseQueryService publicCases;

	@Test
	void servesConfiguredTypesWithoutAuthentication() throws Exception {
		when(caseTypes.findByAtivoTrueOrderByNomeAsc())
				.thenReturn(List.of(new CaseTypeDocument("type-id", "Tipo provisionado", true)));

		mockMvc.perform(get("/api/v1/public/tipos-chamado"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value("type-id"))
				.andExpect(jsonPath("$[0].nome").value("Tipo provisionado"));
	}

	@Test
	void servesPublicPaginationWithoutAuthentication() throws Exception {
		when(publicCases.list(null, null, null, null, null, null, null, 0, 20))
				.thenReturn(new PageResponse<>(List.of(), 0, 20, 0, 0));

		mockMvc.perform(get("/api/v1/public/chamados"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items").isArray())
				.andExpect(jsonPath("$.page").value(0))
				.andExpect(jsonPath("$.size").value(20))
				.andExpect(jsonPath("$.totalItems").value(0))
				.andExpect(jsonPath("$.totalPages").value(0));
	}

	@Test
	void formatsInvalidPageParameterAsApiValidationError() throws Exception {
		mockMvc.perform(get("/api/v1/public/chamados").param("page", "invalid"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
				.andExpect(jsonPath("$.fieldErrors.page").exists());
	}
}
