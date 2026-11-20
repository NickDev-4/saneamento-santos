package com.example.backend.application.indicators;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.api.exception.ApiException;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import java.util.List;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;

class CaseIndicatorsServiceTests {

	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final CaseIndicatorsService service = new CaseIndicatorsService(mongoTemplate);

	@Test
	void aggregatesOnlyPublicMainCasesIntoStatusAndManagementMetrics() {
		AggregationResults<Document> statuses = results(List.of(
				row("EM_ANALISE", 2),
				row("RESOLVIDO", 1),
				row("ENCERRADO_SEM_ATENDIMENTO", 3),
				row("RECEBIDO", 4)));
		AggregationResults<Document> neighborhoods = results(List.of(row("Gonzaga", 6)));
		AggregationResults<Document> types = results(List.of(
				new Document("_id", "tipo-id").append("nome", "Vazamento").append("quantidade", 10L)));
		AggregationResults<Document> recurrences = results(List.of(row(null, 1)));
		when(mongoTemplate.aggregate(any(Aggregation.class), eq(CaseDocument.class), eq(Document.class)))
				.thenReturn(statuses, neighborhoods, types, recurrences);

		var result = service.summarize(null, null, null, null, null);

		assertEquals(6, result.totalAtendimentos());
		assertEquals(4, result.totalRelatosRecebidos());
		assertEquals(2, result.totalAtivos());
		assertEquals(1, result.totalResolvidos());
		assertEquals(3, result.totalEncerradosSemAtendimento());
		assertEquals(1, result.totalReincidencias());
		assertEquals(CaseStatus.EM_ANALISE, result.porStatus().get(0).status());
		assertEquals("Gonzaga", result.porBairro().get(0).nome());
		assertEquals("Vazamento", result.porTipo().get(0).nome());
	}

	@Test
	void rejectsMalformedDateFiltersBeforeQueryingMongo() {
		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.summarize(null, null, null, "data-invalida", null));

		assertEquals("criadoDe", exception.fieldErrors().keySet().iterator().next());
		verify(mongoTemplate, never()).aggregate(
				any(Aggregation.class),
				eq(CaseDocument.class),
				eq(Document.class));
	}

	private AggregationResults<Document> results(List<Document> documents) {
		AggregationResults<Document> results = mock(AggregationResults.class);
		when(results.getMappedResults()).thenReturn(documents);
		return results;
	}

	private Document row(String id, long count) {
		return new Document("_id", id).append("quantidade", count);
	}
}
