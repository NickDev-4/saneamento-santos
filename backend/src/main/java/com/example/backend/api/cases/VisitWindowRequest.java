package com.example.backend.api.cases;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record VisitWindowRequest(@NotNull Instant inicio, @NotNull Instant fim) {
}
