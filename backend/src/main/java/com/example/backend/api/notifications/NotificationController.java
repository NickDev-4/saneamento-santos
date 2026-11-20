package com.example.backend.api.notifications;

import com.example.backend.api.publicapi.PageResponse;
import com.example.backend.application.notifications.NotificationService;
import com.example.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/notificacoes")
@PreAuthorize("hasRole('CIDADAO')")
@Tag(name = "Notificações do cidadão")
@SecurityRequirement(name = "sessionCookie")
public class NotificationController {

	private final NotificationService notifications;

	public NotificationController(NotificationService notifications) {
		this.notifications = notifications;
	}

	@GetMapping
	public PageResponse<NotificationResponse> list(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return notifications.list(principal, page, size);
	}

	@PatchMapping("/{id}/leitura")
	@SecurityRequirement(name = "csrfHeader")
	public NotificationResponse markRead(
			@PathVariable String id,
			@AuthenticationPrincipal UserPrincipal principal) {
		return notifications.markRead(id, principal);
	}
}
