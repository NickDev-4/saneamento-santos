package com.example.backend.infrastructure.persistence.cases;

import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import java.time.Instant;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("cases")
public record CaseDocument(
		@Id String id,
		String protocolo,
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
		List<ImageSnapshot> imagens,
		VisitWindow previsaoVisita,
		List<UpdateSnapshot> atualizacoes,
		String autorId,
		String reincidenciaDe,
		String vinculoId) {

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

	public record ImageSnapshot(String id, String url, boolean ilustrativa, boolean aprovada) {
	}

	public record VisitWindow(Instant inicio, Instant fim) {
	}

	public record UpdateSnapshot(String id, String texto, Instant criadoEm, String titulo, boolean publicada) {
	}
}
