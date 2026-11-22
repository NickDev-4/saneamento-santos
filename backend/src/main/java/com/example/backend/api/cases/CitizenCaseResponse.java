package com.example.backend.api.cases;

import com.example.backend.api.auth.dto.UserResponse;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import java.time.Instant;
import java.util.ArrayList;
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
		LinkedCaseSummary vinculo,
		String motivoPublicacao,
		UserResponse autor,
		List<String> acoesPermitidas) {

	public CitizenCaseResponse {
		imagens = List.copyOf(imagens);
		atualizacoes = List.copyOf(atualizacoes);
		acoesPermitidas = List.copyOf(acoesPermitidas);
	}

	public static CitizenCaseResponse from(CaseDocument item, boolean owner, UserResponse author) {
		return from(item, owner, owner, author);
	}

	public static CitizenCaseResponse from(
			CaseDocument item,
			boolean owner,
			boolean includePrivateUpdates,
			UserResponse author) {
		return from(item, owner, includePrivateUpdates, author, null);
	}

	public static CitizenCaseResponse from(
			CaseDocument item,
			boolean owner,
			boolean includePrivateUpdates,
			UserResponse author,
			LinkedCaseSummary linkedCase) {
		List<String> actions = owner && item.status() == CaseStatus.RECEBIDO
				? List.of("editar", "cancelar")
				: List.of();
		return from(item, owner, includePrivateUpdates, author, linkedCase, actions);
	}

	public static CitizenCaseResponse from(
			CaseDocument item,
			boolean owner,
			boolean includePrivateUpdates,
			UserResponse author,
			LinkedCaseSummary linkedCase,
			List<String> actions) {
		List<ImageResponse> images = Objects.requireNonNullElse(item.imagens(), List.<CaseDocument.ImageSnapshot>of())
				.stream()
				.map(image -> new ImageResponse(image.id(), image.url(), image.ilustrativa()))
				.toList();
		List<UpdateResponse> updates = Objects.requireNonNullElse(item.atualizacoes(),
						List.<CaseDocument.UpdateSnapshot>of())
				.stream()
				.filter(update -> includePrivateUpdates || update.publicada())
				.map(update -> new UpdateResponse(update.id(), update.texto(), update.criadoEm(), update.titulo()))
				.toList();
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
				linkedCase,
				item.revisaoPublicacao() == null ? null : item.revisaoPublicacao().justificativa(),
				author,
				actions);
	}

	public static List<String> staffActions(CaseDocument item) {
		List<String> actions = new ArrayList<>();
		if (item.status() != CaseStatus.CANCELADO && item.status() != CaseStatus.VINCULADO) {
			actions.add("comentar");
			actions.add("nota");
			switch (item.status()) {
				case RECEBIDO -> actions.add("analisar");
				case EM_ANALISE -> {
					actions.add("agendar");
					actions.add("vincular");
					actions.add("encerrar");
				}
				case VISITA_AGENDADA -> {
					actions.add("agendar");
					actions.add("iniciar");
					actions.add("vincular");
					actions.add("encerrar");
				}
				case EM_ATENDIMENTO -> {
					actions.add("resolver");
					actions.add("vincular");
					actions.add("encerrar");
				}
				default -> {
				}
			}
			actions.add("publicar");
		}
		return List.copyOf(actions);
	}

	public record ImageResponse(String id, String url, boolean ilustrativa) {
	}

	public record UpdateResponse(String id, String texto, Instant criadoEm, String titulo) {
	}

	public record LinkedCaseSummary(
			String id,
			String protocolo,
			CaseStatus status,
			CaseDocument.VisitWindow previsaoVisita,
			String detalhePublicoUrl) {
	}
}
