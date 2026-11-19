package com.example.backend.api.cases;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record CaseWriteRequest(
		@NotBlank @Size(max = 100) String tipoId,
		@NotBlank @Size(max = 2000) String descricao,
		@NotNull Instant observadoEm,
		@NotNull @Valid AddressData endereco,
		@NotNull @Valid LocationData localizacao,
		@Size(max = 100) String reincidenciaDe) {

	public record AddressData(
			@NotBlank @Pattern(regexp = "\\d{5}-?\\d{3}") String cep,
			@NotBlank @Size(max = 200) String logradouro,
			@Size(max = 50) String numero,
			boolean semNumero,
			@NotBlank @Size(max = 100) String bairro,
			@NotBlank @Size(max = 100) String cidade,
			@NotBlank @Size(min = 2, max = 2) String uf,
			@Size(max = 500) String referencia) {
	}

	public record LocationData(
			@NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
			@NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude) {
	}
}
