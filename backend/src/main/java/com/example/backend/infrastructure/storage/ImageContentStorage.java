package com.example.backend.infrastructure.storage;

import com.example.backend.application.cases.ImageStorageException;

public interface ImageContentStorage {
	void store(String id, byte[] content) throws ImageStorageException;

	byte[] read(String id) throws ImageStorageException;

	void delete(String id) throws ImageStorageException;
}
