package com.example.backend.api.indicators;

import com.example.backend.application.indicators.CaseIndicatorsService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/prefeitura/indicadores")
@PreAuthorize("hasRole('PREFEITURA')")
@Tag(name = "Indicadores da Prefeitura")
@SecurityRequirement(name = "sessionCookie")
public class CaseIndicatorsController {

	private final CaseIndicatorsService indicators;

	public CaseIndicatorsController(CaseIndicatorsService indicators) {
		this.indicators = indicators;
	}

	@GetMapping
	public CaseIndicatorsResponse get(
			@RequestParam(required = false) String status,
			@RequestParam(required = false) String tipoId,
			@RequestParam(required = false) String bairro,
			@RequestParam(required = false) String criadoDe,
			@RequestParam(required = false) String criadoAte) {
		return indicators.summarize(status, tipoId, bairro, criadoDe, criadoAte);
	}
}
