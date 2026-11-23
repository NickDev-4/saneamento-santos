package com.example.backend.infrastructure.storage;

import com.example.backend.application.cases.ImageStorageException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LocalFileImageContentStorage implements ImageContentStorage {

	private final Path root;

	public LocalFileImageContentStorage(
			@Value("${files.storage-directory:./uploads}") String storageDirectory) {
		this.root = Path.of(storageDirectory).toAbsolutePath().normalize();
	}

	@Override
	public void store(String caseId, String imageId, byte[] content) {
		Path destination = resolve(caseId, imageId);
		Path temporary = null;
		try {
			Files.createDirectories(destination.getParent());
			temporary = Files.createTempFile(destination.getParent(), ".image-", ".tmp");
			Files.write(temporary, content, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
			try {
				Files.move(temporary, destination, StandardCopyOption.ATOMIC_MOVE);
			} catch (AtomicMoveNotSupportedException exception) {
				Files.move(temporary, destination);
			}
		} catch (IOException exception) {
			if (temporary != null) {
				try {
					Files.deleteIfExists(temporary);
				} catch (IOException cleanupFailure) {
					exception.addSuppressed(cleanupFailure);
				}
			}
			throw new ImageStorageException(exception);
		}
	}

	@Override
	public byte[] read(String caseId, String imageId) {
		try {
			Path currentPath = resolve(caseId, imageId);
			if (Files.isRegularFile(currentPath)) {
				return Files.readAllBytes(currentPath);
			}
			return Files.readAllBytes(resolveLegacy(imageId));
		} catch (IOException exception) {
			throw new ImageStorageException(exception);
		}
	}

	@Override
	public void delete(String caseId, String imageId) {
		try {
			Files.deleteIfExists(resolve(caseId, imageId));
			Files.deleteIfExists(resolveLegacy(imageId));
		} catch (IOException exception) {
			throw new ImageStorageException(exception);
		}
	}

	private Path resolve(String caseId, String imageId) {
		try {
			validateCaseId(caseId);
			validateUuid(imageId);
			return root.resolve("chamados").resolve(caseId).resolve(imageId);
		} catch (IllegalArgumentException exception) {
			throw new ImageStorageException(exception);
		}
	}

	private void validateCaseId(String value) {
		if (value != null && value.matches("[0-9a-fA-F]{24}")) {
			return;
		}
		validateUuid(value);
	}

	private Path resolveLegacy(String imageId) {
		try {
			validateUuid(imageId);
			return root.resolve(imageId);
		} catch (IllegalArgumentException exception) {
			throw new ImageStorageException(exception);
		}
	}

	private void validateUuid(String value) {
		UUID uuid = UUID.fromString(value);
		if (!uuid.toString().equals(value)) {
			throw new IllegalArgumentException();
		}
	}
}
