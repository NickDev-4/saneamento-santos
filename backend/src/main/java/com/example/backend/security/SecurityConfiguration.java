package com.example.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

	@Value("${SESSION_COOKIE_SECURE:false}")
	private boolean secureCookies;

	@Value("${SESSION_COOKIE_SAME_SITE:lax}")
	private String sameSite;

	private final ApiSecurityErrorHandler securityErrorHandler;

	public SecurityConfiguration(ApiSecurityErrorHandler securityErrorHandler) {
		this.securityErrorHandler = securityErrorHandler;
	}

	@Bean
	SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
		CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
		csrfTokenRepository.setCookieCustomizer(cookie -> cookie
				.path("/")
				.secure(secureCookies)
				.sameSite(sameSite));

		return http
				.csrf(csrf -> csrf
						.csrfTokenRepository(csrfTokenRepository)
						.csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
				.authorizeHttpRequests(authorize -> authorize
						.requestMatchers(HttpMethod.GET, "/api/v1/health", "/api/v1/auth/csrf").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/v1/auth/cadastro", "/api/v1/auth/login",
								"/api/v1/auth/recuperacao", "/api/v1/auth/redefinicao")
						.permitAll()
						.requestMatchers("/api/v1/public/**", "/api/v1/enderecos/cep/**",
								"/api/v1/enderecos/geocodificacao")
						.permitAll()
						.anyRequest().authenticated())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
				.exceptionHandling(exceptions -> exceptions
						.authenticationEntryPoint(securityErrorHandler)
						.accessDeniedHandler(securityErrorHandler))
				.build();
	}
}
