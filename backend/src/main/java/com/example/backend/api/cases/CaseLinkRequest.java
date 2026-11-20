package com.example.backend.api.cases;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CaseLinkRequest(
		@NotBlank String chamadoPrincipalId,
		@NotBlank @Size(max = 1000) String justificativa) {
}
