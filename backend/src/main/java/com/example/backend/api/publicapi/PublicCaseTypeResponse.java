package com.example.backend.api.publicapi;

import com.example.backend.infrastructure.persistence.cases.CaseTypeDocument;

public record PublicCaseTypeResponse(String id, String nome) {
	public static PublicCaseTypeResponse from(CaseTypeDocument type) {
		return new PublicCaseTypeResponse(type.id(), type.nome());
	}
}
