package com.example.backend.api.publicapi;

import java.util.List;

public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {
	public PageResponse {
		items = List.copyOf(items);
	}
}
