package com.example.backend.security;

import com.example.backend.infrastructure.persistence.user.UserAccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.dao.DataAccessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class CredentialVersionFilter extends OncePerRequestFilter {
	private final UserAccountRepository accounts;

	public CredentialVersionFilter(UserAccountRepository accounts) {
		this.accounts = accounts;
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication != null && authentication.isAuthenticated()
				&& authentication.getPrincipal() instanceof UserPrincipal principal) {
			boolean current;
			try {
				current = accounts.findById(principal.id())
						.map(account -> account.effectivePasswordVersion() == principal.credentialVersion())
						.orElse(false);
			} catch (DataAccessException exception) {
				response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
				response.setContentType("application/json");
				response.setCharacterEncoding("UTF-8");
				response.getWriter().write(
						"{\"code\":\"DATABASE_UNAVAILABLE\",\"message\":\"Serviço temporariamente indisponível.\",\"fieldErrors\":{}}");
				return;
			}
			if (!current) {
				var session = request.getSession(false);
				if (session != null) {
					session.invalidate();
				}
				SecurityContextHolder.clearContext();
				response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
				response.setContentType("application/json");
				response.setCharacterEncoding("UTF-8");
				response.getWriter().write(
						"{\"code\":\"SESSION_EXPIRED\",\"message\":\"Sessão inválida ou expirada.\",\"fieldErrors\":{}}");
				return;
			}
		}
		filterChain.doFilter(request, response);
	}
}
