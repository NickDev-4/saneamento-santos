package com.example.backend.application.cases;

import com.example.backend.api.cases.CaseLinkRequest;
import com.example.backend.api.cases.CitizenCaseResponse;
import com.example.backend.api.cases.InternalCaseNoteResponse;
import com.example.backend.api.cases.PublicUpdateRequest;
import com.example.backend.api.cases.PublicationRequest;
import com.example.backend.api.cases.StatusTransitionRequest;
import com.example.backend.api.cases.VisitWindowRequest;
import com.example.backend.api.exception.ApiException;
import com.example.backend.api.publicapi.PageResponse;
import com.example.backend.application.publicapi.CasePublicVisibility;
import com.example.backend.application.notifications.NotificationService;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.domain.notifications.NotificationType;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import com.example.backend.infrastructure.persistence.cases.CaseRepository;
import com.example.backend.infrastructure.persistence.cases.InternalCaseNoteDocument;
import com.example.backend.infrastructure.persistence.cases.InternalCaseNoteRepository;
import com.example.backend.security.UserPrincipal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Service
public class StaffCaseWorkflowService {

	private static final Set<CaseStatus> LINKABLE_STATUSES = Set.of(
			CaseStatus.EM_ANALISE,
			CaseStatus.VISITA_AGENDADA,
			CaseStatus.EM_ATENDIMENTO);
	private static final Set<CaseStatus> CLOSABLE_STATUSES = LINKABLE_STATUSES;

	private final CaseRepository caseRepository;
	private final InternalCaseNoteRepository noteRepository;
	private final CaseImageService images;
	private final NotificationService notifications;
	private final MongoTemplate mongoTemplate;

	public StaffCaseWorkflowService(
			CaseRepository caseRepository,
			InternalCaseNoteRepository noteRepository,
			CaseImageService images,
			NotificationService notifications,
			MongoTemplate mongoTemplate) {
		this.caseRepository = caseRepository;
		this.noteRepository = noteRepository;
		this.images = images;
		this.notifications = notifications;
		this.mongoTemplate = mongoTemplate;
	}

	public PageResponse<CitizenCaseResponse> listOperational(
			String status,
			String tipoId,
			String bairro,
			String criadoDe,
			String criadoAte,
			int page,
			int size) {
		validatePage(page, size);
		Criteria criteria = OperationalCaseFilters.combine(
				OperationalCaseFilters.build(status, tipoId, bairro, criadoDe, criadoAte));
		Query baseQuery = new Query(criteria);
		long total = mongoTemplate.count(baseQuery, CaseDocument.class);
		PageRequest pageable = PageRequest.of(
				page,
				size,
				Sort.by(Sort.Direction.DESC, "criadoEm").and(Sort.by(Sort.Direction.ASC, "id")));
		List<CitizenCaseResponse> items = mongoTemplate
				.find(new Query(criteria).with(pageable), CaseDocument.class)
				.stream()
				.map(item -> CitizenCaseResponse.from(
						item,
						false,
						true,
						null,
						null,
						CitizenCaseResponse.staffActions(item)))
				.toList();
		return new PageResponse<>(items, page, size, total, totalPages(total, size));
	}

