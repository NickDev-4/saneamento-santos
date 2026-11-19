package com.example.backend.api.publicapi;

import com.example.backend.application.publicapi.PublicCaseQueryService;
import com.example.backend.infrastructure.persistence.cases.CaseTypeRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public")
public class PublicApiController {

	private final CaseTypeRepository caseTypes;
	private final PublicCaseQueryService publicCases;

	public PublicApiController(CaseTypeRepository caseTypes, PublicCaseQueryService publicCases) {
		this.caseTypes = caseTypes;
		this.publicCases = publicCases;
	}

	@GetMapping("/tipos-chamado")
	public List<PublicCaseTypeResponse> caseTypes() {
		return caseTypes.findByAtivoTrueOrderByNomeAsc().stream()
				.map(PublicCaseTypeResponse::from)
				.toList();
	}

	@GetMapping("/chamados")
	public PageResponse<PublicCaseResponse> cases(
			@RequestParam(required = false) String status,
			@RequestParam(required = false) String tipoId,
			@RequestParam(required = false) String bairro,
			@RequestParam(required = false) String criadoDe,
			@RequestParam(required = false) String criadoAte,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) String bbox,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return publicCases.list(status, tipoId, bairro, criadoDe, criadoAte, q, bbox, page, size);
	}

	@GetMapping("/chamados/{id}")
	public PublicCaseResponse caseDetail(@PathVariable String id) {
		return publicCases.detail(id);
	}
}
