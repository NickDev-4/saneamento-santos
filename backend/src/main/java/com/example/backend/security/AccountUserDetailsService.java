package com.example.backend.security;

import com.example.backend.infrastructure.persistence.user.UserAccountRepository;
import java.util.Locale;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AccountUserDetailsService implements UserDetailsService {

	private final UserAccountRepository accounts;

	public AccountUserDetailsService(UserAccountRepository accounts) {
		this.accounts = accounts;
	}

	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
		return accounts.findByEmail(normalizedEmail)
				.map(UserPrincipal::from)
				.orElseThrow(() -> new UsernameNotFoundException("Credenciais inválidas."));
	}
}
