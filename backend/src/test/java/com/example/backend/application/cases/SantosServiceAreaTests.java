package com.example.backend.application.cases;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.example.backend.api.exception.ApiException;
import com.example.backend.infrastructure.persistence.cases.CaseDocument.LocationSnapshot;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.ObjectMapper;

class SantosServiceAreaTests {

	@TempDir
	Path temporaryDirectory;

	@Test
	void acceptsLocationsInsidePolygonOrOnItsBoundary() throws Exception {
		Path boundary = writeBoundary("""
				{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{
				  "type":"Polygon","coordinates":[[[-46.5,-24],[-46,-24],[-46,-23.8],[-46.5,-23.8],[-46.5,-24]]]
				},"properties":{}}]}
				""");
		SantosServiceArea area = new SantosServiceArea(new ObjectMapper(), boundary.toString());

		area.validate(new LocationSnapshot(-23.96, -46.33));
		area.validate(new LocationSnapshot(-24, -46.33));
	}

	@Test
	void excludesPointsInsidePolygonHoles() throws Exception {
		Path boundary = writeBoundary("""
				{"type":"Polygon","coordinates":[
				  [[0,0],[10,0],[10,10],[0,10],[0,0]],
				  [[3,3],[7,3],[7,7],[3,7],[3,3]]
				]}
				""");
		SantosServiceArea area = new SantosServiceArea(new ObjectMapper(), boundary.toString());

		ApiException exception = assertThrows(
				ApiException.class,
				() -> area.validate(new LocationSnapshot(5, 5)));

		assertEquals(HttpStatus.BAD_REQUEST, exception.status());
		assertEquals("localizacao", exception.fieldErrors().keySet().iterator().next());
	}

	@Test
	void supportsMultiPolygonGeoJson() throws Exception {
		Path boundary = writeBoundary("""
				{"type":"MultiPolygon","coordinates":[
				  [[[0,0],[1,0],[1,1],[0,1],[0,0]]],
				  [[[10,10],[11,10],[11,11],[10,11],[10,10]]]
				]}
				""");
		SantosServiceArea area = new SantosServiceArea(new ObjectMapper(), boundary.toString());

		area.validate(new LocationSnapshot(10.5, 10.5));
	}

	@Test
	void reportsUnavailableWhenOfficialBoundaryIsNotConfigured() {
		SantosServiceArea area = new SantosServiceArea(new ObjectMapper(), "");

		assertThrows(
				ServiceAreaUnavailableException.class,
				() -> area.validate(new LocationSnapshot(-23.96, -46.33)));
	}

	private Path writeBoundary(String geoJson) throws Exception {
		Path boundary = temporaryDirectory.resolve("santos-boundary.geojson");
		Files.writeString(boundary, geoJson);
		return boundary;
	}
}
