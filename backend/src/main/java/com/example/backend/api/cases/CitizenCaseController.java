package com.example.backend.api.cases;

import com.example.backend.api.publicapi.PageResponse;
import com.example.backend.application.cases.CitizenCaseService;
import com.example.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Chamados do cidadão")
@SecurityRequirement(name = "sessionCookie")
public class CitizenCaseController {

	private final CitizenCaseService cases;

	public CitizenCaseController(CitizenCaseService cases) {
		this.cases = cases;
	}

	@GetMapping("/me/chamados")
	@PreAuthorize("hasRole('CIDADAO')")
	public PageResponse<CitizenCaseResponse> myCases(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam(required = false) String status,
			@RequestParam(required = false) String tipoId,
			@RequestParam(required = false) String bairro,
			@RequestParam(required = false) String criadoDe,
			@RequestParam(required = false) String criadoAte,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return cases.listMine(principal, status, tipoId, bairro, criadoDe, criadoAte, page, size);
	}

	@PostMapping(value = "/chamados", consumes = "multipart/form-data")
	@SecurityRequirement(name = "csrfHeader")
	@PreAuthorize("hasRole('CIDADAO')")
	public ResponseEntity<CitizenCaseResponse> create(
			@Valid @RequestPart("dados") CaseWriteRequest request,
			@RequestPart("imagens") List<MultipartFile> files,
			@AuthenticationPrincipal UserPrincipal principal) {
		CitizenCaseResponse created = cases.create(request, files, principal);
		return ResponseEntity
				.created(URI.create("/api/v1/chamados/" + created.id()))
				.body(created);
	}

	@GetMapping("/chamados/{id}")
	@PreAuthorize("hasAnyRole('CIDADAO', 'SABESP')")
	public CitizenCaseResponse detail(
			@PathVariable String id,
			@AuthenticationPrincipal UserPrincipal principal) {
		return cases.detail(id, principal);
	}

	@PatchMapping(value = "/chamados/{id}", consumes = "multipart/form-data")
	@SecurityRequirement(name = "csrfHeader")
	@PreAuthorize("hasRole('CIDADAO')")
	public CitizenCaseResponse edit(
			@PathVariable String id,
			@Valid @RequestPart("dados") CaseWriteRequest request,
			@RequestPart(value = "imagens", required = false) List<MultipartFile> files,
			@RequestPart("imagensMantidas") List<String> retainedImageIds,
			@AuthenticationPrincipal UserPrincipal principal) {
		return cases.edit(id, request, files, retainedImageIds, principal);
	}

	@PostMapping("/chamados/{id}/cancelamento")
	@SecurityRequirement(name = "csrfHeader")
	@PreAuthorize("hasRole('CIDADAO')")
	public ResponseEntity<Void> cancel(
			@PathVariable String id,
			@AuthenticationPrincipal UserPrincipal principal) {
		cases.cancel(id, principal);
		return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	}
}
