package com.example.backend.security;

import com.example.backend.domain.user.UserRole;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record UserPrincipal(
		String id,
		String username,
		String nome,
		String telefone,
		String passwordHash,
		UserRole perfil) implements UserDetails, Serializable {

	public static UserPrincipal from(com.example.backend.infrastructure.persistence.user.UserAccount account) {
		return new UserPrincipal(
				account.id(),
				account.email(),
				account.nome(),
				account.telefone(),
				account.passwordHash(),
				account.perfil());
	}

	public UserPrincipal withoutPassword() {
		return new UserPrincipal(id, username, nome, telefone, null, perfil);
	}

	@Override
	public String getUsername() {
		return username;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + perfil.name()));
	}

	@Override
	public String getPassword() {
		return passwordHash;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return true;
	}
}
