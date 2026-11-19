package com.example.backend.application.addresses;

import com.example.backend.api.exception.ApiException;
import com.example.backend.infrastructure.persistence.cases.CaseDocument.AddressSnapshot;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class GeocodingService {

	public SuggestedLocation suggest(AddressSnapshot address) {
		throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GEOCODING_PROVIDER_UNAVAILABLE",
				"Geocodificação indisponível até a configuração do provedor.");
	}

	public record SuggestedLocation(double latitude, double longitude) {
	}
}
