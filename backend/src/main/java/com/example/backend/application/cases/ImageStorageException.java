package com.example.backend.application.cases;

public class ImageStorageException extends RuntimeException {
	public ImageStorageException() {
		super("O armazenamento de imagens está indisponível.");
	}

	public ImageStorageException(Throwable cause) {
		super("O armazenamento de imagens está indisponível.", cause);
	}
}
