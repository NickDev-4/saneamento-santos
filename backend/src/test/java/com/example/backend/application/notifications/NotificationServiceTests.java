package com.example.backend.application.notifications;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.api.exception.ApiException;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.domain.notifications.NotificationType;
import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import com.example.backend.infrastructure.persistence.cases.CaseRepository;
import com.example.backend.infrastructure.persistence.notifications.NotificationDocument;
import com.example.backend.infrastructure.persistence.notifications.NotificationRepository;
import com.example.backend.security.UserPrincipal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.mockito.ArgumentCaptor;

class NotificationServiceTests {

	private final NotificationRepository notificationRepository = mock(NotificationRepository.class);
	private final CaseRepository caseRepository = mock(CaseRepository.class);
	private final NotificationService service = new NotificationService(notificationRepository, caseRepository);
	private final UserPrincipal owner = new UserPrincipal(
			"owner-id", "owner@example.test", "Cidadão", null, null, UserRole.CIDADAO);

	@Test
	void listsOnlyAuthenticatedRecipientNotifications() {
		when(notificationRepository.findByDestinatarioId(
				org.mockito.ArgumentMatchers.eq(owner.id()),
				org.mockito.ArgumentMatchers.any(Pageable.class)))
				.thenReturn(Page.empty());

		var result = service.list(owner, 0, 20);

		assertEquals(0, result.totalItems());
		verify(notificationRepository).findByDestinatarioId(
				org.mockito.ArgumentMatchers.eq(owner.id()),
				org.mockito.ArgumentMatchers.any(Pageable.class));
	}

	@Test
	void refusesMarkingAnotherUsersNotificationAsRead() {
		when(notificationRepository.findByIdAndDestinatarioId("notice-id", owner.id()))
				.thenReturn(Optional.empty());

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.markRead("notice-id", owner));

		assertEquals(HttpStatus.NOT_FOUND, exception.status());
		verify(notificationRepository, never()).save(org.mockito.ArgumentMatchers.any());
	}

	@Test
	void marksOwnedNotificationReadIdempotently() {
		NotificationDocument unread = notification("notice-id", owner.id(), null, 0L);
		when(notificationRepository.findByIdAndDestinatarioId(unread.id(), owner.id()))
				.thenReturn(Optional.of(unread));
		when(notificationRepository.save(org.mockito.ArgumentMatchers.any(NotificationDocument.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		var first = service.markRead(unread.id(), owner);
		assertNotNull(first.lidaEm());
		NotificationDocument read = notification(
				unread.id(), owner.id(), first.lidaEm(), 1L);
		when(notificationRepository.findByIdAndDestinatarioId(unread.id(), owner.id()))
				.thenReturn(Optional.of(read));

		var repeated = service.markRead(unread.id(), owner);

		assertEquals(first.lidaEm(), repeated.lidaEm());
		verify(notificationRepository).save(org.mockito.ArgumentMatchers.any(NotificationDocument.class));
	}

	@Test
	void notifiesPrincipalOwnerAndAuthorsFollowingLinkedCases() {
		CaseDocument main = caseDocument("main-id", "main-owner", null);
		CaseDocument linked = caseDocument("linked-id", "linked-owner", main.id());
		when(caseRepository.findByVinculoId(main.id())).thenReturn(List.of(linked));

		service.notifyCaseOwners(
				main,
				NotificationType.ATUALIZACAO_PRINCIPAL,
				"Atualização",
				"Há uma nova atualização.");

		ArgumentCaptor<Iterable<NotificationDocument>> captor = ArgumentCaptor.forClass(Iterable.class);
		verify(notificationRepository).saveAll(captor.capture());
		List<NotificationDocument> saved = StreamSupport.stream(captor.getValue().spliterator(), false).toList();
		assertEquals(2, saved.size());
		assertEquals(
				List.of("linked-owner", "main-owner").stream().sorted().toList(),
				saved.stream().map(NotificationDocument::destinatarioId).sorted().toList());
		assertEquals("linked-id", saved.stream()
				.filter(item -> item.destinatarioId().equals("linked-owner"))
				.findFirst()
				.orElseThrow()
				.chamadoId());
	}

	private NotificationDocument notification(String id, String recipientId, Instant readAt, Long version) {
		return new NotificationDocument(
				id,
				recipientId,
				"case-id",
				"SS-2026-1",
				NotificationType.INICIO_ANALISE,
				"Chamado em análise",
				"A equipe iniciou a análise.",
				Instant.now(),
				readAt,
				version);
	}

	private CaseDocument caseDocument(String id, String authorId, String linkedId) {
		return new CaseDocument(
				id,
				"SS-2026-" + id,
				"type-id",
				"Tipo",
				"Descrição",
				Instant.now(),
				Instant.now(),
				Instant.now(),
				null,
				null,
				CaseStatus.EM_ANALISE,
				PublicationState.APROVADO,
				null,
				List.of(),
				null,
				List.of(),
				authorId,
				null,
				linkedId,
				0L);
	}
}
