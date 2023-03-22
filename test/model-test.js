/*
  model-test.js

  This file is optional, but is strongly recommended. It tests the `getData` function to ensure its translating
  correctly.
*/

const test = require('tape');
const Model = require('../model');
const model = new Model();
const nock = require('nock');

test('should properly fetch from the API and translate features', t => {
  nock('https://www.arcgis.com')
    .get('/sharing/rest/search?f=json&q=group:47dd57c9a59d458c86d3d6b978560088&num=10&start=1')
    .reply(200, require('./fixtures/livingatlas.json'));

  model.getData({ query: { where: 'group:47dd57c9a59d458c86d3d6b978560088', resultRecordCount: 10 } }, (err, geojson) => {
    t.error(err);
    t.equal(geojson.type, 'FeatureCollection', 'creates a feature collection object');
    t.ok(geojson.features, 'has features');
    const feature = geojson.features[0];
    t.equal(feature.type, 'Feature', 'has proper type');
    t.equal(feature.geometry.type, 'Polygon', 'creates polygon geometry');
    t.deepEqual(feature.geometry.coordinates, [ [ [ -179.99999, -85 ], [ 179.99999, -85 ], [ 179.99999, 85 ], [ -179.99999, 85 ], [ -179.99999, -85 ] ] ], 'translates geometry correctly');
    t.ok(feature.properties, 'creates attributes');
    t.equal(feature.properties.created, new Date(1260644517000).toISOString(), 'translates created field correctly');
    t.equal(feature.properties.modified, new Date(1562082376000).toISOString(), 'translates modified field correctly');
    t.end();
  });
});
