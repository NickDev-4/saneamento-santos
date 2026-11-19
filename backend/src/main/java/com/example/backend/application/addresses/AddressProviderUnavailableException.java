package com.example.backend.application.addresses;

import com.example.backend.api.exception.ApiException;
import org.springframework.http.HttpStatus;

public class AddressProviderUnavailableException extends ApiException {

	public AddressProviderUnavailableException() {
		super(HttpStatus.SERVICE_UNAVAILABLE, "ADDRESS_PROVIDER_UNAVAILABLE",
				"Não foi possível consultar o serviço de endereços agora.");
	}
}
