package com.example.backend.api;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {

	@Bean
	OpenAPI backendOpenApi() {
		return new OpenAPI()
				.components(new Components()
						.addSecuritySchemes(
								"sessionCookie",
								new SecurityScheme()
										.type(SecurityScheme.Type.APIKEY)
										.in(SecurityScheme.In.COOKIE)
										.name("JSESSIONID"))
						.addSecuritySchemes(
								"csrfHeader",
								new SecurityScheme()
										.type(SecurityScheme.Type.APIKEY)
										.in(SecurityScheme.In.HEADER)
										.name("X-XSRF-TOKEN")))
				.info(new Info()
						.title("API Saneamento Santos")
						.version("1.0.0")
						.description("API de chamados de saneamento, atendimento institucional e indicadores."));
	}
}
