package com.example.backend.infrastructure.persistence.cases;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("case_internal_notes")
@CompoundIndex(name = "idx_case_notes_case_created", def = "{ 'chamadoId': 1, 'criadoEm': -1 }")
public record InternalCaseNoteDocument(
		@Id String id,
		String chamadoId,
		String autorId,
		String texto,
		Instant criadoEm) {
}
