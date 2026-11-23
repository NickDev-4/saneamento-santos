package com.example.backend.application.cases;

import com.example.backend.api.exception.ApiException;
import com.example.backend.application.publicapi.CasePublicVisibility;
import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import com.example.backend.infrastructure.persistence.cases.CaseRepository;
import com.example.backend.infrastructure.storage.ImageContentStorage;
import com.example.backend.security.UserPrincipal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CaseImageService {

	private static final Logger LOGGER = LoggerFactory.getLogger(CaseImageService.class);
	private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
	private final CaseRepository caseRepository;
	private final ImageContentStorage storage;
	private final CaseImageValidator validator;

	public CaseImageService(
			CaseRepository caseRepository,
			ImageContentStorage storage,
			CaseImageValidator validator) {
		this.caseRepository = caseRepository;
		this.storage = storage;
		this.validator = validator;
	}

	public List<CaseDocument.ImageSnapshot> storeNewImages(
			String caseId,
			List<MultipartFile> files,
			int retainedCount) {
		List<ValidatedImage> validated = validator.validate(files, retainedCount);
		List<CaseDocument.ImageSnapshot> stored = new ArrayList<>();
		try {
			for (ValidatedImage image : validated) {
				String id = UUID.randomUUID().toString();
				storage.store(caseId, id, image.content());
				stored.add(new CaseDocument.ImageSnapshot(
						id,
						"/api/v1/imagens/" + id,
						image.contentType(),
						false,
						false));
			}
			return List.copyOf(stored);
		} catch (ImageStorageException exception) {
			deleteNewImages(caseId, stored, exception);
			throw exception;
		}
	}

	public void discardNewImages(String caseId, List<CaseDocument.ImageSnapshot> images, Throwable originalFailure) {
		deleteNewImages(caseId, images, originalFailure);
	}

	public void deleteRemovedImages(String caseId, List<CaseDocument.ImageSnapshot> images) {
		for (CaseDocument.ImageSnapshot image : images) {
			try {
				storage.delete(caseId, image.id());
			} catch (ImageStorageException exception) {
				LOGGER.error("Could not remove image content after a successful case update.", exception);
			}
		}
	}

	public ImageContent privateImage(String id, UserPrincipal principal) {
		CaseDocument caseDocument = findCaseForImage(id);
		boolean sabesp = principal.perfil() == UserRole.SABESP;
		boolean owner = principal.perfil() == UserRole.CIDADAO
				&& principal.id().equals(caseDocument.autorId());
		if (!sabesp && !owner) {
			throw notFound();
		}
		return readImage(caseDocument, id);
	}

	public ImageContent publicImage(String id) {
		CaseDocument caseDocument = findCaseForImage(id);
		if (!CasePublicVisibility.isPublic(caseDocument)) {
			throw notFound();
		}
		CaseDocument.ImageSnapshot image = findImage(caseDocument, id);
		if (!image.aprovada()) {
			throw notFound();
		}
		return readImage(caseDocument, image.id());
	}

	private ImageContent readImage(CaseDocument caseDocument, String id) {
		return readImage(findImage(caseDocument, id), caseDocument.id());
	}

	private ImageContent readImage(CaseDocument.ImageSnapshot image, String caseId) {
		if (image.contentType() == null || !ALLOWED_CONTENT_TYPES.contains(image.contentType())) {
			throw new ImageStorageException();
		}
		return new ImageContent(image.contentType(), storage.read(caseId, image.id()));
	}

	private CaseDocument findCaseForImage(String id) {
		if (!isCanonicalUuid(id)) {
			throw notFound();
		}
		return caseRepository.findFirstByImageId(id).orElseThrow(CaseImageService::notFound);
	}

	private CaseDocument.ImageSnapshot findImage(CaseDocument caseDocument, String id) {
		return (caseDocument.imagens() == null ? List.<CaseDocument.ImageSnapshot>of() : caseDocument.imagens())
				.stream()
				.filter(image -> id.equals(image.id()))
				.findFirst()
				.orElseThrow(CaseImageService::notFound);
	}

	private void deleteNewImages(
			String caseId,
			List<CaseDocument.ImageSnapshot> images,
			Throwable originalFailure) {
		for (CaseDocument.ImageSnapshot image : images) {
			try {
				storage.delete(caseId, image.id());
			} catch (ImageStorageException cleanupFailure) {
				originalFailure.addSuppressed(cleanupFailure);
				LOGGER.error("Could not remove an image after a failed upload.", cleanupFailure);
			}
		}
	}

	private boolean isCanonicalUuid(String value) {
		try {
			return UUID.fromString(value).toString().equals(value);
		} catch (IllegalArgumentException exception) {
			return false;
		}
	}

	private static ApiException notFound() {
		return new ApiException(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", "Imagem não encontrada.");
	}

	public record ImageContent(String contentType, byte[] content) {
	}
}
