package com.example.backend.api.cases;

import com.example.backend.domain.cases.CaseStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StatusTransitionRequest(
		@NotNull CaseStatus status,
		@Size(max = 1000) String justificativa,
		@Size(max = 2000) String comentarioPublico) {
}
