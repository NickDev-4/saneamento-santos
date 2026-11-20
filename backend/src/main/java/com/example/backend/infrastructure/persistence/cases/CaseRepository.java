package com.example.backend.infrastructure.persistence.cases;

import java.util.Optional;
import java.util.List;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CaseRepository extends MongoRepository<CaseDocument, String> {
	@Query("{ 'imagens.id': ?0 }")
	Optional<CaseDocument> findFirstByImageId(String imageId);

	List<CaseDocument> findByVinculoId(String vinculoId);
}
