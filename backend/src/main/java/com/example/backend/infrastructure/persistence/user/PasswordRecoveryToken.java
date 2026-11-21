package com.example.backend.infrastructure.persistence.user;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("password_recovery_tokens")
public record PasswordRecoveryToken(
		@Id String id,
		@Indexed(unique = true, name = "uq_password_recovery_token_hash") String tokenHash,
		String accountId,
		@Indexed(expireAfter = "0s") Instant expiresAt,
		boolean consumed,
		Instant consumedAt) {
}
