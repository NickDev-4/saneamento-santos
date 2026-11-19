package com.example.backend.api.auth.dto;

import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.user.UserAccount;

public record UserResponse(String id, String nome, String email, String telefone, UserRole perfil) {
	public static UserResponse from(UserAccount account) {
		return new UserResponse(account.id(), account.nome(), account.email(), account.telefone(), account.perfil());
	}
}
