package com.example.backend.api.cases;

import com.example.backend.application.cases.CaseImageService;
import com.example.backend.application.cases.CaseImageService.ImageContent;
import com.example.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Imagens de chamados")
public class CaseImageController {

	private final CaseImageService images;

	public CaseImageController(CaseImageService images) {
		this.images = images;
	}

	@GetMapping("/imagens/{id}")
	@PreAuthorize("hasAnyRole('CIDADAO', 'SABESP')")
	@SecurityRequirement(name = "sessionCookie")
	public ResponseEntity<byte[]> privateImage(
			@PathVariable String id,
			@AuthenticationPrincipal UserPrincipal principal) {
		ImageContent image = images.privateImage(id, principal);
		return response(image)
				.cacheControl(CacheControl.noStore().cachePrivate())
				.build();
	}

	@GetMapping("/public/imagens/{id}")
	public ResponseEntity<byte[]> publicImage(@PathVariable String id) {
		ImageContent image = images.publicImage(id);
		return response(image)
				.cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
				.build();
	}

	private ResponseEntity.BodyBuilder response(ImageContent image) {
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(image.contentType()))
				.header("X-Content-Type-Options", "nosniff");
	}
}
