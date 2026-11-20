package com.example.backend.infrastructure.persistence.cases;

import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import java.time.Instant;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("cases")
@CompoundIndexes({
		@CompoundIndex(name = "idx_cases_operational_queue", def = "{ 'status': 1, 'criadoEm': -1 }"),
		@CompoundIndex(name = "idx_cases_public_indicators", def = "{ 'publicacao': 1, 'status': 1, 'criadoEm': -1 }")
})
public record CaseDocument(
		@Id String id,
		@Indexed(unique = true, name = "uq_cases_protocol") String protocolo,
		String tipoId,
		String tipo,
		String descricao,
		Instant observadoEm,
		Instant criadoEm,
		Instant atualizadoEm,
		AddressSnapshot endereco,
		LocationSnapshot localizacao,
		CaseStatus status,
		PublicationState publicacao,
		PublicationReview revisaoPublicacao,
		List<ImageSnapshot> imagens,
		VisitWindow previsaoVisita,
		List<UpdateSnapshot> atualizacoes,
		String autorId,
		String reincidenciaDe,
		String vinculoId,
		@Version Long version) {

	public CaseDocument withWorkflow(
			CaseStatus nextStatus,
			PublicationState nextPublication,
			PublicationReview publicationReview,
			List<ImageSnapshot> nextImages,
			VisitWindow nextVisitWindow,
			List<UpdateSnapshot> nextUpdates,
			String nextLinkId,
			Instant updatedAt) {
		return new CaseDocument(
				id,
				protocolo,
				tipoId,
				tipo,
				descricao,
				observadoEm,
				criadoEm,
				updatedAt,
				endereco,
				localizacao,
				nextStatus,
				nextPublication,
				publicationReview,
				nextImages,
				nextVisitWindow,
				nextUpdates,
				autorId,
				reincidenciaDe,
				nextLinkId,
				version);
	}

	public record AddressSnapshot(
			String cep,
			String logradouro,
			String numero,
			boolean semNumero,
			String bairro,
			String cidade,
			String uf,
			String referencia) {
	}

	public record LocationSnapshot(double latitude, double longitude) {
	}

	public record ImageSnapshot(
			@Indexed(name = "idx_cases_image_id") String id,
			String url,
			String contentType,
			boolean ilustrativa,
			boolean aprovada) {
	}

	public record VisitWindow(Instant inicio, Instant fim) {
	}

	public record PublicationReview(String revisadoPor, Instant revisadoEm, String justificativa) {
	}

	public record UpdateSnapshot(
			String id,
			String texto,
			Instant criadoEm,
			String titulo,
			boolean publicada,
			String autorId) {
	}
}
