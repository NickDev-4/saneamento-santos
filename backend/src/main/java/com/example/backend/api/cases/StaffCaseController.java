package com.example.backend.api.cases;

import com.example.backend.api.publicapi.PageResponse;
import com.example.backend.application.cases.StaffCaseWorkflowService;
import com.example.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('SABESP')")
@Tag(name = "Operação Sabesp")
@SecurityRequirement(name = "sessionCookie")
public class StaffCaseController {

	private final StaffCaseWorkflowService workflows;

	public StaffCaseController(StaffCaseWorkflowService workflows) {
		this.workflows = workflows;
	}

	@GetMapping("/operacao/chamados")
	public PageResponse<OperationalCaseSummary> list(
			@RequestParam(required = false) String status,
			@RequestParam(required = false) String tipoId,
			@RequestParam(required = false) String bairro,
			@RequestParam(required = false) String criadoDe,
			@RequestParam(required = false) String criadoAte,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return workflows.listOperational(status, tipoId, bairro, criadoDe, criadoAte, page, size);
	}

	@PatchMapping("/chamados/{id}/publicacao")
	@SecurityRequirement(name = "csrfHeader")
	public CitizenCaseResponse changePublication(
			@PathVariable String id,
			@Valid @RequestBody PublicationRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return workflows.changePublication(id, request, principal);
	}

	@PatchMapping(value = "/chamados/{id}/status", consumes = "multipart/form-data")
	@SecurityRequirement(name = "csrfHeader")
	public CitizenCaseResponse transition(
			@PathVariable String id,
			@Valid @RequestPart("dados") StatusTransitionRequest request,
			@RequestPart(value = "imagemResolucao", required = false) MultipartFile resolutionImage,
			@AuthenticationPrincipal UserPrincipal principal) {
		return workflows.transition(id, request, resolutionImage, principal);
	}

	@PatchMapping("/chamados/{id}/previsao")
	@SecurityRequirement(name = "csrfHeader")
	public CitizenCaseResponse setForecast(
			@PathVariable String id,
			@Valid @RequestBody VisitWindowRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return workflows.setForecast(id, request, principal);
	}

	@PostMapping("/chamados/{id}/atualizacoes-publicas")
	@SecurityRequirement(name = "csrfHeader")
	public CitizenCaseResponse addPublicUpdate(
			@PathVariable String id,
			@Valid @RequestBody PublicUpdateRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return workflows.addPublicUpdate(id, request, principal);
	}

	@GetMapping("/chamados/{id}/observacoes-internas")
	public PageResponse<InternalCaseNoteResponse> listInternalNotes(
			@PathVariable String id,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return workflows.listInternalNotes(id, page, size);
	}

	@PostMapping("/chamados/{id}/observacoes-internas")
	@SecurityRequirement(name = "csrfHeader")
	public InternalCaseNoteResponse addInternalNote(
			@PathVariable String id,
			@Valid @RequestBody InternalNoteRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return workflows.addInternalNote(id, request.texto(), principal);
	}

	@PostMapping("/chamados/{id}/vinculo")
	@SecurityRequirement(name = "csrfHeader")
	public CitizenCaseResponse linkDuplicate(
			@PathVariable String id,
			@Valid @RequestBody CaseLinkRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return workflows.linkDuplicate(id, request, principal);
	}
}
