/* eslint-disable no-unused-vars */
const nock = require('nock');
const ArcgisSearchModel = require('../src/model');
const withinLimitResponseFixture = require('./fixtures/within-limit-portal-response.json');
const exceeedLimitResponseFixture = require('./fixtures/exceed-limit-portal-response.json');
const withinLimitGeojsonFixture = require('./fixtures/within-limit-portal-geojson.json');
const exceeedLimitGeojsonFixture = require('./fixtures/exceed-limit-portal-geojson.json');
const { serializeQueryParams } = require('../src/helpers/portal-query-builder');
const ArcgisSearchProviderError = require('../src/arcgis-search-provider-error');
const FIELDS_DEFINITION = require('../src/fields-definition');
const axios = require('axios');

describe('ArcgisSearchModel', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should get batched portal items in geojson format when total item count is greater than 100', async () => {
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

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, exceeedLimitResponseFixture);

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(secondPagePortalQuery)}`)
      .reply(200, withinLimitResponseFixture);

    const model = new ArcgisSearchModel({});

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
  });

  it('should only get first page portal items in geojson format when total item count is less than 100', async () => {
    const req = {
      query: {
        f: "json",
        where: "typekeywords = 'hubSite'",
        returnGeometry: true,
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: 39135,
        geometry: {
          xmin: -20037508.342788905,
          ymin: 20037508.342788905,
          xmax: -0.000004857778549194336,
          ymax: 40075016.68557295,
          spatialReference: {
            wkid: 102100,
          },
        },
        geometryType: "esriGeometryEnvelope",
        inSR: 102100,
        outFields: "*",
        outSR: 102100
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 1,
      bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
    };

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, withinLimitResponseFixture);

    const model = new ArcgisSearchModel({});

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(geojson.features.length).toBe(46);

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
      expect(Array.isArray(geojson.features)).toBe(true);
      expect(geojson.features.length).toBe(46);
      expect(geojson.features).toStrictEqual(withinLimitGeojsonFixture);
    });
  });

  it('should throw error if request to arcgis portal fails', async () => {
    const req = {
      query: {
        f: "json",
        where: "typekeywords = 'hubSite'",
        returnGeometry: true,
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: 39135,
        geometry: {
          xmin: -20037508.342788905,
          ymin: 20037508.342788905,
          xmax: -0.000004857778549194336,
          ymax: 40075016.68557295,
          spatialReference: {
            wkid: 102100,
          },
        },
        geometryType: "esriGeometryEnvelope",
        inSR: 102100,
        outFields: "*",
        outSR: 102100
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 1,
      bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
    };

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(400, 'portal error');

    const model = new ArcgisSearchModel({});

    await model.getData(req, (err, geojson) => {
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('portal error');
      expect(err).toBeInstanceOf(ArcgisSearchProviderError);
    });
  });

  it('should throw default error if request to arcgis portal fails', async () => {
    jest.doMock('../src/helpers/validate-request-query');
    const { validateRequestQuery } = require('../src/helpers/validate-request-query');
    validateRequestQuery.mockImplementation(() => { throw new ArcgisSearchProviderError(); });
    const Model = require('../src/model');
    const req = {
      query: {
        f: "json",
        where: "typekeywords = 'hubSite'",
        returnGeometry: true,
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: 39135,
        geometry: {
          xmin: -20037508.342788905,
          ymin: 20037508.342788905,
          xmax: -0.000004857778549194336,
          ymax: 40075016.68557295,
          spatialReference: {
            wkid: 102100,
          },
        },
        geometryType: "esriGeometryEnvelope",
        inSR: 102100,
        outFields: "*",
        outSR: 102100
      }
    };

    const model = new Model({});
    await model.getData(req, (err, geojson) => {
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Error in Arcgis Search Provider');
    });
  });

  it('should set portal request user agent when user agent is passed in options via constructor', async () => {
    const req = {
      query: {
        f: "json",
        where: "typekeywords = 'hubSite'",
        returnGeometry: true,
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: 39135,
        geometry: {
          xmin: -20037508.342788905,
          ymin: 20037508.342788905,
          xmax: -0.000004857778549194336,
          ymax: 40075016.68557295,
          spatialReference: {
            wkid: 102100,
          },
        },
        geometryType: "esriGeometryEnvelope",
        inSR: 102100,
        outFields: "*",
        outSR: 102100
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 1,
      bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
    };

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, withinLimitResponseFixture);

    // test: we pass userAgent option
    const model = new ArcgisSearchModel({}, { userAgent: 'custom-user-agent' });

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(geojson.features.length).toBe(46);

      expect(geojson.metadata).toBeDefined();
      expect(geojson.metadata).toStrictEqual({
        name: 'ArcGIS Search',
        description: 'Search content in ArcGIS Online',
        displayField: 'title',
        fields: FIELDS_DEFINITION,
        geometryType: 'Polygon',
        idField: 'itemIdHash'
      });
      expect(axios.defaults.headers.common['User-Agent']).toBe('custom-user-agent');
      expect(geojson.type).toBe('FeatureCollection');
      expect(Array.isArray(geojson.features)).toBe(true);
      expect(geojson.features.length).toBe(46);
    });
  });

  it('should set ttl in geojson when ttl is passed in options via constructor', async () => {
    const req = {
      query: {
        f: "json",
        where: "typekeywords = 'hubSite'",
        returnGeometry: true,
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: 39135,
        geometry: {
          xmin: -20037508.342788905,
          ymin: 20037508.342788905,
          xmax: -0.000004857778549194336,
          ymax: 40075016.68557295,
          spatialReference: {
            wkid: 102100,
          },
        },
        geometryType: "esriGeometryEnvelope",
        inSR: 102100,
        outFields: "*",
        outSR: 102100
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 1,
      bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
    };

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, withinLimitResponseFixture);

    // test: we pass ttl option
    const model = new ArcgisSearchModel({}, { ttl: 100 });

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(geojson.features.length).toBe(46);

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
      expect(Array.isArray(geojson.features)).toBe(true);
      expect(geojson.features.length).toBe(46);

      expect(geojson.ttl).toBe(100);
    });
  });
});