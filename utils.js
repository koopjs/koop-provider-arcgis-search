const request = require('request-promise').defaults({ gzip: true, json: true });
const farmhash = require('farmhash');
const proj4 = require("proj4");

// Development Function - outputs string matches in the Item/data
function inspectData (id, match) {
  const dataUrl = `http://www.arcgis.com/sharing/rest/content/items/${id}/data?f=json`;
  console.log('dataUrl', dataUrl);
  request(dataUrl).then((data) => {
    // console.log("Data", data)
    const layout = JSON.stringify(data.values.layout);
    // console.log("layout", layout)

    let matchLayout = null;
    if (layout !== undefined && layout !== null) {
      matchLayout = layout.match(match);
    } else {
      console.log(`Layout null for ${dataUrl}`);
    }
    if (matchLayout !== undefined && matchLayout !== null) {
      console.log(`Match for [${match}] from ${id}`, matchLayout);
    }
  });
}

function serializeQueryParams(params) {
  return Object.keys(params).map(param => {
    let val = params[param];
    if (typeof val !== 'string') val = JSON.stringify(val);
    return `${encodeURIComponent(param)}=${encodeURIComponent(val)}`;
  }).join('&');
}

function translate(input) {
  const features = {
    type: 'FeatureCollection',
    features: input.map(formatFeature),
    count: input.total
  };
  return features;
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

function normalizeCoordinates(coordinates) {
  return proj4('EPSG:3857', 'EPSG:4326', coordinates);
}

module.exports = { inspectData, translate, serializeQueryParams, normalizeCoordinates };
