package com.example.backend.application.cases;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.example.backend.api.exception.ApiException;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

class CaseImageValidatorTests {

	private final CaseImageValidator validator = new CaseImageValidator();

	@Test
	void detectsImageTypeFromContentInsteadOfBrowserMimeType() {
		MultipartFile file = new MockMultipartFile(
				"imagens",
				"foto.jpg",
				"image/jpeg",
				pngImage());

		ValidatedImage result = validator.validate(List.of(file), 0).get(0);

		assertEquals("image/png", result.contentType());
	}

	@Test
	void rejectsUnsupportedContentEvenWhenBrowserClaimsItIsPng() {
		MultipartFile file = new MockMultipartFile(
				"imagens",
				"foto.png",
				"image/png",
				"not an image".getBytes());

		ApiException exception = assertThrows(
				ApiException.class,
				() -> validator.validate(List.of(file), 0));

		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
		assertEquals("imagens", exception.fieldErrors().keySet().iterator().next());
	}

	@Test
	void rejectsMoreThanThreeCombinedImages() {
		MultipartFile file = new MockMultipartFile("imagens", "foto.png", "image/png", pngImage());

		ApiException exception = assertThrows(
				ApiException.class,
				() -> validator.validate(List.of(file), 3));

		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
	}

	@Test
	void rejectsFilesOverFiveMebibytesWithPayloadTooLarge() {
		MultipartFile file = new MockMultipartFile(
				"imagens",
				"foto.png",
				"image/png",
				new byte[CaseImageValidator.MAX_FILE_SIZE + 1]);

		ApiException exception = assertThrows(
				ApiException.class,
				() -> validator.validate(List.of(file), 0));

		assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, exception.status());
		assertEquals("FILE_TOO_LARGE", exception.code());
	}

	private byte[] pngImage() {
		BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
		try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
			ImageIO.write(image, "png", output);
			return output.toByteArray();
		} catch (IOException exception) {
			throw new AssertionError(exception);
		}
	}
}
