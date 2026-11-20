package com.example.backend.api.indicators;

import com.example.backend.domain.cases.CaseStatus;
import java.time.Instant;
import java.util.List;

public record CaseIndicatorsResponse(
		Instant geradoEm,
		long totalAtendimentos,
		long totalRelatosRecebidos,
		long totalAtivos,
		long totalResolvidos,
		long totalEncerradosSemAtendimento,
		long totalReincidencias,
		List<StatusCount> porStatus,
		List<CountByLabel> porBairro,
		List<TypeCount> porTipo) {

	public CaseIndicatorsResponse {
		porStatus = List.copyOf(porStatus);
		porBairro = List.copyOf(porBairro);
		porTipo = List.copyOf(porTipo);
	}

	public record StatusCount(CaseStatus status, long quantidade) {
	}

	public record CountByLabel(String nome, long quantidade) {
	}

	public record TypeCount(String tipoId, String nome, long quantidade) {
	}
}
