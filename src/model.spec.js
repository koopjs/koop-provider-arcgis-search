/* eslint-disable no-unused-vars */
const nock = require('nock');
const ArcgisSearchModel = require('../src/model');
const withinLimitResponseFixture = require('../test/fixtures/within-limit-portal-response.json');
const exceeedLimitResponseFixture = require('../test/fixtures/exceed-limit-portal-response.json');
const withinLimitGeojsonFixture = require('../test/fixtures/within-limit-portal-geojson.json');
const exceeedLimitGeojsonFixture = require('../test/fixtures/exceed-limit-portal-geojson.json');
const { serializeQueryParams } = require('../src/helpers/portal-query-builder');
const ArcgisSearchProviderError = require('../src/arcgis-search-provider-error');
const FIELDS_DEFINITION = require('../src/fields-definition');
const axios = require('axios');

describe('ArcgisSearchModel', () => {
  beforeEach(() => {
    jest.resetModules();
  });



  it('should log with portal url when request to arcgis portal is made and logLevel is specified', async () => {
    const req = {
      query: {
        f: "json",
        where: "typekeywords = 'hubSite'",
        returnGeometry: true,
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: 39135,
        geometry: {
          xmin: -13135699.913606282,
          ymin: 3763310.6271446524,
          xmax: -12913060.932019735,
          ymax: 4028802.0261344067,
          spatialReference: {
            wkid: 102100,
          },
        },
        geometryType: "esriGeometryEnvelope",
        inSR: 102100,
        outFields: "*",
        outSR: 102100,
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 1,
      bbox: "-118.00000000000001,31.999999999999982,-116.00000000000001,33.999999999999986",
    };

    const secondPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 101,
      bbox: "-118.00000000000001,31.999999999999982,-116.00000000000001,33.999999999999986",
    };

    nock('https://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, exceeedLimitResponseFixture);

    nock('https://www.arcgis.com', {
      authorization: 'Basic Auth'})
      .get(`/sharing/rest/search?${serializeQueryParams(secondPagePortalQuery)}`)
      .reply(200, withinLimitResponseFixture);

    const koopLogger = {
      info(msg) {
        return true;
      },
    };

    const model = new ArcgisSearchModel({ log: koopLogger }, { logLevel: 'info' });
    const loggerSpy = jest.spyOn(model.log, 'info');
    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();

      expect(Array.isArray(geojson.features)).toBe(true);
      expect(geojson.features.length).toBe(146);

      expect(geojson.metadata).toBeDefined();
      expect(geojson.metadata).toStrictEqual({
        name: 'ArcGIS Search',
        description: 'Search content in ArcGIS Online',
        displayField: 'title',
        fields: FIELDS_DEFINITION,
        geometryType: 'Polygon',
        idField: 'itemIdHash'
      });

      expect(geojson.type).toBe('FeatureCollection');
      expect(geojson.features).toStrictEqual(exceeedLimitGeojsonFixture);

    });
    expect(loggerSpy).toHaveBeenCalledTimes(2);
    expect(loggerSpy).toHaveBeenNthCalledWith(1, `Request made to https://www.arcgis.com/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`);
  });
});