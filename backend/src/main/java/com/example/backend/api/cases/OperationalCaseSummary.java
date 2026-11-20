package com.example.backend.api.cases;

import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import java.time.Instant;

public record OperationalCaseSummary(
		String id,
		String protocolo,
		String tipoId,
		String tipo,
		CaseStatus status,
		PublicationState publicacao,
		String bairro,
		String endereco,
		Instant criadoEm,
		Instant atualizadoEm,
		CaseDocument.VisitWindow previsaoVisita) {

	public static OperationalCaseSummary from(CaseDocument item) {
		CaseDocument.AddressSnapshot address = item.endereco();
		String formattedAddress = address == null
				? null
				: String.join(
						", ",
						java.util.stream.Stream.of(address.logradouro(), address.numero(), address.bairro())
								.filter(value -> value != null && !value.isBlank())
								.toList());
		return new OperationalCaseSummary(
				item.id(),
				item.protocolo(),
				item.tipoId(),
				item.tipo(),
				item.status(),
				item.publicacao(),
				address == null ? null : address.bairro(),
				formattedAddress,
				item.criadoEm(),
				item.atualizadoEm(),
				item.previsaoVisita());
	}
}
