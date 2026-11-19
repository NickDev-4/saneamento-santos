package com.example.backend.application.addresses;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.example.backend.api.exception.ApiException;
import com.example.backend.infrastructure.persistence.cases.CaseDocument.AddressSnapshot;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class GeocodingServiceTests {

	private final GeocodingService service = new GeocodingService();

	@Test
	void reportsProviderUnavailableUntilOneIsConfigured() {
		ApiException exception = assertThrows(ApiException.class, () -> service.suggest(
				new AddressSnapshot("11060000", "Rua de Teste", "1", false,
						"Gonzaga", "Santos", "SP", "")));

		assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.status());
		assertEquals("GEOCODING_PROVIDER_UNAVAILABLE", exception.code());
	}
}
