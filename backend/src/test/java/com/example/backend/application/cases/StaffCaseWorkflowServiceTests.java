package com.example.backend.application.cases;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.api.cases.CaseLinkRequest;
import com.example.backend.api.cases.InternalCaseNoteResponse;
import com.example.backend.api.cases.PublicUpdateRequest;
import com.example.backend.api.cases.PublicationRequest;
import com.example.backend.api.cases.StatusTransitionRequest;
import com.example.backend.api.cases.VisitWindowRequest;
import com.example.backend.api.exception.ApiException;
import com.example.backend.application.notifications.NotificationService;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import com.example.backend.infrastructure.persistence.cases.CaseRepository;
import com.example.backend.infrastructure.persistence.cases.InternalCaseNoteRepository;
import com.example.backend.security.UserPrincipal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

class StaffCaseWorkflowServiceTests {

	private final CaseRepository caseRepository = mock(CaseRepository.class);
	private final InternalCaseNoteRepository noteRepository = mock(InternalCaseNoteRepository.class);
	private final CaseImageService images = mock(CaseImageService.class);
	private final NotificationService notifications = mock(NotificationService.class);
	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final StaffCaseWorkflowService service = new StaffCaseWorkflowService(
			caseRepository, noteRepository, images, notifications, mongoTemplate);
	private final UserPrincipal sabesp = new UserPrincipal(
			"staff-id", "staff@example.test", "Agente", null, null, UserRole.SABESP);

