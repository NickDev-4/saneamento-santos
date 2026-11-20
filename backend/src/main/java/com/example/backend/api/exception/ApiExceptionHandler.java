package com.example.backend.api.exception;

import com.example.backend.api.dto.ApiErrorResponse;
import com.example.backend.application.cases.ImageStorageException;
import com.example.backend.application.cases.ServiceAreaUnavailableException;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.mongodb.MongoTransactionException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

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

	@ExceptionHandler(MissingServletRequestPartException.class)
	public ResponseEntity<ApiErrorResponse> handleMissingMultipartPart(MissingServletRequestPartException exception) {
		return validationError(Map.of(exception.getRequestPartName(), "Esta parte do formulário é obrigatória."));
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<ApiErrorResponse> handleOversizedUpload(MaxUploadSizeExceededException exception) {
		ApiErrorResponse response = new ApiErrorResponse(
				"FILE_TOO_LARGE",
				"O envio excede o limite permitido.",
				Map.of("imagens", "Cada imagem deve ter no máximo 5 MiB."));
		return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(response);
	}

	@ExceptionHandler(ImageStorageException.class)
	public ResponseEntity<ApiErrorResponse> handleImageStorageUnavailable(ImageStorageException exception) {
		ApiErrorResponse response = new ApiErrorResponse(
				"IMAGE_STORAGE_UNAVAILABLE",
				"Não foi possível acessar o armazenamento de imagens.",
				Map.of());
		return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
	}

	@ExceptionHandler(ServiceAreaUnavailableException.class)
	public ResponseEntity<ApiErrorResponse> handleServiceAreaUnavailable(
			ServiceAreaUnavailableException exception) {
		ApiErrorResponse response = new ApiErrorResponse(
				"SERVICE_AREA_UNAVAILABLE",
				"A área de atendimento não está configurada.",
				Map.of());
		return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
	}

	@ExceptionHandler(DataAccessResourceFailureException.class)
	public ResponseEntity<ApiErrorResponse> handleDatabaseUnavailable(DataAccessResourceFailureException exception) {
		ApiErrorResponse response = new ApiErrorResponse(
				"DATABASE_UNAVAILABLE",
				"Serviço temporariamente indisponível.",
				Map.of());
		return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
	}

	@ExceptionHandler(MongoTransactionException.class)
	public ResponseEntity<ApiErrorResponse> handleTransactionUnavailable(MongoTransactionException exception) {
		ApiErrorResponse response = new ApiErrorResponse(
				"WORKFLOW_TRANSACTION_UNAVAILABLE",
				"Não foi possível concluir a operação com segurança. Verifique se o MongoDB suporta transações.",
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
