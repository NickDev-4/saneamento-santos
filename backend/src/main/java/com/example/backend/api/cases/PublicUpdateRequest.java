package com.example.backend.api.cases;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PublicUpdateRequest(
		@NotBlank @Size(max = 100) String titulo,
		@NotBlank @Size(max = 4000) String texto) {
}
