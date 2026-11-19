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
	public void store(String id, byte[] content) {
		Path destination = resolve(id);
		Path temporary = null;
		try {
			Files.createDirectories(root);
			temporary = Files.createTempFile(root, ".image-", ".tmp");
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
	public byte[] read(String id) {
		try {
			return Files.readAllBytes(resolve(id));
		} catch (IOException exception) {
			throw new ImageStorageException(exception);
		}
	}

	@Override
	public void delete(String id) {
		try {
			Files.deleteIfExists(resolve(id));
		} catch (IOException exception) {
			throw new ImageStorageException(exception);
		}
	}

	private Path resolve(String id) {
		try {
			UUID uuid = UUID.fromString(id);
			if (!uuid.toString().equals(id)) {
				throw new IllegalArgumentException();
			}
			return root.resolve(id);
		} catch (IllegalArgumentException exception) {
			throw new ImageStorageException(exception);
		}
	}
}
