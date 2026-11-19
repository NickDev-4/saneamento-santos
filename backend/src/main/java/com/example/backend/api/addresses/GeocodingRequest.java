package com.example.backend.api.addresses;

import com.example.backend.infrastructure.persistence.cases.CaseDocument.AddressSnapshot;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record GeocodingRequest(@NotNull @Valid AddressSnapshot endereco) {
}
