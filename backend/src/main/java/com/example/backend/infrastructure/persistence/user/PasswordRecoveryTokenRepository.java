package com.example.backend.infrastructure.persistence.user;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface PasswordRecoveryTokenRepository extends MongoRepository<PasswordRecoveryToken, String> {
	void deleteByAccountId(String accountId);
}
