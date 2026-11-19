package com.example.backend.api.addresses;

import com.example.backend.application.addresses.AddressLookupService;
import com.example.backend.application.addresses.AddressLookupService.AddressSuggestion;
import com.example.backend.application.addresses.GeocodingService;
import com.example.backend.application.addresses.GeocodingService.SuggestedLocation;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/enderecos")
public class AddressController {

	private final AddressLookupService addressLookup;
	private final GeocodingService geocoding;

	public AddressController(AddressLookupService addressLookup, GeocodingService geocoding) {
		this.addressLookup = addressLookup;
		this.geocoding = geocoding;
	}

	@GetMapping("/cep/{cep}")
	public AddressSuggestion lookupCep(@PathVariable String cep) {
		return addressLookup.lookup(cep);
	}

	@PostMapping("/geocodificacao")
	public SuggestedLocation geocode(@Valid @RequestBody GeocodingRequest request) {
		return geocoding.suggest(request.endereco());
	}
}
