package com.example.backend.infrastructure.persistence.user;

import com.example.backend.domain.user.UserRole;
import java.time.Instant;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Id;

@Document("users")
public record UserAccount(
		@Id String id,
		@Indexed(unique = true, name = "uq_users_email") String email,
		String nome,
		String telefone,
		String passwordHash,
		UserRole perfil,
		Instant criadoEm,
		Long passwordVersion) {

	public UserAccount(
			String id,
			String email,
			String nome,
			String telefone,
			String passwordHash,
			UserRole perfil,
			Instant criadoEm) {
		this(id, email, nome, telefone, passwordHash, perfil, criadoEm, 0L);
	}

	public long effectivePasswordVersion() {
		return passwordVersion == null ? 0L : passwordVersion;
	}
}
