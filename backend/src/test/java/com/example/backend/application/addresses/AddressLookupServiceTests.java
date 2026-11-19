package com.example.backend.application.addresses;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.api.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class AddressLookupServiceTests {

	private final ViaCepClient viaCepClient = mock(ViaCepClient.class);
	private final AddressLookupService service = new AddressLookupService(viaCepClient);

	@Test
	void normalizesCepAndMapsViaCepCityToContract() {
		when(viaCepClient.lookup("11060000"))
				.thenReturn(new ViaCepResponse("11060-000", "Rua de Teste", "Gonzaga", "Santos", "SP", false));

		var result = service.lookup("11060-000");

		assertEquals("11060-000", result.cep());
		assertEquals("Rua de Teste", result.logradouro());
		assertEquals("Gonzaga", result.bairro());
		assertEquals("Santos", result.cidade());
		assertEquals("SP", result.uf());
		verify(viaCepClient).lookup("11060000");
	}

	@Test
	void rejectsInvalidCepWithoutCallingProvider() {
		ApiException exception = assertThrows(ApiException.class, () -> service.lookup("123"));

		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
		assertEquals("Informe um CEP com oito dígitos.", exception.fieldErrors().get("cep"));
		verify(viaCepClient, never()).lookup("123");
	}

	@Test
	void returnsNotFoundWhenProviderReportsUnknownCep() {
		when(viaCepClient.lookup("00000000"))
				.thenReturn(new ViaCepResponse("00000-000", null, null, null, null, true));

		ApiException exception = assertThrows(ApiException.class, () -> service.lookup("00000000"));

		assertEquals(HttpStatus.NOT_FOUND, exception.status());
		assertEquals("CEP_NOT_FOUND", exception.code());
	}

	@Test
	void reportsProviderFailureInsteadOfReturningAnEmptyAddress() {
		when(viaCepClient.lookup("11060000")).thenThrow(new AddressProviderUnavailableException());

		ApiException exception = assertThrows(ApiException.class, () -> service.lookup("11060000"));

		assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.status());
		assertEquals("ADDRESS_PROVIDER_UNAVAILABLE", exception.code());
	}
}
