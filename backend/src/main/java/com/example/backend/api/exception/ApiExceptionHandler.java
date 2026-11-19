package com.example.backend.api.exception;

import com.example.backend.api.dto.ApiErrorResponse;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleInvalidRequest(MethodArgumentNotValidException exception) {
		Map<String, String> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
				.collect(Collectors.toMap(
						FieldError::getField,
						error -> error.getDefaultMessage() == null ? "Valor inválido." : error.getDefaultMessage(),
						(first, ignored) -> first,
						TreeMap::new));
		return validationError(fieldErrors);
	}

	@ExceptionHandler(HandlerMethodValidationException.class)
	public ResponseEntity<ApiErrorResponse> handleInvalidMethodArguments(
			HandlerMethodValidationException exception) {
		return validationError(Map.of());
	}

	private ResponseEntity<ApiErrorResponse> validationError(Map<String, String> fieldErrors) {
		ApiErrorResponse response = new ApiErrorResponse(
				"VALIDATION_ERROR",
				"Revise os campos indicados.",
				fieldErrors);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
	}
}
