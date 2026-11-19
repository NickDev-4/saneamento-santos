package com.example.backend.infrastructure.persistence.cases;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface CaseRepository extends MongoRepository<CaseDocument, String> {
}
