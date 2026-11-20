package com.example.backend.infrastructure.persistence.notifications;

import com.example.backend.domain.notifications.NotificationType;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("notifications")
@CompoundIndex(name = "idx_notifications_recipient_created", def = "{ 'destinatarioId': 1, 'criadoEm': -1 }")
public record NotificationDocument(
		@Id String id,
		String destinatarioId,
		String chamadoId,
		String protocolo,
		NotificationType tipo,
		String titulo,
		String mensagem,
		Instant criadoEm,
		Instant lidaEm,
		@Version Long version) {
}
