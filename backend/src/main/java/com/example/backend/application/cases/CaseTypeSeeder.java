package com.example.backend.application.cases;

import com.example.backend.infrastructure.persistence.cases.CaseTypeDocument;
import com.example.backend.infrastructure.persistence.cases.CaseTypeRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class CaseTypeSeeder implements ApplicationRunner {
	private final CaseTypeRepository caseTypes;
	private final ObjectMapper objectMapper;
	private final String seedFile;

	public CaseTypeSeeder(
			CaseTypeRepository caseTypes,
			ObjectMapper objectMapper,
			@Value("${CASE_TYPES_SEED_FILE:}") String seedFile) {
		this.caseTypes = caseTypes;
		this.objectMapper = objectMapper;
		this.seedFile = seedFile;
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		if (seedFile.isBlank()) {
			return;
		}
		Path path = Path.of(seedFile).toAbsolutePath().normalize();
		if (!Files.isRegularFile(path)) {
			throw new IllegalStateException("O arquivo configurado de tipos de chamado não existe.");
		}
		JsonNode rows = objectMapper.readTree(path.toFile());
		if (!rows.isArray()) {
			throw new IllegalStateException("O catálogo de tipos deve ser um array JSON.");
		}
		for (JsonNode row : rows) {
			String id = row.path("id").asString("").trim();
			String name = row.path("nome").asString("").trim();
			if (id.isBlank() || name.isBlank() || id.length() > 100 || name.length() > 100
					|| !row.path("ativo").isBoolean()) {
				throw new IllegalStateException("Cada tipo de chamado exige id, nome e ativo booleano.");
			}
			if (caseTypes.existsById(id)) {
				continue;
			}
			caseTypes.save(new CaseTypeDocument(id, name, row.path("ativo").booleanValue()));
		}
	}
}
