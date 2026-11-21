package com.example.backend.application.auth;

import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.user.UserAccount;
import com.example.backend.infrastructure.persistence.user.UserAccountRepository;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class InstitutionalAccountSeeder implements ApplicationRunner {
	private final UserAccountRepository accounts;
	private final PasswordEncoder passwordEncoder;
	private final Credentials cidadao;
	private final Credentials sabesp;
	private final Credentials prefeitura;

	public InstitutionalAccountSeeder(
			UserAccountRepository accounts,
			PasswordEncoder passwordEncoder,
			@Value("${SEED_CIDADAO_EMAIL:}") String cidadaoEmail,
			@Value("${SEED_CIDADAO_NAME:}") String cidadaoName,
			@Value("${SEED_CIDADAO_PASSWORD:}") String cidadaoPassword,
			@Value("${SEED_SABESP_EMAIL:}") String sabespEmail,
			@Value("${SEED_SABESP_NAME:}") String sabespName,
			@Value("${SEED_SABESP_PASSWORD:}") String sabespPassword,
			@Value("${SEED_PREFEITURA_EMAIL:}") String prefeituraEmail,
			@Value("${SEED_PREFEITURA_NAME:}") String prefeituraName,
			@Value("${SEED_PREFEITURA_PASSWORD:}") String prefeituraPassword) {
		this.accounts = accounts;
		this.passwordEncoder = passwordEncoder;
		this.cidadao = new Credentials(cidadaoEmail, cidadaoName, cidadaoPassword, UserRole.CIDADAO);
		this.sabesp = new Credentials(sabespEmail, sabespName, sabespPassword, UserRole.SABESP);
		this.prefeitura = new Credentials(prefeituraEmail, prefeituraName, prefeituraPassword, UserRole.PREFEITURA);
	}

	@Override
	public void run(ApplicationArguments args) {
		validateDistinctEmails();
		seed(cidadao);
		seed(sabesp);
		seed(prefeitura);
	}

	private void validateDistinctEmails() {
		String[] emails = { cidadao.email(), sabesp.email(), prefeitura.email() };
		for (int first = 0; first < emails.length; first++) {
			if (emails[first].isBlank()) {
				continue;
			}
			for (int second = first + 1; second < emails.length; second++) {
				if (emails[first].equalsIgnoreCase(emails[second])) {
					throw new IllegalStateException("Use e-mails diferentes para as contas de demonstração.");
				}
			}
		}
	}

	private void seed(Credentials credentials) {
		boolean anyProvided = !credentials.email().isBlank()
				|| !credentials.name().isBlank() || !credentials.password().isBlank();
		if (!anyProvided) {
			return;
		}
		if (credentials.email().isBlank() || credentials.name().isBlank()
				|| credentials.password().isBlank()) {
			throw new IllegalStateException("Cada conta institucional exige e-mail, nome e senha no ambiente.");
		}
		if (credentials.password().length() < 12
				|| credentials.password().getBytes(StandardCharsets.UTF_8).length > 72) {
			throw new IllegalStateException("A senha institucional deve ter de 12 a 72 bytes UTF-8.");
		}
		String email = credentials.email().trim().toLowerCase(Locale.ROOT);
		var existing = accounts.findByEmail(email);
		if (existing.isPresent()) {
			if (existing.get().perfil() != credentials.role()) {
				throw new IllegalStateException(
						"O e-mail institucional configurado já pertence a uma conta com outro perfil; nenhuma promoção foi feita.");
			}
			return;
		}
		accounts.save(new UserAccount(
				null,
				email,
				credentials.name().trim(),
				null,
				passwordEncoder.encode(credentials.password()),
				credentials.role(),
				Instant.now(),
				0L));
	}

	private record Credentials(String email, String name, String password, UserRole role) {
	}
}
