const { arcgisToGeoJSON } = require("@terraformer/arcgis");
const farmhash = require('farmhash');

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
  feature.properties.itemIdHash = transformId(feature.properties.id);
  return feature;
}

/**
 * Create an ID that is an integer in range of 0 - 2147483647. Should be noted that
 * the scaling of unsigned 32-bit integers to a range of 0 - 2147483647 increases likely hood
 * that two different input receive the same output
 * @param {*} id
 */
function transformId(id) {
  // Hash to 32 bit unsigned integer
  const hash = farmhash.hash32(id.toString());

  // Normalize to range of postive values of signed integer
  return Math.round((hash / 4294967295) * (2147483647));
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