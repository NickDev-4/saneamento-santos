package com.example.backend.infrastructure.persistence.cases;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CaseTypeRepository extends MongoRepository<CaseTypeDocument, String> {
	List<CaseTypeDocument> findByAtivoTrueOrderByNomeAsc();
}
