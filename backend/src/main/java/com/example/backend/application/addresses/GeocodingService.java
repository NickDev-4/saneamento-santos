package com.example.backend.application.addresses;

import com.example.backend.api.exception.ApiException;
import com.example.backend.infrastructure.persistence.cases.CaseDocument.AddressSnapshot;
import java.net.URI;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.util.UriBuilder;
import tools.jackson.databind.JsonNode;

@Service
public class GeocodingService {
	private static final long MIN_REQUEST_INTERVAL_MILLIS = 1_100;
	private static final int MAX_CACHE_ENTRIES = 1_000;

	private final RestClient client;
	private final String endpoint;
	private final String userAgent;
	private final Map<String, SuggestedLocation> cache = new ConcurrentHashMap<>();
	private long nextAllowedRequestAt;

	public GeocodingService() {
		this("https://nominatim.openstreetmap.org/search", "SaneamentoSantos/1.0");
	}

	@Autowired
	public GeocodingService(
			@Value("${geocoding.nominatim-url:https://nominatim.openstreetmap.org/search}") String endpoint,
			@Value("${geocoding.user-agent:SaneamentoSantos/1.0}") String userAgent) {
		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout(Duration.ofSeconds(3));
		requestFactory.setReadTimeout(Duration.ofSeconds(5));
		this.client = RestClient.builder().baseUrl(endpoint).requestFactory(requestFactory).build();
		this.endpoint = endpoint;
		this.userAgent = userAgent;
	}

	public SuggestedLocation suggest(AddressSnapshot address) {
		String query = toQuery(address);
		String key = query.toLowerCase(Locale.ROOT);
		SuggestedLocation cached = cache.get(key);
		if (cached != null) {
			return cached;
		}

		waitForRateLimit();
		try {
			JsonNode response = client.get()
					.uri(uriBuilder -> buildUri(uriBuilder, query))
					.header("User-Agent", userAgent)
					.retrieve()
					.body(JsonNode.class);
			if (response == null || !response.isArray() || response.isEmpty()) {
				throw new ApiException(HttpStatus.NOT_FOUND, "ADDRESS_NOT_FOUND",
						"Não foi possível encontrar esse endereço. Ajuste o ponto no mapa.");
			}

			JsonNode first = response.get(0);
			double latitude = Double.parseDouble(first.path("lat").asText());
			double longitude = Double.parseDouble(first.path("lon").asText());
			if (!Double.isFinite(latitude) || !Double.isFinite(longitude)
					|| latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
				throw new IllegalStateException("Nominatim returned invalid coordinates");
			}
			SuggestedLocation result = new SuggestedLocation(latitude, longitude);
			if (cache.size() >= MAX_CACHE_ENTRIES) {
				cache.clear();
			}
			cache.put(key, result);
			return result;
		} catch (ApiException error) {
			throw error;
		} catch (RestClientException | NumberFormatException error) {
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GEOCODING_PROVIDER_UNAVAILABLE",
					"O serviço de geocodificação está temporariamente indisponível.");
		}
	}

	private URI buildUri(UriBuilder uriBuilder, String query) {
		return uriBuilder
				.queryParam("q", query)
				.queryParam("format", "jsonv2")
				.queryParam("limit", 1)
				.queryParam("countrycodes", "br")
				.build();
	}

	private String toQuery(AddressSnapshot address) {
		if (address == null) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Informe o endereço para buscar o ponto.");
		}
		if (isBlank(address.logradouro()) && isBlank(address.bairro()) && isBlank(address.cidade())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
					"Informe logradouro, bairro ou cidade para buscar o ponto.");
		}
		StringBuilder query = new StringBuilder();
		append(query, address.logradouro());
		append(query, address.bairro());
		append(query, address.cidade());
		append(query, address.uf());
		append(query, "Brasil");
		if (query.length() > 256) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Revise o tamanho do endereço informado.");
		}
		return query.toString();
	}

	private void append(StringBuilder query, String value) {
		if (value == null || value.isBlank()) {
			return;
		}
		if (query.length() > 0) {
			query.append(", ");
		}
		query.append(value.trim());
	}

	private boolean isBlank(String value) {
		return value == null || value.isBlank();
	}

	private synchronized void waitForRateLimit() {
		long wait = nextAllowedRequestAt - System.currentTimeMillis();
		if (wait > 0) {
			try {
				Thread.sleep(wait);
			} catch (InterruptedException error) {
				Thread.currentThread().interrupt();
				throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GEOCODING_PROVIDER_UNAVAILABLE",
						"O serviço de geocodificação está temporariamente indisponível.");
			}
		}
		nextAllowedRequestAt = System.currentTimeMillis() + MIN_REQUEST_INTERVAL_MILLIS;
	}

	public record SuggestedLocation(double latitude, double longitude) {
	}
}