	@Transactional
	public CitizenCaseResponse changePublication(
			String id,
			PublicationRequest request,
			UserPrincipal principal) {
		CaseDocument current = findCase(id);
		if (current.status() == CaseStatus.CANCELADO || current.status() == CaseStatus.VINCULADO) {
			throw conflict("Chamados cancelados ou vinculados não podem ser publicados.");
		}
		if (request.publicacao() == PublicationState.PENDENTE) {
			throw invalidField("publicacao", "Escolha APROVADO ou REJEITADO.");
		}
		String justification = normalizeOptional(request.justificativa());
		if (request.publicacao() == PublicationState.REJEITADO && justification == null) {
			throw invalidField("justificativa", "Informe o motivo da rejeição.");
		}
		if (current.publicacao() == request.publicacao()
				&& current.revisaoPublicacao() != null
				&& java.util.Objects.equals(current.revisaoPublicacao().justificativa(), justification)) {
			return staffResponse(current);
		}
		Instant now = Instant.now();
		CaseDocument.PublicationReview review = new CaseDocument.PublicationReview(
				principal.id(),
				now,
				justification);
		List<CaseDocument.ImageSnapshot> reviewedImages = approvalImages(
				safeImages(current),
				request.publicacao() == PublicationState.APROVADO);
		boolean approved = request.publicacao() == PublicationState.APROVADO;
		String title = approved ? "Chamado aprovado para publicação" : "Publicação não aprovada";
		String text = approved
				? "O chamado foi aprovado para consulta pública."
				: "A publicação foi rejeitada: " + justification;
		CaseDocument updated = current.withWorkflow(
				current.status(),
				request.publicacao(),
				review,
				reviewedImages,
				current.previsaoVisita(),
				appendUpdate(current, title, text, approved, now, principal.id()),
				current.vinculoId(),
				now);
		CaseDocument saved = saveWorkflowChange(updated, List.of());
		notifications.notifyCaseOwners(
				saved,
				approved ? NotificationType.PUBLICACAO_APROVADA : NotificationType.PUBLICACAO_REJEITADA,
				title,
				approved ? "Seu chamado foi aprovado para publicação." : "A publicação do chamado foi rejeitada.");
		return staffResponse(saved);
	}

	@Transactional
	public CitizenCaseResponse transition(
			String id,
			StatusTransitionRequest request,
			MultipartFile resolutionImage,
			UserPrincipal principal) {
		CaseDocument current = findCase(id);
		CaseStatus next = request.status();
		validateTransition(current.status(), next, request);
		Instant now = Instant.now();
		List<CaseDocument.ImageSnapshot> uploaded = resolutionImage == null
				? List.of()
				: images.storeNewImages(List.of(resolutionImage), 0);
		boolean rollbackCleanupRegistered = registerRollbackCleanup(uploaded);
		try {
			List<CaseDocument.ImageSnapshot> mergedImages = new ArrayList<>(safeImages(current));
			for (CaseDocument.ImageSnapshot image : uploaded) {
				mergedImages.add(new CaseDocument.ImageSnapshot(
						image.id(),
						image.url(),
						image.contentType(),
						false,
						current.publicacao() == PublicationState.APROVADO));
			}
			String title = transitionTitle(next);
			String text = transitionMessage(next, request);
			CaseDocument updated = current.withWorkflow(
					next,
					current.publicacao(),
					current.revisaoPublicacao(),
					List.copyOf(mergedImages),
					next == CaseStatus.ENCERRADO_SEM_ATENDIMENTO ? null : current.previsaoVisita(),
					appendUpdate(
							current,
							title,
							text,
							next != CaseStatus.ENCERRADO_SEM_ATENDIMENTO,
							now,
							principal.id()),
					current.vinculoId(),
					now);
			CaseDocument saved = caseRepository.save(updated);
			notifyStatusChange(saved, next);
			return staffResponse(saved);
		} catch (OptimisticLockingFailureException exception) {
			if (!rollbackCleanupRegistered) {
				images.discardNewImages(uploaded, exception);
			}
			throw conflict("O chamado foi alterado por outra operação. Atualize os dados e tente novamente.");
		} catch (DataAccessException exception) {
			if (!rollbackCleanupRegistered) {
				images.discardNewImages(uploaded, exception);
			}
			throw exception;
		}
	}

