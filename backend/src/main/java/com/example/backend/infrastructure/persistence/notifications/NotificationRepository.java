package com.example.backend.infrastructure.persistence.notifications;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationRepository extends MongoRepository<NotificationDocument, String> {
	Page<NotificationDocument> findByDestinatarioId(String destinatarioId, Pageable pageable);

	Optional<NotificationDocument> findByIdAndDestinatarioId(String id, String destinatarioId);
}
