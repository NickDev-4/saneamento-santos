package com.example.backend.application.addresses;

import com.example.backend.api.exception.ApiException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AddressLookupService {

	private final ViaCepClient viaCepClient;

	public AddressLookupService(ViaCepClient viaCepClient) {
		this.viaCepClient = viaCepClient;
	}

	public AddressSuggestion lookup(String value) {
		String cep = value.replaceAll("\\D", "");
		if (!cep.matches("\\d{8}")) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
					"Revise os campos indicados.", Map.of("cep", "Informe um CEP com oito dígitos."));
		}

		ViaCepResponse result = viaCepClient.lookup(cep);
		if (result == null) {
			throw new AddressProviderUnavailableException();
		}
		if (Boolean.TRUE.equals(result.erro())) {
			throw new ApiException(HttpStatus.NOT_FOUND, "CEP_NOT_FOUND",
					"CEP não encontrado.", Map.of("cep", "Confira o CEP ou preencha o endereço manualmente."));
		}
		return new AddressSuggestion(result.cep(), result.logradouro(), result.bairro(), result.cidade(), result.uf());
	}

	public record AddressSuggestion(String cep, String logradouro, String bairro, String cidade, String uf) {
	}
}
