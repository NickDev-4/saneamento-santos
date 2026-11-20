package com.example.backend.application.notifications;

import com.example.backend.api.exception.ApiException;
import com.example.backend.api.notifications.NotificationResponse;
import com.example.backend.api.publicapi.PageResponse;
import com.example.backend.domain.notifications.NotificationType;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import com.example.backend.infrastructure.persistence.cases.CaseRepository;
import com.example.backend.infrastructure.persistence.notifications.NotificationDocument;
import com.example.backend.infrastructure.persistence.notifications.NotificationRepository;
import com.example.backend.security.UserPrincipal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

	private final NotificationRepository notificationRepository;
	private final CaseRepository caseRepository;

	public NotificationService(
			NotificationRepository notificationRepository,
			CaseRepository caseRepository) {
		this.notificationRepository = notificationRepository;
		this.caseRepository = caseRepository;
	}

	public PageResponse<NotificationResponse> list(UserPrincipal principal, int page, int size) {
		validatePage(page, size);
		Page<NotificationDocument> result = notificationRepository.findByDestinatarioId(
				principal.id(),
				PageRequest.of(
						page,
						size,
						Sort.by(Sort.Direction.DESC, "criadoEm").and(Sort.by(Sort.Direction.ASC, "id"))));
		return new PageResponse<>(
				result.getContent().stream().map(NotificationResponse::from).toList(),
				page,
				size,
				result.getTotalElements(),
				result.getTotalPages());
	}

	public NotificationResponse markRead(String id, UserPrincipal principal) {
		NotificationDocument current = notificationRepository.findByIdAndDestinatarioId(id, principal.id())
				.orElseThrow(NotificationService::notFound);
		if (current.lidaEm() != null) {
			return NotificationResponse.from(current);
		}
		NotificationDocument updated = new NotificationDocument(
				current.id(),
				current.destinatarioId(),
				current.chamadoId(),
				current.protocolo(),
				current.tipo(),
				current.titulo(),
				current.mensagem(),
				current.criadoEm(),
				Instant.now(),
				current.version());
		try {
			return NotificationResponse.from(notificationRepository.save(updated));
		} catch (OptimisticLockingFailureException exception) {
			throw new ApiException(
					HttpStatus.CONFLICT,
					"NOTIFICATION_STATE_CONFLICT",
					"A notificação foi alterada por outra operação.");
		}
	}

	public void notifyCaseOwners(
			CaseDocument source,
			NotificationType type,
			String title,
			String message) {
		Map<String, CaseDocument> recipients = new LinkedHashMap<>();
		if (source.autorId() != null) {
			recipients.put(source.autorId() + ":" + source.id(), source);
		}
		if (source.id() != null) {
			for (CaseDocument linkedCase : caseRepository.findByVinculoId(source.id())) {
				if (linkedCase.autorId() != null) {
					recipients.put(linkedCase.autorId() + ":" + linkedCase.id(), linkedCase);
				}
			}
		}
		saveNotifications(recipients.entrySet().stream()
				.map(entry -> notification(entry.getValue().autorId(), entry.getValue(), type, title, message))
				.toList());
	}

	public void notifyUser(
			String recipientId,
			CaseDocument relatedCase,
			NotificationType type,
			String title,
			String message) {
		if (recipientId != null) {
			saveNotifications(List.of(notification(recipientId, relatedCase, type, title, message)));
		}
	}

	private NotificationDocument notification(
			String recipientId,
			CaseDocument relatedCase,
			NotificationType type,
			String title,
			String message) {
		return new NotificationDocument(
				UUID.randomUUID().toString(),
				recipientId,
				relatedCase.id(),
				relatedCase.protocolo(),
				type,
				title,
				message,
				Instant.now(),
				null,
				null);
	}

	private void saveNotifications(List<NotificationDocument> notifications) {
		if (!notifications.isEmpty()) {
			notificationRepository.saveAll(new ArrayList<>(notifications));
		}
	}

	private void validatePage(int page, int size) {
		if (page < 0) {
			throw new ApiException(
					HttpStatus.BAD_REQUEST,
					"VALIDATION_ERROR",
					"Revise os parâmetros de paginação.",
					Map.of("page", "A página deve ser zero ou maior."));
		}
		if (size < 1 || size > 100) {
			throw new ApiException(
					HttpStatus.BAD_REQUEST,
					"VALIDATION_ERROR",
					"Revise os parâmetros de paginação.",
					Map.of("size", "O tamanho deve estar entre 1 e 100."));
		}
	}

	private static ApiException notFound() {
		return new ApiException(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", "Notificação não encontrada.");
	}
}
