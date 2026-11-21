package com.example.backend.application.addresses;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class ViaCepResponseTests {

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void readsValidViaCepResponseWithNullErroAndLocalidadeField() throws Exception {
		String json = """
				{"cep":"11035-200","logradouro":"Rua Professor Pirajá da Silva",
				"complemento":"","unidade":"","bairro":"Aparecida",
				"localidade":"Santos","uf":"SP","estado":"São Paulo",
				"regiao":"Sudeste","ibge":"3548500","gia":"6336",
				"ddd":"13","siafi":"7071","erro":null}
				""";

		ViaCepResponse response = objectMapper.readValue(json, ViaCepResponse.class);

		assertEquals("Santos", response.cidade());
		assertNull(response.erro());
	}
}
