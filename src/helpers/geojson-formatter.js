const { arcgisToGeoJSON } = require("@terraformer/arcgis");

function formatGeoJsonFeature(input) {
  if (input.extent.length === 0) {
    input.extent = [[0, 0], [1, 1]];
  }
  const [[xmin, ymin], [xmax, ymax]] = input.extent;
  const feature = {
    type: 'Feature',
    properties: input,
    geometry: arcgisToGeoJSON({
      xmin,
      ymin,
      xmax,
      ymax,
      spatialReference: {
        wkid: 4326
      }
    })
  };
  return feature;
}

function translateGeojson(input) {
  const features = {
    type: 'FeatureCollection',
    features: input.items.map(formatGeoJsonFeature),
    count: input.count
  };
  return features;
}

function getGeoJson(items, fieldsDefination) {
  const geojson = translateGeojson(items);
  // Cache data for 10 seconds at a time by setting the ttl or 'Time to Live'
  // geojson.ttl = 10
  geojson.filtersApplied = { where: true };

  geojson.metadata = {
    name: 'ArcGIS Search', // Get the workbook name before ! symbol and set as layer name
    description: 'Search content in ArcGIS Online',
    displayField: 'title',
    fields: fieldsDefination,
    geometryType: 'Polygon',
    idField: 'itemIdHash'
  };
  return geojson;
}

module.exports = { formatGeoJsonFeature, getGeoJson };