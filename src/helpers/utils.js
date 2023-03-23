const farmhash = require('farmhash');
const proj4 = require("proj4");

function serializeQueryParams(params) {
  return Object.keys(params).map(param => {
    let val = params[param];
    if (typeof val !== 'string') val = JSON.stringify(val);
    return `${encodeURIComponent(param)}=${encodeURIComponent(val)}`;
  }).join('&');
}

function formatFeature(input) {
  // inspectData(input.id, 'https://s3.amazonaws.com/geohub-assets/templates/public-engagement/city-skyline.jpg')
  // Most of what we need to do here is extract the longitude and latitude
  const ring = [];
  if (input.extent.length === 0) {
    input.extent = [[0, 0], [1, 1]];
  }
  ring.push([input.extent[0][0], input.extent[0][1]]);
  ring.push([input.extent[1][0], input.extent[0][1]]);
  ring.push([input.extent[1][0], input.extent[1][1]]);
  ring.push([input.extent[0][0], input.extent[1][1]]);
  ring.push([input.extent[0][0], input.extent[0][1]]);

  const feature = {
    type: 'Feature',
    properties: input,
    geometry: {
      type: 'Polygon',
      coordinates: [ring]
    }
  };

  // Create a 32-bit integer for use as the OBJECTID
  feature.properties.itemIdHash = transformId(feature.properties.id);

  // But we also want to translate a few of the date fields so they are easier to use downstream
  const dateFields = ['created', 'modified'];
  dateFields.forEach(field => {
    feature.properties[field] = new Date(feature.properties[field]).toISOString();
  });
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

function convertToWGS84(coordinates, spatialReference) {
  const normalizedCoordinates = spatialReference === 4326 ?
    coordinates :
    coordinates.map((co) => proj4(`EPSG:${spatialReference}`, 'EPSG:4326', co));
  return normalizedCoordinates.splice(0, 2);
}

module.exports = { formatFeature, serializeQueryParams, convertToWGS84 };