	@Transactional
	public CitizenCaseResponse setForecast(
			String id,
			VisitWindowRequest request,
			UserPrincipal principal) {
		CaseDocument current = findCase(id);
		if (current.status() != CaseStatus.EM_ANALISE && current.status() != CaseStatus.VISITA_AGENDADA) {
			throw conflict("A previsão só pode ser definida durante a análise ou reagendada.");
		}
		Instant now = Instant.now();
		if (!request.inicio().isAfter(now)) {
			throw invalidField("inicio", "O início da visita deve estar no futuro.");
		}
		if (!request.fim().isAfter(request.inicio())) {
			throw invalidField("fim", "O fim da janela deve ser posterior ao início.");
		}
		CaseDocument.VisitWindow window = new CaseDocument.VisitWindow(request.inicio(), request.fim());
		CaseStatus nextStatus = current.status() == CaseStatus.EM_ANALISE
				? CaseStatus.VISITA_AGENDADA
				: current.status();
		String title = current.previsaoVisita() == null ? "Visita agendada" : "Previsão de visita atualizada";
		CaseDocument updated = current.withWorkflow(
				nextStatus,
				current.publicacao(),
				current.revisaoPublicacao(),
				safeImages(current),
				window,
				appendUpdate(
						current,
						title,
						"Janela prevista: " + request.inicio() + " até " + request.fim() + ".",
						true,
						now,
						principal.id()),
				current.vinculoId(),
				now);
		CaseDocument saved = saveWorkflowChange(updated, List.of());
		notifications.notifyCaseOwners(
				saved,
				NotificationType.PREVISAO_ATUALIZADA,
				title,
				"Há uma nova previsão de visita para o seu chamado.");
		return staffResponse(saved);
	}

	@Transactional
	public CitizenCaseResponse addPublicUpdate(
			String id,
			PublicUpdateRequest request,
			UserPrincipal principal) {
		CaseDocument current = findCase(id);
		if (current.status() == CaseStatus.CANCELADO || current.status() == CaseStatus.VINCULADO) {
			throw conflict("Não é possível atualizar um chamado cancelado ou vinculado.");
		}
		Instant now = Instant.now();
		CaseDocument updated = current.withWorkflow(
				current.status(),
				current.publicacao(),
				current.revisaoPublicacao(),
				safeImages(current),
				current.previsaoVisita(),
				appendUpdate(
						current,
						request.titulo().trim(),
						request.texto().trim(),
						true,
						now,
						principal.id()),
				current.vinculoId(),
				now);
		CaseDocument saved = saveWorkflowChange(updated, List.of());
		notifications.notifyCaseOwners(
				saved,
				NotificationType.ATUALIZACAO_PUBLICA,
				request.titulo().trim(),
				"Há uma nova atualização pública no seu chamado.");
		return staffResponse(saved);
	}

	@Transactional
	public CitizenCaseResponse linkDuplicate(String id, CaseLinkRequest request, UserPrincipal principal) {
		CaseDocument duplicate = findCase(id);
		String principalId = request.chamadoPrincipalId().trim();
		if (duplicate.id().equals(principalId)) {
			throw invalidField("chamadoPrincipalId", "Um chamado não pode ser vinculado a si mesmo.");
		}
		if (!LINKABLE_STATUSES.contains(duplicate.status())) {
			throw conflict("Somente chamados em análise ou atendimento podem ser vinculados.");
		}
		if (!caseRepository.findByVinculoId(duplicate.id()).isEmpty()) {
			throw invalidField(
					"chamadoPrincipalId",
					"Um atendimento que já possui chamados vinculados não pode virar duplicata.");
		}
		CaseDocument main = findCase(principalId);
		if (!LINKABLE_STATUSES.contains(main.status()) || main.vinculoId() != null) {
			throw invalidField("chamadoPrincipalId", "Selecione um atendimento principal ativo e não vinculado.");
		}
		Instant now = Instant.now();
		String justification = request.justificativa().trim();
		CaseDocument linked = duplicate.withWorkflow(
				CaseStatus.VINCULADO,
				duplicate.publicacao(),
				duplicate.revisaoPublicacao(),
				safeImages(duplicate),
				null,
				appendUpdate(
						duplicate,
						"Chamado vinculado",
						"O chamado foi vinculado ao atendimento principal "
								+ main.protocolo()
								+ ": "
								+ justification,
						false,
						now,
						principal.id()),
				main.id(),
				now);
		CaseDocument updatedMain = main.withWorkflow(
				main.status(),
				main.publicacao(),
				main.revisaoPublicacao(),
				safeImages(main),
				main.previsaoVisita(),
				appendUpdate(
						main,
						"Novo relato vinculado",
						"Um relato duplicado foi relacionado a este atendimento.",
						true,
						now,
						principal.id()),
				main.vinculoId(),
				now);
		CaseDocument savedMain = saveWorkflowChange(updatedMain, List.of());
		notifications.notifyCaseOwners(
				savedMain,
				NotificationType.VINCULO,
				"Novo relato relacionado",
				"Um relato duplicado foi relacionado ao atendimento acompanhado.");
		CaseDocument saved = saveWorkflowChange(linked, List.of());
		notifications.notifyUser(
				saved.autorId(),
				saved,
				NotificationType.VINCULO,
				"Chamado vinculado a atendimento principal",
				"Seu chamado foi vinculado ao protocolo " + main.protocolo() + ".");
		return staffResponse(saved);
	}

