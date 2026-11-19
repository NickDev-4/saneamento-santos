package com.example.backend.api.exception;

import com.example.backend.api.dto.ApiErrorResponse;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<ApiErrorResponse> handleApiException(ApiException exception) {
		ApiErrorResponse response = new ApiErrorResponse(
				exception.code(),
				exception.getMessage(),
				exception.fieldErrors());
		return ResponseEntity.status(exception.status()).body(response);
	}

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

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiErrorResponse> handleInvalidParameter(MethodArgumentTypeMismatchException exception) {
		return validationError(Map.of(exception.getName(), "O valor informado não é válido."));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiErrorResponse> handleUnreadableRequest(HttpMessageNotReadableException exception) {
		return validationError(Map.of());
	}

	@ExceptionHandler(DataAccessResourceFailureException.class)
	public ResponseEntity<ApiErrorResponse> handleDatabaseUnavailable(DataAccessResourceFailureException exception) {
		ApiErrorResponse response = new ApiErrorResponse(
				"DATABASE_UNAVAILABLE",
				"Serviço temporariamente indisponível.",
				Map.of());
		return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
	}

	private ResponseEntity<ApiErrorResponse> validationError(Map<String, String> fieldErrors) {
		ApiErrorResponse response = new ApiErrorResponse(
				"VALIDATION_ERROR",
				"Revise os campos indicados.",
				fieldErrors);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
	}
}
