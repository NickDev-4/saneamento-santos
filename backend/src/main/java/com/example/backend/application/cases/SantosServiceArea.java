package com.example.backend.application.cases;

import com.example.backend.api.exception.ApiException;
import com.example.backend.infrastructure.persistence.cases.CaseDocument.LocationSnapshot;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class SantosServiceArea {

	private final ObjectMapper objectMapper;
	private final String boundaryFile;

	public SantosServiceArea(
			ObjectMapper objectMapper,
			@Value("${santos.service-area.geojson:}") String boundaryFile) {
		this.objectMapper = objectMapper;
		this.boundaryFile = boundaryFile;
	}

	public void validate(LocationSnapshot location) {
		List<Geometry> polygons = loadPolygons();
		Geometry point = new GeometryFactory().createPoint(
				new Coordinate(location.longitude(), location.latitude()));
		if (polygons.stream().noneMatch(polygon -> polygon.covers(point))) {
			throw new ApiException(
					HttpStatus.BAD_REQUEST,
					"VALIDATION_ERROR",
					"Revise os campos indicados.",
					Map.of("localizacao", "O ponto informado está fora da área de atendimento."));
		}
	}

	private List<Geometry> loadPolygons() {
		if (boundaryFile == null || boundaryFile.isBlank()) {
			throw new ServiceAreaUnavailableException();
		}
		try {
			Path path = Path.of(boundaryFile).toAbsolutePath().normalize();
			if (!Files.isRegularFile(path)) {
				throw new ServiceAreaUnavailableException();
			}
			JsonNode root = objectMapper.readTree(path.toFile());
			List<Geometry> polygons = new ArrayList<>();
			collectPolygons(root, polygons);
			if (polygons.isEmpty()) {
				throw new ServiceAreaUnavailableException();
			}
			return polygons;
		} catch (JacksonException | IllegalArgumentException | ParseException exception) {
			throw new ServiceAreaUnavailableException(exception);
		}
	}

	private void collectPolygons(JsonNode node, List<Geometry> polygons) throws ParseException {
		if (node == null || !node.isObject()) {
			throw new ServiceAreaUnavailableException();
		}
		String type = node.path("type").asString("");
		switch (type) {
			case "FeatureCollection" -> {
				JsonNode features = node.path("features");
				if (!features.isArray()) {
					throw new ServiceAreaUnavailableException();
				}
				for (JsonNode feature : features) {
					collectPolygons(feature, polygons);
				}
			}
			case "Feature" -> collectPolygons(node.get("geometry"), polygons);
			case "GeometryCollection" -> {
				JsonNode geometries = node.path("geometries");
				if (!geometries.isArray()) {
					throw new ServiceAreaUnavailableException();
				}
				for (JsonNode geometry : geometries) {
					collectPolygons(geometry, polygons);
				}
			}
			case "Polygon", "MultiPolygon" -> {
				Geometry geometry = new GeoJsonReader().read(node.toString());
				if (geometry.isEmpty() || geometry.getDimension() != 2 || !geometry.isValid()) {
					throw new ServiceAreaUnavailableException();
				}
				for (Coordinate coordinate : geometry.getCoordinates()) {
					if (!Double.isFinite(coordinate.x) || !Double.isFinite(coordinate.y)
							|| coordinate.x < -180 || coordinate.x > 180
							|| coordinate.y < -90 || coordinate.y > 90) {
						throw new ServiceAreaUnavailableException();
					}
				}
				polygons.add(geometry);
			}
			default -> throw new ServiceAreaUnavailableException();
		}
	}
}
