const { arcgisToGeoJSON } = require("@terraformer/arcgis");
const farmhash = require('farmhash');

function formatGeoJsonFeature(input) {
  const feature = {
    type: 'Feature',
    properties: input
  };

  if (input.extent.length === 0) {
    feature.geometry = null;
  } else {
    const [[xmin, ymin], [xmax, ymax]] = input.extent;
    feature.geometry = arcgisToGeoJSON({
      xmin,
      ymin,
      xmax,
      ymax,
      spatialReference: {
        wkid: 4326
      }
    });
  }

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
  return {
    type: 'FeatureCollection',
    features: input.items.map(formatGeoJsonFeature),
  };
}

function getGeoJson(items, fieldsDefination) {
  const geojson = translateGeojson(items);
  geojson.metadata = {
    name: 'ArcGIS Search',
    description: 'Search content in ArcGIS Online',
    displayField: 'title',
    fields: fieldsDefination,
    geometryType: 'Polygon',
    idField: 'itemIdHash'
  };
  return geojson;
}

module.exports = { getGeoJson };