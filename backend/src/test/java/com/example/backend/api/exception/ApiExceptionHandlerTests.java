package com.example.backend.api.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.example.backend.api.dto.ApiErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

class ApiExceptionHandlerTests {

	private final ApiExceptionHandler exceptionHandler = new ApiExceptionHandler();

	@Test
	void formatsFieldValidationErrorsAccordingToApiContract() {
		BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "request");
		bindingResult.addError(new FieldError("request", "descricao", "Informe uma descrição."));
		MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

		var response = exceptionHandler.handleInvalidRequest(exception);
		ApiErrorResponse body = response.getBody();

		assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
		assertEquals("VALIDATION_ERROR", body.code());
		assertEquals("Revise os campos indicados.", body.message());
		assertEquals("Informe uma descrição.", body.fieldErrors().get("descricao"));
	}
}
