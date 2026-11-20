package com.example.backend.application.cases;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.api.cases.CaseWriteRequest;
import com.example.backend.api.exception.ApiException;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import com.example.backend.infrastructure.persistence.cases.CaseRepository;
import com.example.backend.infrastructure.persistence.cases.CaseTypeDocument;
import com.example.backend.infrastructure.persistence.cases.CaseTypeRepository;
import com.example.backend.infrastructure.persistence.user.UserAccount;
import com.example.backend.infrastructure.persistence.user.UserAccountRepository;
import com.example.backend.security.UserPrincipal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

class CitizenCaseServiceTests {

	private final CaseRepository caseRepository = mock(CaseRepository.class);
	private final CaseTypeRepository caseTypeRepository = mock(CaseTypeRepository.class);
	private final UserAccountRepository userAccountRepository = mock(UserAccountRepository.class);
	private final CaseImageService images = mock(CaseImageService.class);
	private final SantosServiceArea serviceArea = mock(SantosServiceArea.class);
	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final CitizenCaseService service = new CitizenCaseService(
			caseRepository, caseTypeRepository, userAccountRepository, images, serviceArea, mongoTemplate);
	private final UserPrincipal owner = new UserPrincipal(
			"owner-id", "owner@example.test", "Cidadão", null, null, UserRole.CIDADAO);

	@Test
	void createsCaseWithServerOwnedFieldsAndInitialHistory() {
		CaseDocument.ImageSnapshot image = image(UUID.randomUUID().toString());
		when(userAccountRepository.findById(owner.id())).thenReturn(Optional.of(userAccount()));
		when(caseTypeRepository.findById("tipo-id"))
				.thenReturn(Optional.of(new CaseTypeDocument("tipo-id", "Vazamento", true)));
		when(images.storeNewImages(any(), eq(0))).thenReturn(List.of(image));
		when(caseRepository.save(any(CaseDocument.class))).thenAnswer(invocation -> withId(
				invocation.getArgument(0), "case-id"));

		var response = service.create(request(null), List.of(mock(MultipartFile.class)), owner);

		assertEquals("case-id", response.id());
		assertEquals("Vazamento", response.tipo());
		assertEquals(CaseStatus.RECEBIDO, response.status());
		assertEquals(PublicationState.PENDENTE, response.publicacao());
		assertEquals(List.of("editar", "cancelar"), response.acoesPermitidas());
		assertEquals("owner-id", savedCase().autorId());
		assertEquals("Vazamento próximo à residência", savedCase().descricao());
		assertEquals("SS-" + Instant.now().atZone(java.time.ZoneId.of("America/Sao_Paulo")).getYear()
				+ "-", savedCase().protocolo().substring(0, 8));
		assertNotNull(savedCase().criadoEm());
		assertEquals("Chamado recebido", savedCase().atualizacoes().get(0).titulo());
		verify(serviceArea).validate(any(CaseDocument.LocationSnapshot.class));
	}

	@Test
	void refusesCitizenAccessToAnotherOwnersCaseWithoutSaving() {
		when(caseRepository.findById("private-case"))
				.thenReturn(Optional.of(caseWithStatus(CaseStatus.RECEBIDO, "different-owner")));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.edit("private-case", request(null), List.of(), List.of(), owner));

