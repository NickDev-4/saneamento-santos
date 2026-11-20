package com.example.backend.infrastructure.persistence.cases;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface InternalCaseNoteRepository extends MongoRepository<InternalCaseNoteDocument, String> {
	Page<InternalCaseNoteDocument> findByChamadoId(String chamadoId, Pageable pageable);
}
