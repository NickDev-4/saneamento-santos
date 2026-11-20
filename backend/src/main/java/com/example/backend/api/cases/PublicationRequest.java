package com.example.backend.api.cases;

import com.example.backend.domain.cases.PublicationState;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PublicationRequest(
		@NotNull PublicationState publicacao,
		@Size(max = 1000) String justificativa) {
}
