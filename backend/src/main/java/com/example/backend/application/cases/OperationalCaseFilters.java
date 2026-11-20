package com.example.backend.application.cases;

import com.example.backend.api.exception.ApiException;
import com.example.backend.domain.cases.CaseStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.data.mongodb.core.query.Criteria;

public final class OperationalCaseFilters {

	private static final ZoneId APPLICATION_ZONE = ZoneId.of("America/Sao_Paulo");

	private OperationalCaseFilters() {
	}

	public static List<Criteria> build(
			String status,
			String tipoId,
			String bairro,
			String criadoDe,
			String criadoAte) {
		List<Criteria> filters = new ArrayList<>();
		if (status != null && !status.isBlank()) {
			try {
				filters.add(Criteria.where("status").is(CaseStatus.valueOf(status.trim())));
			} catch (IllegalArgumentException exception) {
				throw invalidField("status", "Status inválido.");
			}
		}
		addTextFilter(filters, "tipoId", tipoId, "tipoId");
		addTextFilter(filters, "endereco.bairro", bairro, "bairro");
		Instant start = parseDate(criadoDe, "criadoDe", false);
		Instant end = parseDate(criadoAte, "criadoAte", true);
		if (start != null && end != null && !start.isBefore(end)) {
			throw invalidField("criadoAte", "A data final deve ser posterior à data inicial.");
		}
		if (start != null || end != null) {
			Criteria range = Criteria.where("criadoEm");
			if (start != null) {
				range.gte(start);
			}
			if (end != null) {
				range.lt(end);
			}
			filters.add(range);
		}
		return List.copyOf(filters);
	}

	public static Criteria combine(List<Criteria> filters) {
		return filters.isEmpty()
				? new Criteria()
				: new Criteria().andOperator(filters.toArray(Criteria[]::new));
	}

	private static void addTextFilter(List<Criteria> filters, String path, String value, String field) {
		if (value != null && !value.isBlank()) {
			String normalized = value.trim();
			if (normalized.length() > 100) {
				throw invalidField(field, "O filtro não pode exceder 100 caracteres.");
			}
			filters.add(Criteria.where(path).is(normalized));
		}
	}

	private static Instant parseDate(String value, String field, boolean exclusiveEnd) {
		if (value == null || value.isBlank()) {
			return null;
		}
		try {
			LocalDate date = LocalDate.parse(value.trim());
			return (exclusiveEnd ? date.plusDays(1) : date).atStartOfDay(APPLICATION_ZONE).toInstant();
		} catch (DateTimeParseException exception) {
			throw invalidField(field, "Use uma data no formato AAAA-MM-DD.");
		}
	}

	private static ApiException invalidField(String field, String message) {
		return new ApiException(
				org.springframework.http.HttpStatus.BAD_REQUEST,
				"VALIDATION_ERROR",
				"Revise os campos indicados.",
				Map.of(field, message));
	}
}
