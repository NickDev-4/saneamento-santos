package com.example.backend.infrastructure.storage;

import com.example.backend.application.cases.ImageStorageException;

public interface ImageContentStorage {
	void store(String caseId, String imageId, byte[] content) throws ImageStorageException;

	byte[] read(String caseId, String imageId) throws ImageStorageException;

	void delete(String caseId, String imageId) throws ImageStorageException;
}
