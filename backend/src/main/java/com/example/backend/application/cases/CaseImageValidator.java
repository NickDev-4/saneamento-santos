package com.example.backend.application.cases;

import com.example.backend.api.exception.ApiException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class CaseImageValidator {

	public static final int MAX_FILE_SIZE = 5 * 1024 * 1024;
	public static final int MAX_IMAGE_COUNT = 3;
	public static final int MIN_IMAGE_COUNT = 1;
	private static final byte[] PNG_SIGNATURE = new byte[] {
			(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
	};

	public List<ValidatedImage> validate(List<MultipartFile> files, int retainedCount) {
		List<MultipartFile> uploads = files == null ? List.of() : files;
		int total = retainedCount + uploads.size();
		if (retainedCount < 0 || total < MIN_IMAGE_COUNT || total > MAX_IMAGE_COUNT) {
			throw invalid("imagens", "O chamado deve manter de uma a três imagens.");
		}
		return uploads.stream().map(this::validate).toList();
	}

	private ValidatedImage validate(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw invalid("imagens", "Cada imagem deve conter um arquivo.");
		}
		if (file.getSize() > MAX_FILE_SIZE) {
			throw new ApiException(
					HttpStatus.PAYLOAD_TOO_LARGE,
					"FILE_TOO_LARGE",
					"Cada imagem deve ter no máximo 5 MiB.",
					Map.of("imagens", "O arquivo excede o limite de 5 MiB."));
		}
		byte[] content;
		try {
			content = file.getBytes();
		} catch (IOException exception) {
			throw invalid("imagens", "Não foi possível ler uma das imagens.");
		}
		if (content.length == 0 || content.length > MAX_FILE_SIZE) {
			throw invalid("imagens", "O arquivo de imagem está vazio ou excede o limite permitido.");
		}
		String contentType = sniffContentType(content);
		if (contentType == null) {
			throw invalid("imagens", "Use imagens JPEG, PNG ou WebP válidas.");
		}
		return new ValidatedImage(content, contentType);
	}

	private String sniffContentType(byte[] content) {
		if (content.length >= 3
				&& content[0] == (byte) 0xff
				&& content[1] == (byte) 0xd8
				&& content[2] == (byte) 0xff) {
			return isReadableImage(content, "JPEG") ? "image/jpeg" : null;
		}
		if (content.length >= 24
				&& startsWith(content, PNG_SIGNATURE)
				&& content[12] == 'I'
				&& content[13] == 'H'
				&& content[14] == 'D'
				&& content[15] == 'R') {
			return isReadableImage(content, "PNG") ? "image/png" : null;
		}
		if (content.length >= 12
				&& content[0] == 'R'
				&& content[1] == 'I'
				&& content[2] == 'F'
				&& content[3] == 'F'
				&& content[8] == 'W'
				&& content[9] == 'E'
				&& content[10] == 'B'
				&& content[11] == 'P') {
			long riffLength = Integer.toUnsignedLong(
					(content[4] & 0xff)
							| ((content[5] & 0xff) << 8)
							| ((content[6] & 0xff) << 16)
							| ((content[7] & 0xff) << 24));
			if (riffLength == content.length - 8L && hasWebpImageChunk(content)) {
				return "image/webp";
			}
		}
		return null;
	}

	private boolean isReadableImage(byte[] content, String expectedFormat) {
		try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(content))) {
			if (input == null) {
				return false;
			}
			Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
			if (!readers.hasNext()) {
				return false;
			}
			ImageReader reader = readers.next();
			try {
				reader.setInput(input, true, true);
				return expectedFormat.equalsIgnoreCase(reader.getFormatName())
						&& reader.getWidth(0) > 0
						&& reader.getHeight(0) > 0;
			} finally {
				reader.dispose();
			}
		} catch (IOException exception) {
			return false;
		}
	}

	private boolean hasWebpImageChunk(byte[] content) {
		if (content.length < 20) {
			return false;
		}
		String chunkType = new String(content, 12, 4, StandardCharsets.US_ASCII);
		long chunkLength = Integer.toUnsignedLong(
				(content[16] & 0xff)
						| ((content[17] & 0xff) << 8)
						| ((content[18] & 0xff) << 16)
						| ((content[19] & 0xff) << 24));
		return switch (chunkType) {
			case "VP8 " -> chunkLength >= 10 && chunkLength <= content.length - 20L;
			case "VP8L" -> chunkLength >= 5 && chunkLength <= content.length - 20L;
			case "VP8X" -> chunkLength >= 10 && chunkLength <= content.length - 20L;
			default -> false;
		};
	}

	private boolean startsWith(byte[] content, byte[] prefix) {
		for (int index = 0; index < prefix.length; index++) {
			if (content[index] != prefix[index]) {
				return false;
			}
		}
		return true;
	}

	private ApiException invalid(String field, String message) {
		return new ApiException(
				HttpStatus.BAD_REQUEST,
				"VALIDATION_ERROR",
				"Revise os campos indicados.",
				Map.of(field, message));
	}
}
