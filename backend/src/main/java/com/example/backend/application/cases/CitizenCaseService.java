package com.example.backend.application.cases;

import com.example.backend.api.cases.CaseWriteRequest;
import com.example.backend.api.cases.CitizenCaseResponse;
import com.example.backend.api.auth.dto.UserResponse;
import com.example.backend.api.exception.ApiException;
import com.example.backend.api.publicapi.PageResponse;
import com.example.backend.application.publicapi.CasePublicVisibility;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import com.example.backend.infrastructure.persistence.cases.CaseRepository;
import com.example.backend.infrastructure.persistence.cases.CaseTypeDocument;
import com.example.backend.infrastructure.persistence.cases.CaseTypeRepository;
import com.example.backend.infrastructure.persistence.user.UserAccountRepository;
import com.example.backend.security.UserPrincipal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CitizenCaseService {

	private static final ZoneId APPLICATION_ZONE = ZoneId.of("America/Sao_Paulo");
	private final CaseRepository caseRepository;
	private final CaseTypeRepository caseTypeRepository;
	private final UserAccountRepository userAccountRepository;
	private final CaseImageService images;
	private final SantosServiceArea serviceArea;
	private final MongoTemplate mongoTemplate;

	public CitizenCaseService(
			CaseRepository caseRepository,
			CaseTypeRepository caseTypeRepository,
			UserAccountRepository userAccountRepository,
			CaseImageService images,
			SantosServiceArea serviceArea,
			MongoTemplate mongoTemplate) {
		this.caseRepository = caseRepository;
		this.caseTypeRepository = caseTypeRepository;
		this.userAccountRepository = userAccountRepository;
		this.images = images;
		this.serviceArea = serviceArea;
		this.mongoTemplate = mongoTemplate;
	}

	public PageResponse<CitizenCaseResponse> listMine(
			UserPrincipal principal,
			String status,
			String tipoId,
			String bairro,
			String criadoDe,
			String criadoAte,
			int page,
			int size) {
		validatePage(page, size);
		List<Criteria> filters = new ArrayList<>();
		filters.add(Criteria.where("autorId").is(principal.id()));
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

		Criteria criteria = new Criteria().andOperator(filters.toArray(Criteria[]::new));
		long total = mongoTemplate.count(new Query(criteria), CaseDocument.class);
		Sort sort = Sort.by(Sort.Direction.DESC, "criadoEm").and(Sort.by(Sort.Direction.ASC, "id"));
		PageRequest pageable = PageRequest.of(page, size, sort);
		List<CaseDocument> documents = mongoTemplate
				.find(new Query(criteria).with(pageable), CaseDocument.class);
		Set<String> linkedIds = documents.stream()
				.map(CaseDocument::vinculoId)
				.filter(id -> id != null && !id.isBlank())
				.collect(java.util.stream.Collectors.toSet());
		Map<String, CaseDocument> linkedCases = new HashMap<>();
		if (!linkedIds.isEmpty()) {
			caseRepository.findAllById(linkedIds).forEach(item -> linkedCases.put(item.id(), item));
		}
		List<CitizenCaseResponse> items = documents.stream()
				.map(item -> CitizenCaseResponse.from(
						item,
						true,
						true,
						null,
						linkedCaseSummary(linkedCases.get(item.vinculoId()))))
				.toList();
		int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / size);
		return new PageResponse<>(items, page, size, total, totalPages);
	}

	public CitizenCaseResponse detail(String id, UserPrincipal principal) {
		CaseDocument item = caseRepository.findById(id)
				.filter(caseDocument -> canRead(caseDocument, principal))
				.orElseThrow(CitizenCaseService::notFound);
		boolean owner = item.autorId().equals(principal.id());
		UserResponse author = owner
				? currentUserResponse(principal)
				: userAccountRepository.findById(item.autorId())
						.map(UserResponse::from)
						.orElseThrow(() -> new ApiException(
								HttpStatus.SERVICE_UNAVAILABLE,
								"AUTHOR_PROFILE_UNAVAILABLE",
								"Não foi possível carregar os dados do solicitante."));
		CaseDocument linkedCase = item.vinculoId() == null
				? null
				: caseRepository.findById(item.vinculoId()).orElse(null);
		List<String> actions = principal.perfil() == UserRole.SABESP
				? CitizenCaseResponse.staffActions(item)
				: owner && item.status() == CaseStatus.RECEBIDO
						? List.of("editar", "cancelar")
						: List.of();
		return CitizenCaseResponse.from(
				item,
				owner,
				owner || principal.perfil() == UserRole.SABESP,
				author,
				linkedCaseSummary(linkedCase),
				actions);
	}

	public CitizenCaseResponse create(
			CaseWriteRequest request,
			List<MultipartFile> files,
			UserPrincipal principal) {
		CaseData data = validateRequest(request, principal.id());
		UserResponse author = currentUserResponse(principal);
		String caseId = UUID.randomUUID().toString();
		List<CaseDocument.ImageSnapshot> uploaded = images.storeNewImages(caseId, files, 0);
		Instant now = Instant.now();
		CaseDocument document = new CaseDocument(
				caseId,
				newProtocol(),
				data.type().id(),
				data.type().nome(),
				request.descricao().trim(),
				request.observadoEm(),
				now,
				now,
				data.address(),
				data.location(),
				CaseStatus.RECEBIDO,
				PublicationState.PENDENTE,
				null,
				uploaded,
				null,
				List.of(new CaseDocument.UpdateSnapshot(
						UUID.randomUUID().toString(),
						"Seu relato aguarda validação da equipe.",
						now,
						"Chamado recebido",
						true,
						principal.id())),
				principal.id(),
				data.recurrenceId(),
				null,
				null);
		try {
			return CitizenCaseResponse.from(caseRepository.save(document), true, author);
		} catch (DuplicateKeyException exception) {
			images.discardNewImages(caseId, uploaded, exception);
			throw new ApiException(
					HttpStatus.CONFLICT,
					"CASE_PROTOCOL_CONFLICT",
					"Não foi possível gerar um protocolo. Tente novamente.");
		} catch (DataAccessException exception) {
			images.discardNewImages(caseId, uploaded, exception);
			throw exception;
		}
	}

	public CitizenCaseResponse edit(
			String id,
			CaseWriteRequest request,
			List<MultipartFile> files,
			List<String> retainedImageIds,
			UserPrincipal principal) {
		CaseDocument current = ownedCase(id, principal.id());
		if (current.status() != CaseStatus.RECEBIDO) {
			throw conflict("O chamado já está em análise e não pode mais ser editado.");
		}
		CaseData data = validateRequest(request, principal.id());
		UserResponse author = currentUserResponse(principal);
		List<CaseDocument.ImageSnapshot> currentImages = safeImages(current);
		List<CaseDocument.ImageSnapshot> retained = retainedImages(currentImages, retainedImageIds);
		List<CaseDocument.ImageSnapshot> removed = currentImages.stream()
				.filter(image -> !retainedImageIds.contains(image.id()))
				.toList();
		List<CaseDocument.ImageSnapshot> uploaded = images.storeNewImages(id, files, retained.size());
		List<CaseDocument.ImageSnapshot> combinedImages = new ArrayList<>(retained);
		combinedImages.addAll(uploaded);
		Instant now = Instant.now();
		List<CaseDocument.UpdateSnapshot> updates = appendUpdate(
				current,
				"Chamado atualizado",
				"Dados do chamado atualizados pelo solicitante.",
				now,
				principal.id());
		CaseDocument updated = new CaseDocument(
				current.id(),
				current.protocolo(),
				data.type().id(),
				data.type().nome(),
				request.descricao().trim(),
				request.observadoEm(),
				current.criadoEm(),
				now,
				data.address(),
				data.location(),
				current.status(),
				current.publicacao(),
				current.revisaoPublicacao(),
				List.copyOf(combinedImages),
				current.previsaoVisita(),
				updates,
				current.autorId(),
				data.recurrenceId(),
				current.vinculoId(),
				current.version());
		CaseDocument saved;
		try {
			saved = caseRepository.save(updated);
		} catch (OptimisticLockingFailureException exception) {
			images.discardNewImages(id, uploaded, exception);
			throw conflict("O chamado foi alterado por outra operação. Atualize os dados e tente novamente.");
		} catch (DataAccessException exception) {
			images.discardNewImages(id, uploaded, exception);
			throw exception;
		}
		images.deleteRemovedImages(id, removed);
		return CitizenCaseResponse.from(saved, true, author);
	}

	public void cancel(String id, UserPrincipal principal) {
		CaseDocument current = ownedCase(id, principal.id());
		if (current.status() != CaseStatus.RECEBIDO) {
			throw conflict("O cancelamento só está disponível antes do início da análise.");
		}
		Instant now = Instant.now();
		CaseDocument cancelled = new CaseDocument(
				current.id(),
				current.protocolo(),
				current.tipoId(),
				current.tipo(),
				current.descricao(),
				current.observadoEm(),
				current.criadoEm(),
				now,
				current.endereco(),
				current.localizacao(),
				CaseStatus.CANCELADO,
				current.publicacao(),
				current.revisaoPublicacao(),
				safeImages(current),
				current.previsaoVisita(),
				appendUpdate(current, "Chamado cancelado", "Registro cancelado pelo autor.", now, principal.id()),
				current.autorId(),
				current.reincidenciaDe(),
				current.vinculoId(),
				current.version());
		try {
			caseRepository.save(cancelled);
		} catch (OptimisticLockingFailureException exception) {
			throw conflict("O chamado foi alterado por outra operação. Atualize os dados e tente novamente.");
		}
	}

	private CaseData validateRequest(CaseWriteRequest request, String ownerId) {
		Instant now = Instant.now();
		if (request.observadoEm().isAfter(now.plusSeconds(60))) {
			throw invalidField("observadoEm", "A data observada não pode estar no futuro.");
		}
		CaseTypeDocument type = caseTypeRepository.findById(request.tipoId().trim())
				.filter(CaseTypeDocument::ativo)
				.orElseThrow(() -> invalidField("tipoId", "Selecione um tipo de chamado válido."));
		CaseDocument.AddressSnapshot address = addressSnapshot(request.endereco());
		if (!"SANTOS".equalsIgnoreCase(address.cidade()) || !"SP".equalsIgnoreCase(address.uf())) {
			throw invalidField("endereco", "O atendimento deste projeto é exclusivo para Santos, SP.");
		}
		Double latitude = request.localizacao().latitude();
		Double longitude = request.localizacao().longitude();
		if (!Double.isFinite(latitude) || !Double.isFinite(longitude)) {
			throw invalidField("localizacao", "Informe coordenadas válidas.");
		}
		CaseDocument.LocationSnapshot location = new CaseDocument.LocationSnapshot(latitude, longitude);
		serviceArea.validate(location);
		String recurrenceId = normalizeOptional(request.reincidenciaDe());
		if (recurrenceId != null) {
			CaseDocument previous = ownedCase(recurrenceId, ownerId);
			if (previous.status() != CaseStatus.RESOLVIDO) {
				throw invalidField("reincidenciaDe", "A reincidência deve apontar para um chamado resolvido.");
			}
		}
		return new CaseData(type, address, location, recurrenceId);
	}

	private CaseDocument.AddressSnapshot addressSnapshot(CaseWriteRequest.AddressData address) {
		String number = normalizeOptional(address.numero());
		if (!address.semNumero() && number == null) {
			throw invalidField("endereco.numero", "Informe o número ou marque a opção sem número.");
		}
		return new CaseDocument.AddressSnapshot(
				address.cep().replace("-", ""),
				address.logradouro().trim(),
				number,
				address.semNumero(),
				address.bairro().trim(),
				address.cidade().trim(),
				address.uf().trim().toUpperCase(),
				normalizeOptional(address.referencia()));
	}

	private List<CaseDocument.ImageSnapshot> retainedImages(
			List<CaseDocument.ImageSnapshot> currentImages,
			List<String> retainedImageIds) {
		if (retainedImageIds == null) {
			throw invalidField("imagensMantidas", "Informe as imagens que deseja manter.");
		}
		Set<String> requestedIds = new HashSet<>(retainedImageIds);
		if (requestedIds.size() != retainedImageIds.size()) {
			throw invalidField("imagensMantidas", "A lista de imagens contém identificadores repetidos.");
		}
		List<CaseDocument.ImageSnapshot> retained = currentImages.stream()
				.filter(image -> requestedIds.contains(image.id()))
				.toList();
		if (retained.size() != requestedIds.size()) {
			throw invalidField("imagensMantidas", "Uma ou mais imagens não pertencem a este chamado.");
		}
		return retained;
	}

	private List<CaseDocument.UpdateSnapshot> appendUpdate(
			CaseDocument current,
			String title,
			String text,
			Instant createdAt,
			String authorId) {
		List<CaseDocument.UpdateSnapshot> updates = new ArrayList<>();
		if (current.atualizacoes() != null) {
			updates.addAll(current.atualizacoes());
		}
		updates.add(new CaseDocument.UpdateSnapshot(
				UUID.randomUUID().toString(),
				text,
				createdAt,
				title,
				true,
				authorId));
		return List.copyOf(updates);
	}

	private List<CaseDocument.ImageSnapshot> safeImages(CaseDocument item) {
		return item.imagens() == null ? List.of() : item.imagens();
	}

	private CaseDocument ownedCase(String id, String ownerId) {
		return caseRepository.findById(id)
				.filter(item -> ownerId.equals(item.autorId()))
				.orElseThrow(CitizenCaseService::notFound);
	}

	private boolean canRead(CaseDocument item, UserPrincipal principal) {
		return principal.perfil() == UserRole.SABESP
				|| (principal.perfil() == UserRole.CIDADAO && principal.id().equals(item.autorId()));
	}

	private UserResponse currentUserResponse(UserPrincipal principal) {
		return userAccountRepository.findById(principal.id())
				.map(UserResponse::from)
				.orElseThrow(() -> new ApiException(
						HttpStatus.UNAUTHORIZED,
						"SESSION_EXPIRED",
						"Sessão inválida ou expirada."));
	}

	private CitizenCaseResponse.LinkedCaseSummary linkedCaseSummary(CaseDocument linkedCase) {
		if (linkedCase == null) {
			return null;
		}
		String publicUrl = CasePublicVisibility.isPublic(linkedCase)
				? "/api/v1/public/chamados/" + linkedCase.id()
				: null;
		return new CitizenCaseResponse.LinkedCaseSummary(
				linkedCase.id(),
				linkedCase.protocolo(),
				linkedCase.status(),
				linkedCase.previsaoVisita(),
				publicUrl);
	}

	private String newProtocol() {
		int year = Instant.now().atZone(APPLICATION_ZONE).getYear();
		return "SS-" + year + "-" + UUID.randomUUID().toString().toUpperCase();
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

	private String normalizeOptional(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private static ApiException invalidField(String field, String message) {
		return new ApiException(
				HttpStatus.BAD_REQUEST,
				"VALIDATION_ERROR",
				"Revise os campos indicados.",
				Map.of(field, message));
	}

	private static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, "CASE_STATE_CONFLICT", message);
	}

	private static ApiException notFound() {
		return new ApiException(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", "Chamado não encontrado.");
	}

	private record CaseData(
			CaseTypeDocument type,
			CaseDocument.AddressSnapshot address,
			CaseDocument.LocationSnapshot location,
			String recurrenceId) {
	}
}
