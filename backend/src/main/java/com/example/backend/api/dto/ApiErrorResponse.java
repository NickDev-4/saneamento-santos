package com.example.backend.api.dto;

import java.util.Map;

public record ApiErrorResponse(String code, String message, Map<String, String> fieldErrors) {
	public ApiErrorResponse {
		fieldErrors = Map.copyOf(fieldErrors);
	}
}