	public PageResponse<InternalCaseNoteResponse> listInternalNotes(String id, int page, int size) {
		validatePage(page, size);
		findCase(id);
		Page<InternalCaseNoteDocument> notes = noteRepository.findByChamadoId(
				id,
				PageRequest.of(
						page,
						size,
						Sort.by(Sort.Direction.DESC, "criadoEm").and(Sort.by(Sort.Direction.ASC, "id"))));
		return new PageResponse<>(
				notes.getContent().stream().map(InternalCaseNoteResponse::from).toList(),
				page,
				size,
				notes.getTotalElements(),
				notes.getTotalPages());
	}

	public InternalCaseNoteResponse addInternalNote(
			String id,
			String text,
			UserPrincipal principal) {
		findCase(id);
		InternalCaseNoteDocument note = new InternalCaseNoteDocument(
				UUID.randomUUID().toString(),
				id,
				principal.id(),
				text.trim(),
				Instant.now());
		return InternalCaseNoteResponse.from(noteRepository.save(note));
	}

	private CaseDocument saveWorkflowChange(
			CaseDocument updated,
			List<CaseDocument.ImageSnapshot> uploadedImages) {
		try {
			return caseRepository.save(updated);
		} catch (OptimisticLockingFailureException exception) {
			images.discardNewImages(uploadedImages, exception);
			throw conflict("O chamado foi alterado por outra operação. Atualize os dados e tente novamente.");
		} catch (DataAccessException exception) {
			images.discardNewImages(uploadedImages, exception);
			throw exception;
		}
	}

	private void validateTransition(
			CaseStatus current,
			CaseStatus next,
			StatusTransitionRequest request) {
		boolean valid = switch (next) {
			case EM_ANALISE -> current == CaseStatus.RECEBIDO;
			case EM_ATENDIMENTO -> current == CaseStatus.VISITA_AGENDADA;
			case RESOLVIDO -> current == CaseStatus.EM_ATENDIMENTO;
			case ENCERRADO_SEM_ATENDIMENTO -> CLOSABLE_STATUSES.contains(current);
			default -> false;
		};
		if (!valid) {
			throw conflict("A transição de status solicitada não é permitida.");
		}
		if (next == CaseStatus.RESOLVIDO && normalizeOptional(request.comentarioPublico()) == null) {
			throw invalidField("comentarioPublico", "Informe o comentário público da resolução.");
		}
		if (next == CaseStatus.ENCERRADO_SEM_ATENDIMENTO
				&& normalizeOptional(request.justificativa()) == null) {
			throw invalidField("justificativa", "Informe o motivo do encerramento sem atendimento.");
		}
	}

	private String transitionTitle(CaseStatus status) {
		return switch (status) {
			case EM_ANALISE -> "Chamado em análise";
			case EM_ATENDIMENTO -> "Atendimento iniciado";
			case RESOLVIDO -> "Chamado resolvido";
			case ENCERRADO_SEM_ATENDIMENTO -> "Chamado encerrado sem atendimento";
			default -> throw conflict("A transição de status solicitada não é permitida.");
		};
	}

