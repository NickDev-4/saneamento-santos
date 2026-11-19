package com.example.backend.infrastructure.persistence.cases;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("case_types")
public record CaseTypeDocument(
		@Id String id,
		String nome,
		boolean ativo) {
}