	@Test
	void startsAnalysisAndRecordsActorAndNotification() {
		when(caseRepository.findById("case-id")).thenReturn(Optional.of(caseOf(CaseStatus.RECEBIDO)));
		when(caseRepository.save(any(CaseDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

		var response = service.transition(
				"case-id",
				new StatusTransitionRequest(CaseStatus.EM_ANALISE, null, null),
				null,
				sabesp);

		assertEquals(CaseStatus.EM_ANALISE, response.status());
		CaseDocument saved = savedCase();
		assertEquals("staff-id", saved.atualizacoes().get(saved.atualizacoes().size() - 1).autorId());
		verify(notifications).notifyCaseOwners(
				any(CaseDocument.class),
				eq(com.example.backend.domain.notifications.NotificationType.INICIO_ANALISE),
				eq("Chamado em análise"),
				any(String.class));
	}

	@Test
	void refusesSkippingRequiredWorkflowTransitions() {
		when(caseRepository.findById("case-id")).thenReturn(Optional.of(caseOf(CaseStatus.RECEBIDO)));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.transition(
						"case-id",
						new StatusTransitionRequest(CaseStatus.RESOLVIDO, "motivo", "concluído"),
						null,
						sabesp));

		assertEquals(HttpStatus.CONFLICT, exception.status());
		verify(caseRepository, never()).save(any(CaseDocument.class));
	}

	@Test
	void internalNotesStayOutsideCitizenAndPublicUpdateHistory() {
		when(caseRepository.findById("case-id")).thenReturn(Optional.of(caseOf(CaseStatus.EM_ANALISE)));
		when(noteRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

		InternalCaseNoteResponse note = service.addInternalNote("case-id", "Contato operacional realizado.", sabesp);

		assertEquals("Contato operacional realizado.", note.texto());
		verify(caseRepository, never()).save(any(CaseDocument.class));
		verify(notifications, never()).notifyCaseOwners(
				any(CaseDocument.class),
				any(),
				any(String.class),
				any(String.class));
	}

	@Test
	void publicUpdatesAreVisibleToOwnerButNotPublishedByPrivateCases() {
		CaseDocument current = caseOf(CaseStatus.EM_ANALISE);
		when(caseRepository.findById("case-id")).thenReturn(Optional.of(current));
		when(caseRepository.save(any(CaseDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));
		when(caseRepository.findByVinculoId("case-id")).thenReturn(List.of());

		var response = service.addPublicUpdate(
				"case-id",
				new PublicUpdateRequest("Etapa atual", "A equipe verificará o local."),
				sabesp);

		assertEquals("A equipe verificará o local.", response.atualizacoes().get(1).texto());
		CaseDocument saved = savedCase();
		assertEquals(false, com.example.backend.application.publicapi.CasePublicVisibility.isPublic(saved));
		assertEquals(true, saved.atualizacoes().get(1).publicada());
	}

	@Test
	void resolutionRequiresPublicCommentAndApprovesOptionalImageOnlyWhenCaseIsPublic() {
		CaseDocument current = caseOf(CaseStatus.EM_ATENDIMENTO, PublicationState.APROVADO);
		MultipartFile file = mock(MultipartFile.class);
		when(caseRepository.findById("case-id")).thenReturn(Optional.of(current));
		when(images.storeNewImages(List.of(file), 0)).thenReturn(List.of(image("resolution-image", false)));
		when(caseRepository.save(any(CaseDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.transition(
						"case-id",
						new StatusTransitionRequest(CaseStatus.RESOLVIDO, null, " "),
						null,
						sabesp));

		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
		var response = service.transition(
				"case-id",
				new StatusTransitionRequest(CaseStatus.RESOLVIDO, null, "Reparo concluído."),
				file,
				sabesp);

		assertEquals(CaseStatus.RESOLVIDO, response.status());
		assertEquals("Reparo concluído.", savedCase().atualizacoes().get(1).texto());
		assertEquals(true, savedCase().imagens().get(1).aprovada());
	}

	@Test
	void schedulingMovesAnalysisToVisitAndRejectsInvalidWindow() {
		CaseDocument current = caseOf(CaseStatus.EM_ANALISE);
		when(caseRepository.findById("case-id")).thenReturn(Optional.of(current));
		when(caseRepository.save(any(CaseDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));
		Instant start = Instant.now().plusSeconds(3600);

		var response = service.setForecast(
				"case-id",
				new VisitWindowRequest(start, start.plusSeconds(1800)),
				sabesp);

		assertEquals(CaseStatus.VISITA_AGENDADA, response.status());
		assertEquals(start, response.previsaoVisita().inicio());

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.setForecast(
						"case-id",
						new VisitWindowRequest(start, start),
						sabesp));
		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
	}

	@Test
	void publicationRejectionRequiresReasonAndApprovalAuditsReviewerAndImages() {
		CaseDocument current = caseOf(CaseStatus.RECEBIDO);
		when(caseRepository.findById("case-id")).thenReturn(Optional.of(current));
		when(caseRepository.save(any(CaseDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.changePublication(
						"case-id",
						new PublicationRequest(PublicationState.REJEITADO, " "),
						sabesp));
		assertEquals(HttpStatus.BAD_REQUEST, exception.status());

		service.changePublication(
				"case-id",
				new PublicationRequest(PublicationState.APROVADO, null),
				sabesp);

		CaseDocument saved = savedCase();
		assertEquals(PublicationState.APROVADO, saved.publicacao());
		assertEquals("staff-id", saved.revisaoPublicacao().revisadoPor());
		assertNotNull(saved.revisaoPublicacao().revisadoEm());
		assertEquals(true, saved.imagens().get(0).aprovada());
	}

	@Test
	void linksOnlyActiveDuplicatesToActiveUnlinkedPrincipalsAndClearsForecast() {
		CaseDocument duplicate = caseOf(CaseStatus.VISITA_AGENDADA);
		CaseDocument main = new CaseDocument(
				"main-id", "SS-2026-MAIN", "type-id", "Tipo", "Descrição", Instant.now(), Instant.now(),
				Instant.now(), null, null, CaseStatus.EM_ATENDIMENTO, PublicationState.APROVADO, null,
				List.of(), null, List.of(new CaseDocument.UpdateSnapshot(
						"main-initial-update", "Chamado recebido", Instant.now(), "Recebido", true, "main-owner")),
				"main-owner", null, null, 2L);
		when(caseRepository.findById("duplicate-id")).thenReturn(Optional.of(duplicate));
		when(caseRepository.findById("main-id")).thenReturn(Optional.of(main));
		when(caseRepository.findByVinculoId("main-id")).thenReturn(List.of());
		when(caseRepository.save(any(CaseDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

		var response = service.linkDuplicate(
				"duplicate-id",
				new CaseLinkRequest("main-id", "Mesmo vazamento."),
				sabesp);

		assertEquals(CaseStatus.VINCULADO, response.status());
		List<CaseDocument> saved = savedCases();
		CaseDocument linked = saved.stream().filter(item -> item.status() == CaseStatus.VINCULADO).findFirst()
				.orElseThrow();
		CaseDocument updatedMain = saved.stream().filter(item -> item.id().equals("main-id")).findFirst()
				.orElseThrow();
		assertEquals("main-id", linked.vinculoId());
		assertNull(linked.previsaoVisita());
		assertEquals(false, linked.atualizacoes().get(1).publicada());
		assertEquals("staff-id", updatedMain.atualizacoes().get(1).autorId());
		verify(notifications).notifyUser(
				eq("citizen-id"),
				any(CaseDocument.class),
				eq(com.example.backend.domain.notifications.NotificationType.VINCULO),
				any(String.class),
				any(String.class));
		verify(notifications).notifyCaseOwners(
				any(CaseDocument.class),
				eq(com.example.backend.domain.notifications.NotificationType.VINCULO),
				any(String.class),
				any(String.class));
	}

	@Test
	void refusesLinkToAnotherLinkedCase() {
		CaseDocument linkedMain = new CaseDocument(
				"main-id", "SS-2026-MAIN", "type-id", "Tipo", "Descrição", Instant.now(), Instant.now(),
				Instant.now(), null, null, CaseStatus.EM_ANALISE, PublicationState.APROVADO, null,
				List.of(), null, List.of(), "main-owner", null, "other-main", 2L);
		when(caseRepository.findById("case-id")).thenReturn(Optional.of(caseOf(CaseStatus.EM_ANALISE)));
		when(caseRepository.findById("main-id")).thenReturn(Optional.of(linkedMain));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.linkDuplicate(
						"case-id",
						new CaseLinkRequest("main-id", "Mesmo problema."),
						sabesp));

		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
		verify(caseRepository, never()).save(any(CaseDocument.class));
	}

	@Test
	void refusesConvertingAnExistingPrincipalIntoDuplicate() {
		CaseDocument existingLinked = caseOf(CaseStatus.VINCULADO);
		when(caseRepository.findById("case-id")).thenReturn(Optional.of(caseOf(CaseStatus.EM_ANALISE)));
		when(caseRepository.findByVinculoId("case-id")).thenReturn(List.of(existingLinked));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.linkDuplicate(
						"case-id",
						new CaseLinkRequest("main-id", "Mesmo problema."),
						sabesp));

		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
		verify(caseRepository, never()).findById("main-id");
		verify(caseRepository, never()).save(any(CaseDocument.class));
	}

	private CaseDocument savedCase() {
		org.mockito.ArgumentCaptor<CaseDocument> captor = org.mockito.ArgumentCaptor.forClass(CaseDocument.class);
		verify(caseRepository).save(captor.capture());
		return captor.getValue();
	}

	private List<CaseDocument> savedCases() {
		org.mockito.ArgumentCaptor<CaseDocument> captor = org.mockito.ArgumentCaptor.forClass(CaseDocument.class);
		verify(caseRepository, times(2)).save(captor.capture());
		return captor.getAllValues();
	}

	private CaseDocument caseOf(CaseStatus status) {
		return caseOf(status, PublicationState.PENDENTE);
	}

	private CaseDocument caseOf(CaseStatus status, PublicationState publication) {
		return new CaseDocument(
				"case-id",
				"SS-2026-CASE",
				"type-id",
				"Tipo",
				"Descrição",
				Instant.now(),
				Instant.now(),
				Instant.now(),
				null,
				null,
				status,
				publication,
				null,
				List.of(image("existing-image", false)),
				status == CaseStatus.VISITA_AGENDADA
						? new CaseDocument.VisitWindow(Instant.now().plusSeconds(60), Instant.now().plusSeconds(600))
						: null,
				List.of(new CaseDocument.UpdateSnapshot(
						"initial-update", "Recebido", Instant.now(), "Chamado recebido", true, "citizen-id")),
				"citizen-id",
				null,
				null,
				1L);
	}

	private CaseDocument.ImageSnapshot image(String id, boolean approved) {
		return new CaseDocument.ImageSnapshot(
				id,
				"/api/v1/imagens/" + id,
				"image/png",
				false,
				approved);
	}
}
