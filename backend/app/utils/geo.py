"""
Utilitas konversi geometri PostGIS ↔ GeoJSON / koordinat biasa.
"""
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping, Point
from geoalchemy2.functions import ST_GeomFromGeoJSON
import json


def geom_to_geojson(geom) -> dict | None:
    """Konversi kolom geometry PostGIS → dict GeoJSON geometry."""
    if geom is None:
        return None
    shape = to_shape(geom)
    return mapping(shape)


def point_to_coords(geom) -> tuple[float, float] | None:
    """Konversi POINT geometry → (longitude, latitude)."""
    if geom is None:
        return None
    shape = to_shape(geom)
    return shape.x, shape.y


def coords_to_wkt_point(longitude: float, latitude: float) -> str:
    """Buat WKT POINT dari koordinat."""
    return f"SRID=4326;POINT({longitude} {latitude})"


def geojson_to_wkt(geojson: dict) -> str:
    """Konversi GeoJSON geometry dict → WKT dengan SRID."""
    from shapely.geometry import shape as shapely_shape
    geom = shapely_shape(geojson)
    return f"SRID=4326;{geom.wkt}"


def build_geojson_feature(geometry_geom, properties: dict) -> dict:
    """Buat satu GeoJSON Feature dari geometry PostGIS + properties dict."""
    return {
        "type": "Feature",
        "geometry": geom_to_geojson(geometry_geom),
        "properties": properties,
    }


def build_feature_collection(features: list[dict]) -> dict:
    """Bungkus list Feature menjadi FeatureCollection."""
    return {
        "type": "FeatureCollection",
        "features": features,
    }
