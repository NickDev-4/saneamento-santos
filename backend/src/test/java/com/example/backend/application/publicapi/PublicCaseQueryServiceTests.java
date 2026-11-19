package com.example.backend.application.publicapi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.api.exception.ApiException;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import com.example.backend.infrastructure.persistence.cases.CaseRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;

class PublicCaseQueryServiceTests {

	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final CaseRepository caseRepository = mock(CaseRepository.class);
	private final PublicCaseQueryService service = new PublicCaseQueryService(mongoTemplate, caseRepository);

	@Test
	void returnsContractPaginationForEmptyPublicResults() {
		when(mongoTemplate.count(any(Query.class), eq(CaseDocument.class))).thenReturn(0L);
		when(mongoTemplate.find(any(Query.class), eq(CaseDocument.class))).thenReturn(List.of());

		var result = service.list(null, null, null, null, null, null, null, 0, 20);

		assertEquals(List.of(), result.items());
		assertEquals(0, result.page());
		assertEquals(20, result.size());
		assertEquals(0L, result.totalItems());
		assertEquals(0, result.totalPages());
	}

	@Test
	void listQueryAlwaysExcludesUnpublishedCancelledAndLinkedCases() {
		when(mongoTemplate.count(any(Query.class), eq(CaseDocument.class))).thenReturn(0L);
		when(mongoTemplate.find(any(Query.class), eq(CaseDocument.class))).thenReturn(List.of());

		service.list(null, null, null, null, null, null, null, 0, 20);

		ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
		verify(mongoTemplate).find(query.capture(), eq(CaseDocument.class));
		Map<String, Object> queryDocument = query.getValue().getQueryObject();
		assertTrue(containsValue(queryDocument, "APROVADO"));
		assertTrue(containsValue(queryDocument, "CANCELADO"));
		assertTrue(containsValue(queryDocument, "VINCULADO"));
	}

	@Test
	void rejectsInvalidBoundingBoxBeforeQueryingMongo() {
		ApiException exception = assertThrows(ApiException.class, () -> service.list(
				null, null, null, null, null, null, "-181,-91,181,91", 0, 20));

		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
		assertEquals("bbox", exception.fieldErrors().keySet().iterator().next());
	}

	@Test
	void rejectsNonFiniteBoundingBoxCoordinates() {
		ApiException exception = assertThrows(ApiException.class, () -> service.list(
				null, null, null, null, null, null, "NaN,0,1,1", 0, 20));

		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
		assertEquals("A área informada não é válida.", exception.fieldErrors().get("bbox"));
	}

	@Test
	void neverReturnsLinkedCasesFromPublicDetail() {
		CaseDocument linked = new CaseDocument(
				"case-id", "SS-1", "type-id", "Tipo", "Descrição", Instant.now(), Instant.now(), Instant.now(),
				null, null, CaseStatus.VINCULADO, PublicationState.APROVADO, List.of(), null, List.of(),
				"author-id", null, "main-id", null);
		when(caseRepository.findById("case-id")).thenReturn(Optional.of(linked));

		ApiException exception = assertThrows(ApiException.class, () -> service.detail("case-id"));

		assertEquals(HttpStatus.NOT_FOUND, exception.status());
		verify(caseRepository).findById("case-id");
	}

	@Test
	void publicResponseExcludesUnapprovedImagesAndPrivateUpdates() {
		CaseDocument item = new CaseDocument(
				"case-id", "SS-1", "type-id", "Tipo", "Descrição", Instant.now(), Instant.now(), Instant.now(),
				null, null, CaseStatus.RESOLVIDO, PublicationState.APROVADO,
				List.of(
						new CaseDocument.ImageSnapshot("public-id", "/public/image", "image/png", false, true),
						new CaseDocument.ImageSnapshot("private-id", "/private/image", "image/png", false, false)),
				null,
				List.of(
						new CaseDocument.UpdateSnapshot("public-update", "Público", Instant.now(), null, true),
						new CaseDocument.UpdateSnapshot("private-update", "Interno", Instant.now(), null, false)),
				"author-id", null, null, null);

		var response = com.example.backend.api.publicapi.PublicCaseResponse.from(item);

		assertEquals(List.of("public-id"), response.imagens().stream().map(image -> image.id()).toList());
		assertEquals("/api/v1/public/imagens/public-id", response.imagens().get(0).url());
		assertEquals(List.of("public-update"), response.atualizacoes().stream().map(update -> update.id()).toList());
		assertEquals(List.of(), response.acoesPermitidas());
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
		return expected.equals(value instanceof Enum<?> enumValue ? enumValue.name() : value);
	}
}
