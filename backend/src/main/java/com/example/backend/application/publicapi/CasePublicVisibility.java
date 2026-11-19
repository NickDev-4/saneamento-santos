package com.example.backend.application.publicapi;

import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import java.util.List;

public final class CasePublicVisibility {

	private static final List<CaseStatus> HIDDEN_STATUSES = List.of(CaseStatus.CANCELADO, CaseStatus.VINCULADO);

	private CasePublicVisibility() {
	}

	public static List<CaseStatus> hiddenStatuses() {
		return HIDDEN_STATUSES;
	}

	public static boolean isPublic(CaseDocument item) {
		return item.publicacao() == PublicationState.APROVADO && !HIDDEN_STATUSES.contains(item.status());
	}
}
