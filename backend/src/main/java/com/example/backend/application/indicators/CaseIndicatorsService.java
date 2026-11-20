package com.example.backend.application.indicators;

import com.example.backend.api.indicators.CaseIndicatorsResponse;
import com.example.backend.application.cases.OperationalCaseFilters;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.GroupOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

@Service
public class CaseIndicatorsService {

	private final MongoTemplate mongoTemplate;

	public CaseIndicatorsService(MongoTemplate mongoTemplate) {
		this.mongoTemplate = mongoTemplate;
	}

	public CaseIndicatorsResponse summarize(
			String status,
			String tipoId,
			String bairro,
			String criadoDe,
			String criadoAte) {
		List<Criteria> filters = new ArrayList<>(
				OperationalCaseFilters.build(status, tipoId, bairro, criadoDe, criadoAte));
		filters.add(Criteria.where("publicacao").is(PublicationState.APROVADO));
		filters.add(Criteria.where("status").nin(CaseStatus.VINCULADO, CaseStatus.CANCELADO));
		Criteria criteria = OperationalCaseFilters.combine(filters);

		List<CaseIndicatorsResponse.StatusCount> statuses = aggregate(
				criteria,
				Aggregation.group("status").count().as("quantidade"),
				Sort.by(Sort.Direction.ASC, "_id")).stream()
				.map(row -> new CaseIndicatorsResponse.StatusCount(
						CaseStatus.valueOf(row.getString("_id")),
						number(row, "quantidade")))
				.toList();
		long received = sumStatuses(statuses, CaseStatus.RECEBIDO);
		long totalAttendances = statuses.stream()
				.filter(count -> count.status() != CaseStatus.RECEBIDO)
				.mapToLong(CaseIndicatorsResponse.StatusCount::quantidade)
				.sum();
		long active = sumStatuses(
				statuses,
				CaseStatus.EM_ANALISE,
				CaseStatus.VISITA_AGENDADA,
				CaseStatus.EM_ATENDIMENTO);
		long resolved = sumStatuses(statuses, CaseStatus.RESOLVIDO);
		long closed = sumStatuses(statuses, CaseStatus.ENCERRADO_SEM_ATENDIMENTO);

		List<CaseIndicatorsResponse.CountByLabel> neighborhoods = aggregate(
				new Criteria().andOperator(criteria, Criteria.where("endereco.bairro").exists(true)),
				Aggregation.group("endereco.bairro").count().as("quantidade"),
				Sort.by(Sort.Direction.DESC, "quantidade").and(Sort.by(Sort.Direction.ASC, "_id"))).stream()
				.map(row -> new CaseIndicatorsResponse.CountByLabel(
						row.getString("_id"),
						number(row, "quantidade")))
				.toList();
		List<CaseIndicatorsResponse.TypeCount> types = aggregate(
				criteria,
				Aggregation.group("tipoId").first("tipo").as("nome").count().as("quantidade"),
				Sort.by(Sort.Direction.DESC, "quantidade").and(Sort.by(Sort.Direction.ASC, "_id"))).stream()
				.map(row -> new CaseIndicatorsResponse.TypeCount(
						row.getString("_id"),
						row.getString("nome"),
						number(row, "quantidade")))
				.toList();
		long recurrences = countRecurrences(criteria);

		return new CaseIndicatorsResponse(
				Instant.now(),
				totalAttendances,
				received,
				active,
				resolved,
				closed,
				recurrences,
				statuses,
				neighborhoods,
				types);
	}

	private List<Document> aggregate(Criteria criteria, GroupOperation group, Sort sort) {
		Aggregation aggregation = Aggregation.newAggregation(
				Aggregation.match(criteria),
				group,
				Aggregation.sort(sort));
		AggregationResults<Document> results = mongoTemplate.aggregate(
				aggregation,
				CaseDocument.class,
				Document.class);
		return results.getMappedResults();
	}

	private long countRecurrences(Criteria criteria) {
		Criteria recurrenceCriteria = new Criteria().andOperator(
				criteria,
				Criteria.where("status").ne(CaseStatus.RECEBIDO),
				Criteria.where("reincidenciaDe").exists(true).ne(null));
		Aggregation aggregation = Aggregation.newAggregation(
				Aggregation.match(recurrenceCriteria),
				Aggregation.count().as("quantidade"));
		List<Document> results = mongoTemplate.aggregate(
				aggregation,
				CaseDocument.class,
				Document.class).getMappedResults();
		return results.isEmpty() ? 0 : number(results.get(0), "quantidade");
	}

	private long sumStatuses(
			List<CaseIndicatorsResponse.StatusCount> counts,
			CaseStatus... included) {
		return counts.stream()
				.filter(count -> List.of(included).contains(count.status()))
				.mapToLong(CaseIndicatorsResponse.StatusCount::quantidade)
				.sum();
	}

	private long number(Document document, String field) {
		Number value = document.get(field, Number.class);
		return value == null ? 0 : value.longValue();
	}
}
