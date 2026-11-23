package com.example.backend.application.addresses;

public record ViaCepResponse(
		String cep,
		String logradouro,
		String bairro,
		String cidade,
		String uf,
		boolean erro) {
}