	private String transitionMessage(CaseStatus status, StatusTransitionRequest request) {
		return switch (status) {
			case EM_ANALISE -> "A equipe iniciou a análise do chamado.";
			case EM_ATENDIMENTO -> "A equipe iniciou o atendimento.";
			case RESOLVIDO -> request.comentarioPublico().trim();
			case ENCERRADO_SEM_ATENDIMENTO -> request.justificativa().trim();
			default -> throw conflict("A transição de status solicitada não é permitida.");
		};
	}

	private void notifyStatusChange(CaseDocument item, CaseStatus status) {
		NotificationType type = switch (status) {
			case EM_ANALISE -> NotificationType.INICIO_ANALISE;
			case RESOLVIDO -> NotificationType.RESOLUCAO;
			case ENCERRADO_SEM_ATENDIMENTO -> NotificationType.ENCERRAMENTO;
			default -> NotificationType.ATUALIZACAO_PRINCIPAL;
		};
		String title = transitionTitle(status);
		notifications.notifyCaseOwners(item, type, title, title + ".");
	}

	private List<CaseDocument.UpdateSnapshot> appendUpdate(
			CaseDocument current,
			String title,
			String text,
			boolean publicUpdate,
			Instant createdAt,
			String authorId) {
		List<CaseDocument.UpdateSnapshot> updates = new ArrayList<>(safeUpdates(current));
		updates.add(new CaseDocument.UpdateSnapshot(
				UUID.randomUUID().toString(),
				text,
				createdAt,
				title,
				publicUpdate,
				authorId));
		return List.copyOf(updates);
	}

	private List<CaseDocument.ImageSnapshot> approvalImages(
			List<CaseDocument.ImageSnapshot> currentImages,
			boolean approved) {
		return currentImages.stream()
				.map(image -> new CaseDocument.ImageSnapshot(
						image.id(),
						image.url(),
						image.contentType(),
						image.ilustrativa(),
						approved))
				.toList();
	}

	private boolean registerRollbackCleanup(List<CaseDocument.ImageSnapshot> uploaded) {
		if (uploaded.isEmpty() || !TransactionSynchronizationManager.isSynchronizationActive()) {
			return false;
		}
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCompletion(int status) {
				if (status != TransactionSynchronization.STATUS_COMMITTED) {
					images.discardNewImages(
							uploaded,
							new IllegalStateException("Workflow transaction rolled back after image upload."));
				}
			}
		});
		return true;
	}

	private List<CaseDocument.ImageSnapshot> safeImages(CaseDocument item) {
		return item.imagens() == null ? List.of() : item.imagens();
	}

	private List<CaseDocument.UpdateSnapshot> safeUpdates(CaseDocument item) {
		return item.atualizacoes() == null ? List.of() : item.atualizacoes();
	}

	private CitizenCaseResponse staffResponse(CaseDocument item) {
		CaseDocument linkedMain = item.vinculoId() == null
				? null
				: caseRepository.findById(item.vinculoId()).orElse(null);
		CitizenCaseResponse.LinkedCaseSummary summary = linkedMain == null
				? null
				: new CitizenCaseResponse.LinkedCaseSummary(
						linkedMain.id(),
						linkedMain.protocolo(),
						linkedMain.status(),
						linkedMain.previsaoVisita(),
						CasePublicVisibility.isPublic(linkedMain)
								? "/api/v1/public/chamados/" + linkedMain.id()
								: null);
		return CitizenCaseResponse.from(
				item,
				false,
				true,
				null,
				summary,
				CitizenCaseResponse.staffActions(item));
	}

	private CaseDocument findCase(String id) {
		return caseRepository.findById(id).orElseThrow(StaffCaseWorkflowService::notFound);
	}

	private void validatePage(int page, int size) {
		if (page < 0) {
			throw invalidField("page", "A página deve ser zero ou maior.");
		}
		if (size < 1 || size > 100) {
			throw invalidField("size", "O tamanho deve estar entre 1 e 100.");
		}
	}

	private int totalPages(long total, int size) {
		return total == 0 ? 0 : (int) Math.ceil((double) total / size);
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
}
