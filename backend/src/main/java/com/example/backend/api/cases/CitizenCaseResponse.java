package com.example.backend.api.cases;

import com.example.backend.api.auth.dto.UserResponse;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

public record CitizenCaseResponse(
		String id,
		String protocolo,
		String tipoId,
		String tipo,
		String descricao,
		Instant observadoEm,
		Instant criadoEm,
		Instant atualizadoEm,
		CaseDocument.AddressSnapshot endereco,
		CaseDocument.LocationSnapshot localizacao,
		CaseStatus status,
		PublicationState publicacao,
		List<ImageResponse> imagens,
		CaseDocument.VisitWindow previsaoVisita,
		List<UpdateResponse> atualizacoes,
		String reincidenciaDe,
		UserResponse autor,
		List<String> acoesPermitidas) {

	public CitizenCaseResponse {
		imagens = List.copyOf(imagens);
		atualizacoes = List.copyOf(atualizacoes);
		acoesPermitidas = List.copyOf(acoesPermitidas);
	}

	public static CitizenCaseResponse from(CaseDocument item, boolean owner, UserResponse author) {
		List<ImageResponse> images = Objects.requireNonNullElse(item.imagens(), List.<CaseDocument.ImageSnapshot>of())
				.stream()
				.map(image -> new ImageResponse(image.id(), image.url(), image.ilustrativa()))
				.toList();
		List<UpdateResponse> updates = Objects.requireNonNullElse(item.atualizacoes(),
						List.<CaseDocument.UpdateSnapshot>of())
				.stream()
				.filter(CaseDocument.UpdateSnapshot::publicada)
				.map(update -> new UpdateResponse(update.id(), update.texto(), update.criadoEm(), update.titulo()))
				.toList();
		List<String> actions = owner && item.status() == CaseStatus.RECEBIDO
				? List.of("editar", "cancelar")
				: List.of();
		return new CitizenCaseResponse(
				item.id(),
				item.protocolo(),
				item.tipoId(),
				item.tipo(),
				item.descricao(),
				item.observadoEm(),
				item.criadoEm(),
				item.atualizadoEm(),
				item.endereco(),
				item.localizacao(),
				item.status(),
				item.publicacao(),
				images,
				item.previsaoVisita(),
				updates,
				item.reincidenciaDe(),
				author,
				actions);
	}

	public record ImageResponse(String id, String url, boolean ilustrativa) {
	}

	public record UpdateResponse(String id, String texto, Instant criadoEm, String titulo) {
	}
}
