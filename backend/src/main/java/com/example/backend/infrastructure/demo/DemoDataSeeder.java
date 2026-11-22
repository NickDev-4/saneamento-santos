package com.example.backend.infrastructure.demo;

import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import com.example.backend.infrastructure.persistence.cases.CaseRepository;
import com.example.backend.infrastructure.persistence.cases.CaseTypeDocument;
import com.example.backend.infrastructure.persistence.cases.CaseTypeRepository;
import com.example.backend.infrastructure.persistence.user.UserAccount;
import com.example.backend.infrastructure.persistence.user.UserAccountRepository;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Seeds fictitious demonstration records only when explicitly enabled in the demo profile. */
@Component
@Profile("demo")
@ConditionalOnProperty(name = "app.demo.seed.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(DemoDataSeeder.class);
	private static final String CITIZEN_ID = "00000000-0000-4000-8000-000000000101";
	private static final String STAFF_ID = "00000000-0000-4000-8000-000000000102";
	private static final String CITY_HALL_ID = "00000000-0000-4000-8000-000000000103";
	private static final String DEMO_PASSWORD = "SantosDemo2026!";

	private final CaseRepository cases;
	private final CaseTypeRepository types;
	private final UserAccountRepository accounts;
	private final PasswordEncoder passwordEncoder;

	public DemoDataSeeder(
			CaseRepository cases,
			CaseTypeRepository types,
			UserAccountRepository accounts,
			PasswordEncoder passwordEncoder) {
		this.cases = cases;
		this.types = types;
		this.accounts = accounts;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(ApplicationArguments args) {
		String citizenId = ensureAccount(
				CITIZEN_ID, "demo-cidadao@saneamento.test", "Cidadão de demonstração", UserRole.CIDADAO);
		String staffId = ensureAccount(
				STAFF_ID, "demo-sabesp@saneamento.test", "Equipe Sabesp de demonstração", UserRole.SABESP);
		ensureAccount(
				CITY_HALL_ID, "demo-prefeitura@saneamento.test", "Equipe Prefeitura de demonstração", UserRole.PREFEITURA);

		ensureType("extravasamento", "Extravasamento de esgoto");
		ensureType("retorno", "Retorno de esgoto");
		ensureType("odor", "Odor forte");

		List<SeedCase> seeds = seedCases(citizenId, staffId);
		int inserted = 0;
		for (SeedCase seed : seeds) {
			if (cases.existsById(seed.id()) || cases.existsByProtocolo(seed.document().protocolo())) {
				continue;
			}
			cases.save(seed.toDocument());
			inserted++;
		}
		LOGGER.info("Demo data ready: {} case records inserted; existing records were preserved.", inserted);
	}

	private String ensureAccount(String id, String email, String name, UserRole role) {
		var existing = accounts.findByEmail(email.toLowerCase(Locale.ROOT));
		if (existing.isPresent()) {
			UserAccount current = existing.get();
			if (current.perfil() != role) {
				throw new IllegalStateException("A reserved demo email is assigned to another role.");
			}
			if (!passwordEncoder.matches(DEMO_PASSWORD, current.passwordHash())) {
				accounts.save(new UserAccount(
						current.id(),
						current.email(),
						current.nome(),
						current.telefone(),
						passwordEncoder.encode(DEMO_PASSWORD),
						current.perfil(),
						current.criadoEm()));
			}
			return current.id();
		}
		accounts.save(new UserAccount(
				id,
				email,
				name,
				null,
				passwordEncoder.encode(DEMO_PASSWORD),
				role,
				Instant.now()));
		return id;
	}

	private void ensureType(String id, String name) {
		if (!types.existsById(id)) {
			types.save(new CaseTypeDocument(id, name, true));
		}
	}

	private List<SeedCase> seedCases(String citizenId, String staffId) {
		Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
		return List.of(
				seed("201", "Gonzaga", "Avenida Ana Costa", "410", -23.9652, -46.3343,
						"extravasamento", CaseStatus.EM_ANALISE, PublicationState.APROVADO, now.minus(2, ChronoUnit.HOURS), citizenId, staffId),
				seed("202", "Boqueirão", "Rua Azevedo Sodré", "82", -23.9712, -46.3263,
						"retorno", CaseStatus.VISITA_AGENDADA, PublicationState.APROVADO, now.minus(5, ChronoUnit.HOURS), citizenId, staffId),
				seed("203", "Aparecida", "Avenida Pedro Lessa", "1450", -23.9751, -46.3078,
						"odor", CaseStatus.RECEBIDO, PublicationState.PENDENTE, now.minus(35, ChronoUnit.MINUTES), citizenId, staffId),
				seed("204", "Embaré", "Avenida Conselheiro Nébias", "610", -23.9645, -46.3222,
						"retorno", CaseStatus.EM_ATENDIMENTO, PublicationState.APROVADO, now.minus(1, ChronoUnit.DAYS), citizenId, staffId),
				seed("205", "Ponta da Praia", "Avenida dos Bancários", "75", -23.9910, -46.2920,
						"extravasamento", CaseStatus.RESOLVIDO, PublicationState.APROVADO, now.minus(3, ChronoUnit.DAYS), citizenId, staffId),
				seed("206", "Macuco", "Rua Silva Jardim", "220", -23.9566, -46.3137,
						"odor", CaseStatus.EM_ANALISE, PublicationState.APROVADO, now.minus(8, ChronoUnit.HOURS), citizenId, staffId),
				seed("207", "Campo Grande", "Rua Carvalho de Mendonça", "510", -23.9523, -46.3420,
						"retorno", CaseStatus.RECEBIDO, PublicationState.PENDENTE, now.minus(20, ChronoUnit.MINUTES), citizenId, staffId),
				seed("208", "Vila Mathias", "Avenida Washington Luís", "300", -23.9432, -46.3298,
						"extravasamento", CaseStatus.VISITA_AGENDADA, PublicationState.APROVADO, now.minus(18, ChronoUnit.HOURS), citizenId, staffId),
				seed("209", "Marapé", "Avenida Pinheiro Machado", "980", -23.9660, -46.3530,
						"odor", CaseStatus.EM_ATENDIMENTO, PublicationState.APROVADO, now.minus(2, ChronoUnit.DAYS), citizenId, staffId),
				seed("210", "José Menino", "Avenida Presidente Wilson", "120", -23.9677, -46.3655,
						"retorno", CaseStatus.RESOLVIDO, PublicationState.APROVADO, now.minus(4, ChronoUnit.DAYS), citizenId, staffId),
				seed("211", "Centro", "Praça Mauá", "1", -23.9350, -46.3284,
						"extravasamento", CaseStatus.EM_ANALISE, PublicationState.APROVADO, now.minus(10, ChronoUnit.HOURS), citizenId, staffId),
				seed("212", "Paquetá", "Rua João Pessoa", "220", -23.9347, -46.3154,
						"odor", CaseStatus.VISITA_AGENDADA, PublicationState.APROVADO, now.minus(12, ChronoUnit.HOURS), citizenId, staffId));
	}

	private SeedCase seed(
			String suffix,
			String neighborhood,
			String street,
			String number,
			double latitude,
			double longitude,
			String typeId,
			CaseStatus status,
			PublicationState publication,
			Instant createdAt,
			String citizenId,
			String staffId) {
		String caseId = "00000000-0000-4000-8000-000000000" + suffix;
		String protocol = "SS-DEMO-2026-" + suffix;
		String type = switch (typeId) {
			case "retorno" -> "Retorno de esgoto";
			case "odor" -> "Odor forte";
			default -> "Extravasamento de esgoto";
		};
		Instant updatedAt = status == CaseStatus.RECEBIDO ? createdAt : createdAt.plus(20, ChronoUnit.MINUTES);
		List<CaseDocument.UpdateSnapshot> updates = new java.util.ArrayList<>();
		updates.add(new CaseDocument.UpdateSnapshot(
				stableId(caseId + "-received"),
				"Cenário fictício para demonstração. O relato aguarda avaliação da equipe.",
				createdAt,
				"Chamado recebido",
				true,
				citizenId));
		if (status != CaseStatus.RECEBIDO) {
			updates.add(new CaseDocument.UpdateSnapshot(
					stableId(caseId + "-update"),
					"Atualização fictícia de acompanhamento para apresentação do fluxo.",
					updatedAt,
					"Atualização de demonstração",
					true,
					staffId));
		}
		CaseDocument.VisitWindow visit = status == CaseStatus.VISITA_AGENDADA
				? new CaseDocument.VisitWindow(updatedAt.plus(1, ChronoUnit.DAYS), updatedAt.plus(1, ChronoUnit.DAYS).plus(4, ChronoUnit.HOURS))
				: null;
		CaseDocument.PublicationReview review = publication == PublicationState.PENDENTE
				? null
				: new CaseDocument.PublicationReview(staffId, updatedAt, null);
		CaseDocument document = new CaseDocument(
				caseId,
				protocol,
				typeId,
				type,
				"CENÁRIO DE DEMONSTRAÇÃO — ocorrência fictícia para apresentação do sistema. "
						+ "Ponto de referência: " + street + ", " + number + ", " + neighborhood + ".",
				createdAt.minus(15, ChronoUnit.MINUTES),
				createdAt,
				updatedAt,
				new CaseDocument.AddressSnapshot(
						"11000000", street, number, false, neighborhood, "Santos", "SP", "Local ilustrativo."),
				new CaseDocument.LocationSnapshot(latitude, longitude),
				status,
				publication,
				review,
				List.of(),
				visit,
				List.copyOf(updates),
				citizenId,
				null,
				null,
				null);
		return new SeedCase(caseId, document);
	}

	private String stableId(String value) {
		return UUID.nameUUIDFromBytes(value.getBytes(StandardCharsets.UTF_8)).toString();
	}

	private record SeedCase(String id, CaseDocument document) {
		private CaseDocument toDocument() {
			return document;
		}
	}
}
