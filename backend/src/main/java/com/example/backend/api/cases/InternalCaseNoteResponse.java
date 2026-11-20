package com.example.backend.api.cases;

import com.example.backend.infrastructure.persistence.cases.InternalCaseNoteDocument;
import java.time.Instant;

public record InternalCaseNoteResponse(
		String id,
		String chamadoId,
		String autorId,
		String texto,
		Instant criadoEm) {

	public static InternalCaseNoteResponse from(InternalCaseNoteDocument note) {
		return new InternalCaseNoteResponse(
				note.id(),
				note.chamadoId(),
				note.autorId(),
				note.texto(),
				note.criadoEm());
	}
}
