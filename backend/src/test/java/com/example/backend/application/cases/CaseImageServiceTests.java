package com.example.backend.application.cases;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.api.exception.ApiException;
import com.example.backend.domain.cases.CaseStatus;
import com.example.backend.domain.cases.PublicationState;
import com.example.backend.domain.user.UserRole;
import com.example.backend.infrastructure.persistence.cases.CaseDocument;
import com.example.backend.infrastructure.persistence.cases.CaseRepository;
import com.example.backend.infrastructure.storage.ImageContentStorage;
import com.example.backend.security.UserPrincipal;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

class CaseImageServiceTests {

	private final CaseRepository caseRepository = mock(CaseRepository.class);
	private final ImageContentStorage storage = mock(ImageContentStorage.class);
	private final CaseImageService service = new CaseImageService(
			caseRepository, storage, new CaseImageValidator());

	@Test
	void servesPrivateImageOnlyToItsOwner() {
		String id = UUID.randomUUID().toString();
		CaseDocument item = caseWithImage(id, CaseStatus.RECEBIDO, PublicationState.PENDENTE, false);
		when(caseRepository.findFirstByImageId(id)).thenReturn(Optional.of(item));
		when(storage.read(id)).thenReturn(new byte[] { 1, 2, 3 });

		ApiException denied = assertThrows(
				ApiException.class,
				() -> service.privateImage(id, citizen("another-user")));
		var result = service.privateImage(id, citizen("owner-id"));

		assertEquals(HttpStatus.NOT_FOUND, denied.status());
		assertEquals("image/png", result.contentType());
		assertArrayEquals(new byte[] { 1, 2, 3 }, result.content());
		verify(storage).read(id);
	}

	@Test
	void servesPublicImageOnlyWhenCaseAndImageAreApproved() {
		String id = UUID.randomUUID().toString();
		CaseDocument pendingImage = caseWithImage(id, CaseStatus.RECEBIDO, PublicationState.APROVADO, false);
		when(caseRepository.findFirstByImageId(id)).thenReturn(Optional.of(pendingImage));

		ApiException denied = assertThrows(ApiException.class, () -> service.publicImage(id));

		assertEquals(HttpStatus.NOT_FOUND, denied.status());
		verify(storage, never()).read(id);
	}

	@Test
	void servesApprovedImageFromAnApprovedPublicCase() {
		String id = UUID.randomUUID().toString();
		CaseDocument approvedImage = caseWithImage(id, CaseStatus.RESOLVIDO, PublicationState.APROVADO, true);
		when(caseRepository.findFirstByImageId(id)).thenReturn(Optional.of(approvedImage));
		when(storage.read(id)).thenReturn(new byte[] { 4, 5, 6 });

		var result = service.publicImage(id);

		assertEquals("image/png", result.contentType());
		assertArrayEquals(new byte[] { 4, 5, 6 }, result.content());
	}

	@Test
	void storesValidatedImagesUnderOpaqueIdentifiers() {
		MockMultipartFile file = new MockMultipartFile(
				"imagens", "client-name.png", "text/plain", pngHeader());

		List<CaseDocument.ImageSnapshot> result = service.storeNewImages(List.of(file), 0);

		assertEquals(1, result.size());
		assertEquals("image/png", result.get(0).contentType());
		assertEquals("/api/v1/imagens/" + result.get(0).id(), result.get(0).url());
		ArgumentCaptor<byte[]> content = ArgumentCaptor.forClass(byte[].class);
		verify(storage).store(eq(result.get(0).id()), content.capture());
		assertArrayEquals(pngHeader(), content.getValue());
	}

	private CaseDocument caseWithImage(
			String imageId,
			CaseStatus status,
			PublicationState publication,
			boolean approved) {
		return new CaseDocument(
				"case-id",
				"SS-2026-1",
				"type-id",
				"Tipo",
				"Descrição",
				Instant.now(),
				Instant.now(),
				Instant.now(),
				null,
				null,
				status,
				publication,
				List.of(new CaseDocument.ImageSnapshot(imageId, "/api/v1/imagens/" + imageId,
						"image/png", false, approved)),
				null,
				List.of(),
				"owner-id",
				null,
				null,
				0L);
	}

	private UserPrincipal citizen(String id) {
		return new UserPrincipal(id, id + "@example.test", "Cidadão", null, null, UserRole.CIDADAO);
	}

	private byte[] pngHeader() {
		BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
		try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
			ImageIO.write(image, "png", output);
			return output.toByteArray();
		} catch (IOException exception) {
			throw new AssertionError(exception);
		}
	}
}