		assertEquals(HttpStatus.NOT_FOUND, exception.status());
		verify(caseRepository, never()).save(any(CaseDocument.class));
		verify(images, never()).storeNewImages(any(), anyInt());
	}

	@Test
	void privateDetailIsHiddenFromAnotherCitizen() {
		when(caseRepository.findById("private-case"))
				.thenReturn(Optional.of(caseWithStatus(CaseStatus.RECEBIDO, "different-owner")));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.detail("private-case", owner));

		assertEquals(HttpStatus.NOT_FOUND, exception.status());
	}

	@Test
	void sabespCanReadPrivateCaseAndAuthorizedAuthorContact() {
		when(caseRepository.findById("case-id"))
				.thenReturn(Optional.of(caseWithStatus(CaseStatus.RECEBIDO, owner.id())));
		when(userAccountRepository.findById(owner.id()))
				.thenReturn(Optional.of(new UserAccount(
						owner.id(), owner.username(), owner.nome(), owner.telefone(), "hash",
						UserRole.CIDADAO, Instant.now())));
		UserPrincipal sabesp = new UserPrincipal(
				"sabesp-id", "sabesp@example.test", "Agente", null, null, UserRole.SABESP);

		var response = service.detail("case-id", sabesp);

		assertEquals(owner.id(), response.autor().id());
		assertEquals(owner.username(), response.autor().email());
	}

	@Test
	void mineListQueryIsAlwaysScopedToAuthenticatedOwner() {
		when(mongoTemplate.count(any(Query.class), eq(CaseDocument.class))).thenReturn(0L);
		when(mongoTemplate.find(any(Query.class), eq(CaseDocument.class))).thenReturn(List.of());

		var result = service.listMine(owner, null, null, null, null, null, 0, 20);

		org.mockito.ArgumentCaptor<Query> query = org.mockito.ArgumentCaptor.forClass(Query.class);
		verify(mongoTemplate).find(query.capture(), eq(CaseDocument.class));
		assertTrue(containsValue(query.getValue().getQueryObject(), owner.id()));
		assertEquals(0, result.totalItems());
	}

	@Test
	void refusesEditingAfterTriageHasStarted() {
		when(caseRepository.findById("case-id"))
				.thenReturn(Optional.of(caseWithStatus(CaseStatus.EM_ANALISE, owner.id())));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.edit("case-id", request(null), List.of(), List.of(), owner));

		assertEquals(HttpStatus.CONFLICT, exception.status());
		verify(caseRepository, never()).save(any(CaseDocument.class));
	}

	@Test
	void editPreservesOnlyExplicitlyRetainedImagesAndAppendsHistory() {
		CaseDocument current = caseWithStatus(CaseStatus.RECEBIDO, owner.id());
		when(userAccountRepository.findById(owner.id())).thenReturn(Optional.of(userAccount()));
		when(caseRepository.findById("case-id")).thenReturn(Optional.of(current));
		when(caseTypeRepository.findById("tipo-id"))
				.thenReturn(Optional.of(new CaseTypeDocument("tipo-id", "Vazamento", true)));
		when(images.storeNewImages(List.of(), 1)).thenReturn(List.of());
		when(caseRepository.save(any(CaseDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

		var response = service.edit(
				"case-id", request(null), List.of(), List.of("image-id"), owner);

		assertEquals("Vazamento próximo à residência", response.descricao());
		assertEquals(List.of("image-id"), response.imagens().stream().map(image -> image.id()).toList());
		assertEquals(2, response.atualizacoes().size());
		verify(images).deleteRemovedImages(List.of());
	}

	@Test
	void reportsConcurrentCancellationAsConflict() {
		when(caseRepository.findById("case-id"))
				.thenReturn(Optional.of(caseWithStatus(CaseStatus.RECEBIDO, owner.id())));
		when(caseRepository.save(any(CaseDocument.class)))
				.thenThrow(new OptimisticLockingFailureException("version changed"));

		ApiException exception = assertThrows(ApiException.class, () -> service.cancel("case-id", owner));

		assertEquals(HttpStatus.CONFLICT, exception.status());
		assertEquals("CASE_STATE_CONFLICT", exception.code());
	}

	@Test
	void onlyAllowsRecurrenceFromOwnersResolvedCase() {
		when(caseTypeRepository.findById("tipo-id"))
				.thenReturn(Optional.of(new CaseTypeDocument("tipo-id", "Vazamento", true)));
		when(caseRepository.findById("previous-id"))
				.thenReturn(Optional.of(caseWithStatus(CaseStatus.EM_ANALISE, owner.id())));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.create(request("previous-id"), List.of(), owner));

		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
		assertEquals(
				"A reincidência deve apontar para um chamado resolvido.",
				exception.fieldErrors().get("reincidenciaDe"));
		verify(images, never()).storeNewImages(any(), anyInt());
	}

	private CaseDocument savedCase() {
		org.mockito.ArgumentCaptor<CaseDocument> captor = org.mockito.ArgumentCaptor.forClass(CaseDocument.class);
		verify(caseRepository).save(captor.capture());
		return captor.getValue();
	}

	private CaseWriteRequest request(String recurrenceId) {
		return new CaseWriteRequest(
				"tipo-id",
				"  Vazamento próximo à residência  ",
				Instant.now().minusSeconds(60),
				new CaseWriteRequest.AddressData(
						"11060-000", "Rua Teste", "10", false, "Gonzaga", "Santos", "SP", "Próximo à praça"),
				new CaseWriteRequest.LocationData(-23.96, -46.33),
				recurrenceId);
	}

	private CaseDocument caseWithStatus(CaseStatus status, String authorId) {
		return new CaseDocument(
				"case-id",
				"SS-2026-1",
				"tipo-id",
				"Vazamento",
				"Descrição",
				Instant.now(),
				Instant.now(),
				Instant.now(),
				null,
				null,
				status,
				PublicationState.PENDENTE,
				null,
				List.of(image("image-id")),
				null,
				List.of(new CaseDocument.UpdateSnapshot(
						"update-id", "Relato recebido", Instant.now(), "Chamado recebido", true, authorId)),
				authorId,
				null,
				null,
				1L);
	}

	private CaseDocument.ImageSnapshot image(String id) {
		return new CaseDocument.ImageSnapshot(
				id, "/api/v1/imagens/" + id, "image/png", false, false);
	}

	private UserAccount userAccount() {
		return new UserAccount(
				owner.id(), owner.username(), owner.nome(), owner.telefone(), "hash", UserRole.CIDADAO, Instant.now());
	}

	private CaseDocument withId(CaseDocument item, String id) {
		return new CaseDocument(
				id,
				item.protocolo(),
				item.tipoId(),
				item.tipo(),
				item.descricao(),
				item.observadoEm(),
				item.criadoEm(),
				item.atualizadoEm(),
				item.endereco(),
				item.localizacao(),
				item.status(),
				item.publicacao(),
				item.revisaoPublicacao(),
				item.imagens(),
				item.previsaoVisita(),
				item.atualizacoes(),
				item.autorId(),
				item.reincidenciaDe(),
				item.vinculoId(),
				0L);
	}

	private boolean containsValue(Object value, String expected) {
		if (value instanceof Map<?, ?> map) {
			return map.values().stream().anyMatch(child -> containsValue(child, expected));
		}
		if (value instanceof Iterable<?> values) {
			for (Object child : values) {
				if (containsValue(child, expected)) {
					return true;
				}
			}
			return false;
		}
		return expected.equals(value);
	}
}
