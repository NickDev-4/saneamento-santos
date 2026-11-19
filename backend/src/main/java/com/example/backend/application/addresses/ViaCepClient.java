package com.example.backend.application.addresses;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
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
			return restClient.get()
					.uri("/{cep}/json/", cep)
					.retrieve()
					.body(ViaCepResponse.class);
		} catch (RestClientException exception) {
			throw new AddressProviderUnavailableException();
		}
	}
}
