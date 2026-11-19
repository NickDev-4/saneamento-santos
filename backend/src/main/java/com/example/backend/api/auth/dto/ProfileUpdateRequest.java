package com.example.backend.api.auth.dto;

import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
		@Size(min = 2, max = 80) String nome,
		@Size(max = 32) String telefone) {
}
