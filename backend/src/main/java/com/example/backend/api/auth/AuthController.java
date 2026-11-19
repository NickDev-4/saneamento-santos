package com.example.backend.api.auth;

import com.example.backend.api.auth.dto.LoginRequest;
import com.example.backend.api.auth.dto.PasswordResetRequest;
import com.example.backend.api.auth.dto.ProfileUpdateRequest;
import com.example.backend.api.auth.dto.RecoveryRequest;
import com.example.backend.api.auth.dto.SignupRequest;
import com.example.backend.api.auth.dto.UserResponse;
import com.example.backend.application.auth.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/auth/cadastro")
	public ResponseEntity<UserResponse> register(@Valid @RequestBody SignupRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
	}

	@PostMapping("/auth/login")
	public UserResponse login(
			@Valid @RequestBody LoginRequest request,
			HttpServletRequest servletRequest,
			HttpServletResponse response) {
		return authService.login(request, servletRequest, response);
	}

	@GetMapping("/auth/me")
	public UserResponse currentUser(Authentication authentication) {
		return authService.currentUser(authentication);
	}

	@PostMapping("/auth/logout")
	public ResponseEntity<Void> logout(HttpServletRequest request) {
		authService.logout(request);
		return ResponseEntity.noContent().build();
	}

	@PatchMapping("/me")
	public UserResponse updateProfile(
			Authentication authentication,
			@Valid @RequestBody ProfileUpdateRequest request) {
		return authService.updateProfile(authentication, request);
	}

	@PostMapping("/auth/recuperacao")
	public ResponseEntity<Void> recover(@Valid @RequestBody RecoveryRequest request) {
		authService.recover(request);
		return ResponseEntity.accepted().build();
	}

	@PostMapping("/auth/redefinicao")
	public ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
		authService.resetPassword(request);
		return ResponseEntity.noContent().build();
	}
}
