package com.example.backend.application.addresses;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class ViaCepClient {

	private final RestClient restClient;

	public ViaCepClient(@Value("${integrations.viacep.base-url:https://viacep.com.br/ws}") String baseUrl) {
		HttpClient httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(2))
				.build();
		JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
		requestFactory.setReadTimeout(Duration.ofSeconds(3));
		this.restClient = RestClient.builder()
				.baseUrl(baseUrl)
				.requestFactory(requestFactory)
				.build();
	}

	public ViaCepResponse lookup(String cep) {
		try {
			Map<String, Object> response = restClient.get()
					.uri("/{cep}/json/", cep)
					.retrieve()
					.body(new ParameterizedTypeReference<>() {
					});
			if (response == null) {
				return null;
			}
			return new ViaCepResponse(
					text(response.get("cep")),
					text(response.get("logradouro")),
					text(response.get("bairro")),
					text(response.get("localidade")),
					text(response.get("uf")),
					Boolean.TRUE.equals(response.get("erro")));
		} catch (RestClientException exception) {
			throw new AddressProviderUnavailableException();
		}
	}

	private String text(Object value) {
		return value instanceof String text ? text : "";
	}
}
