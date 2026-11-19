package com.example.backend.application.addresses;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ViaCepResponse(
		String cep,
		String logradouro,
		String bairro,
		@JsonProperty("localidade") String cidade,
		String uf,
		boolean erro) {
}
