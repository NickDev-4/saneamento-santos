package com.example.backend.infrastructure.storage;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.example.backend.application.cases.ImageStorageException;
import java.nio.file.Path;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalFileImageContentStorageTests {

	@TempDir
	Path temporaryDirectory;

	@Test
	void storesReadsAndDeletesOpaqueImageContent() {
		LocalFileImageContentStorage storage = new LocalFileImageContentStorage(temporaryDirectory.toString());
		String id = UUID.randomUUID().toString();
		byte[] content = new byte[] { 1, 2, 3 };

		storage.store(id, content);

		assertArrayEquals(content, storage.read(id));
		storage.delete(id);
		assertThrows(ImageStorageException.class, () -> storage.read(id));
	}

	@Test
	void refusesClientControlledStoragePaths() {
		LocalFileImageContentStorage storage = new LocalFileImageContentStorage(temporaryDirectory.toString());

		assertThrows(ImageStorageException.class, () -> storage.read("..\\private"));
	}
}
