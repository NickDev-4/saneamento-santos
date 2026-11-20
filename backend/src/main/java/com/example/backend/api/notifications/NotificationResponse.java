package com.example.backend.api.notifications;

import com.example.backend.domain.notifications.NotificationType;
import com.example.backend.infrastructure.persistence.notifications.NotificationDocument;
import java.time.Instant;

public record NotificationResponse(
		String id,
		String chamadoId,
		String protocolo,
		NotificationType tipo,
		String titulo,
		String mensagem,
		Instant criadoEm,
		Instant lidaEm,
		boolean lida) {

	public static NotificationResponse from(NotificationDocument item) {
		return new NotificationResponse(
				item.id(),
				item.chamadoId(),
				item.protocolo(),
				item.tipo(),
				item.titulo(),
				item.mensagem(),
				item.criadoEm(),
				item.lidaEm(),
				item.lidaEm() != null);
	}
}
