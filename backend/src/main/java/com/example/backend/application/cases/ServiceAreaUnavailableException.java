package com.example.backend.application.cases;

public class ServiceAreaUnavailableException extends RuntimeException {
	public ServiceAreaUnavailableException() {
		super("A área de atendimento não está configurada.");
	}

	public ServiceAreaUnavailableException(Throwable cause) {
		super("A área de atendimento não está configurada.", cause);
	}
}
