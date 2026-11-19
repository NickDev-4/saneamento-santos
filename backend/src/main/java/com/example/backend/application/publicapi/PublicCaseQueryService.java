package com.example.backend.application.publicapi;

import com.example.backend.api.exception.ApiException;
import com.example.backend.api.publicapi.PageResponse;
import com.example.backend.api.publicapi.PublicCaseResponse;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import com.example.backend.infrastructure.persistence.cases.CaseRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PublicCaseQueryService {

	private static final ZoneId APPLICATION_ZONE = ZoneId.of("America/Sao_Paulo");
	private static final List<CaseStatus> HIDDEN_STATUSES = List.of(CaseStatus.CANCELADO, CaseStatus.VINCULADO);
	private final MongoTemplate mongoTemplate;
	private final CaseRepository caseRepository;

	public PublicCaseQueryService(MongoTemplate mongoTemplate, CaseRepository caseRepository) {
		this.mongoTemplate = mongoTemplate;
		this.caseRepository = caseRepository;
	}

	public PageResponse<PublicCaseResponse> list(
			String status,
			String tipoId,
			String bairro,
			String criadoDe,
			String criadoAte,
			String q,
			String bbox,
			int page,
			int size) {
		validatePage(page, size);
		List<Criteria> filters = new ArrayList<>();
		filters.add(Criteria.where("publicacao").is(PublicationState.APROVADO));
		filters.add(Criteria.where("status").nin(HIDDEN_STATUSES));

		if (status != null && !status.isBlank()) {
			try {
				filters.add(Criteria.where("status").is(CaseStatus.valueOf(status.trim())));
			} catch (IllegalArgumentException exception) {
				throw invalidField("status", "Status inválido.");
			}
		}
		addTextFilter(filters, "tipoId", tipoId, "tipoId");
		addTextFilter(filters, "endereco.bairro", bairro, "bairro");
		addDateFilters(filters, criadoDe, criadoAte);
		addSearchFilter(filters, q);
		addBoundingBoxFilter(filters, bbox);

		Criteria criteria = new Criteria().andOperator(filters.toArray(Criteria[]::new));
		Query countQuery = new Query(criteria);
		long total = mongoTemplate.count(countQuery, CaseDocument.class);
		Sort sort = Sort.by(Sort.Direction.DESC, "criadoEm").and(Sort.by(Sort.Direction.ASC, "id"));
		PageRequest pageable = PageRequest.of(page, size, sort);
		List<PublicCaseResponse> items = mongoTemplate.find(new Query(criteria).with(pageable), CaseDocument.class)
				.stream()
				.map(PublicCaseResponse::from)
				.toList();
		int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / size);
		return new PageResponse<>(items, page, size, total, totalPages);
	}

	public PublicCaseResponse detail(String id) {
		CaseDocument item = caseRepository.findById(id)
				.filter(this::isPublic)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND",
						"Chamado não encontrado."));
		return PublicCaseResponse.from(item);
	}

	private boolean isPublic(CaseDocument item) {
		return item.publicacao() == PublicationState.APROVADO && !HIDDEN_STATUSES.contains(item.status());
	}

	private void validatePage(int page, int size) {
		if (page < 0) {
			throw invalidField("page", "A página deve ser zero ou maior.");
		}
		if (size < 1 || size > 100) {
			throw invalidField("size", "O tamanho deve estar entre 1 e 100.");
		}
	}

	private void addTextFilter(List<Criteria> filters, String path, String value, String field) {
		if (value != null && !value.isBlank()) {
			String normalized = value.trim();
			if (normalized.length() > 100) {
				throw invalidField(field, "O filtro não pode exceder 100 caracteres.");
			}
			filters.add(Criteria.where(path).is(normalized));
		}
	}

	private void addDateFilters(List<Criteria> filters, String from, String to) {
		Instant start = parseDate(from, "criadoDe", false);
		Instant end = parseDate(to, "criadoAte", true);
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
	}

	private Instant parseDate(String value, String field, boolean exclusiveEnd) {
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

	private void addSearchFilter(List<Criteria> filters, String query) {
		if (query == null || query.isBlank()) {
			return;
		}
		if (query.trim().length() > 100) {
			throw invalidField("q", "A busca não pode exceder 100 caracteres.");
		}
		Pattern pattern = Pattern.compile(Pattern.quote(query.trim()), Pattern.CASE_INSENSITIVE);
		filters.add(new Criteria().orOperator(
				Criteria.where("protocolo").regex(pattern),
				Criteria.where("descricao").regex(pattern)));
	}

	private void addBoundingBoxFilter(List<Criteria> filters, String bbox) {
		if (bbox == null || bbox.isBlank()) {
			return;
		}
		String[] coordinates = bbox.split(",", -1);
		if (coordinates.length != 4) {
			throw invalidField("bbox", "Informe minLongitude,minLatitude,maxLongitude,maxLatitude.");
		}
		try {
			double minLongitude = Double.parseDouble(coordinates[0].trim());
			double minLatitude = Double.parseDouble(coordinates[1].trim());
			double maxLongitude = Double.parseDouble(coordinates[2].trim());
			double maxLatitude = Double.parseDouble(coordinates[3].trim());
			if (!Double.isFinite(minLongitude) || !Double.isFinite(minLatitude)
					|| !Double.isFinite(maxLongitude) || !Double.isFinite(maxLatitude)
					|| minLongitude < -180 || minLongitude > 180 || maxLongitude < -180 || maxLongitude > 180
					|| minLongitude >= maxLongitude || minLatitude < -90 || minLatitude > 90
					|| maxLatitude < -90 || maxLatitude > 90 || minLatitude >= maxLatitude) {
				throw invalidField("bbox", "A área informada não é válida.");
			}
			filters.add(Criteria.where("localizacao.longitude").gte(minLongitude).lte(maxLongitude));
			filters.add(Criteria.where("localizacao.latitude").gte(minLatitude).lte(maxLatitude));
		} catch (NumberFormatException exception) {
			throw invalidField("bbox", "As coordenadas da área devem ser números.");
		}
	}

	private ApiException invalidField(String field, String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
				"Revise os campos indicados.", Map.of(field, message));
	}
}
