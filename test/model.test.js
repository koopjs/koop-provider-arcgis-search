
const nock = require('nock');
const ArcgisSearchModel = require('../src/model');
const limitResponse = require('./fixtures/within-limit-response.json');
const exceeedLimitResponse = require('./fixtures/exceed-limit-response.json');
const { serializeQueryParams } = require('../src/helpers/utils');
const ArcgisSearchProviderError = require('../src/helpers/arcgis-search-provider-error');

describe('ArcgisSearchModel', () => {
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
      .reply(200, exceeedLimitResponse);

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(secondPagePortalQuery)}`)
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');
    const buildRemainingPageRequestsSpy = jest.spyOn(model, 'buildRemainingPageRequests');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(Array.isArray(geojson.features)).toBe(true);
      expect(geojson.features.length).toBe(146);
      expect(geojson.metadata).toBeDefined();
      expect(geojson.type).toBe('FeatureCollection');
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(getPortalItemsSpy).toBeCalledTimes(1);
      expect(buildRemainingPageRequestsSpy).toHaveBeenCalledWith({
        portalUrl: 'http://www.arcgis.com/sharing/rest/search',
        query: secondPagePortalQuery,
        totalBatch: 2,
        maxPageSize: 100
      });
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
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');
    const buildRemainingPageRequestsSpy = jest.spyOn(model, 'buildRemainingPageRequests');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(geojson.count).toBe(46);
      expect(geojson.metadata).toBeDefined();
      expect(geojson.type).toBe('FeatureCollection');
      expect(Array.isArray(geojson.features)).toBe(true);
      expect(geojson.features.length).toBe(46);
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(buildRemainingPageRequestsSpy).not.toBeCalled();
      expect(getPortalItemsSpy).toHaveBeenCalledWith('http://www.arcgis.com/sharing/rest/search', firstPagePortalQuery, 100);
    });
  });

  it('should throw error if request to argis portal fails', async () => {
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

    const model = new ArcgisSearchModel();

    try {
      await model.getData(req, () => { });
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeInstanceOf(ArcgisSearchProviderError);
      expect(err.message).toBe('400 - "portal error"');
      expect(err.statusCode).toBe(400);
    }
  });

  it('should throw default error if request to argis portal fails', async () => {
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

    const model = new ArcgisSearchModel();

    jest
      .spyOn(model, 'buildPortalQuery')
      .mockImplementation(() => {throw new Error();});

    try {
      await model.getData(req, () => { });
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeInstanceOf(ArcgisSearchProviderError);
      expect(err.message).toBe('Error in Arcgis Search Provider');
      expect(err.statusCode).toBe(500);
    }
  });

  it('should not create bbox portal query if wkid is not supported by proj4', async () => {
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
            wkid: 7815,
          },
        },
        geometryType: "esriGeometryEnvelope",
        inSR: 7815,
        outFields: "*",
        outSR: 7815
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 1
    };

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();

    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(getPortalItemsSpy).toHaveBeenCalledWith(
        'http://www.arcgis.com/sharing/rest/search',
        firstPagePortalQuery,
        100
      );
    });
  });

  it('should get input spatial reference from inSR query if geometry object does not contain spatial reference', async () => {
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
          ymax: 40075016.68557295
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
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');
    const buildRemainingPageRequestsSpy = jest.spyOn(model, 'buildRemainingPageRequests');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(geojson.count).toBe(46);
      expect(geojson.metadata).toBeDefined();
      expect(geojson.type).toBe('FeatureCollection');
      expect(Array.isArray(geojson.features)).toBe(true);
      expect(geojson.features.length).toBe(46);
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(buildRemainingPageRequestsSpy).not.toBeCalled();
      expect(getPortalItemsSpy).toHaveBeenCalledWith('http://www.arcgis.com/sharing/rest/search', firstPagePortalQuery, 100);
    });
  });

  it('should default to WGS84 if no spatial reference is provided', async () => {
    const req = {
      query: {
        f: "json",
        where: "typekeywords = 'hubSite'",
        returnGeometry: true,
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: 39135,
        geometry: {
          xmin: -179.99999999999696,
          ymin: 85.05112877980633,
          xmax: -4.363816717609226e-11,
          ymax: 89.78600707473662
        },
        geometryType: "esriGeometryEnvelope",
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
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');
    const buildRemainingPageRequestsSpy = jest.spyOn(model, 'buildRemainingPageRequests');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(geojson.count).toBe(46);
      expect(geojson.metadata).toBeDefined();
      expect(geojson.type).toBe('FeatureCollection');
      expect(Array.isArray(geojson.features)).toBe(true);
      expect(geojson.features.length).toBe(46);
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(buildRemainingPageRequestsSpy).not.toBeCalled();
      expect(getPortalItemsSpy).toHaveBeenCalledWith('http://www.arcgis.com/sharing/rest/search', firstPagePortalQuery, 100);
    });
  });

  it('should accept geometry query in comma seperated string', async () => {
    const req = {
      query: {
        f: "json",
        where: "typekeywords = 'hubSite'",
        returnGeometry: true,
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: 39135,
        geometry: '-20037508.342788905,20037508.342788905,-0.000004857778549194336,40075016.68557295',
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
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');
    const buildRemainingPageRequestsSpy = jest.spyOn(model, 'buildRemainingPageRequests');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(geojson.count).toBe(46);
      expect(geojson.metadata).toBeDefined();
      expect(geojson.type).toBe('FeatureCollection');
      expect(Array.isArray(geojson.features)).toBe(true);
      expect(geojson.features.length).toBe(46);
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(buildRemainingPageRequestsSpy).not.toBeCalled();
      expect(getPortalItemsSpy).toHaveBeenCalledWith('http://www.arcgis.com/sharing/rest/search', firstPagePortalQuery, 100);
    });
  });

  it('should not create bbox portal query if geometry is other than esriGeometryEnvelope', async () => {
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
        geometryType: "esriGeometryPolygon",
        inSR: 102100,
        outFields: "*",
        outSR: 102100
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 1
    };

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');
    const buildRemainingPageRequestsSpy = jest.spyOn(model, 'buildRemainingPageRequests');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(buildRemainingPageRequestsSpy).not.toBeCalled();
      expect(getPortalItemsSpy).toHaveBeenCalledWith('http://www.arcgis.com/sharing/rest/search', firstPagePortalQuery, 100);
    });
  });

  it('should not create bbox portal query if no geometry is provided', async () => {
    const req = {
      query: {
        f: "json",
        where: "typekeywords = 'hubSite'",
        returnGeometry: true,
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: 39135,
        inSR: 102100,
        outFields: "*",
        outSR: 102100
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 1
    };

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');
    const buildRemainingPageRequestsSpy = jest.spyOn(model, 'buildRemainingPageRequests');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(buildRemainingPageRequestsSpy).not.toBeCalled();
      expect(getPortalItemsSpy).toHaveBeenCalledWith('http://www.arcgis.com/sharing/rest/search', firstPagePortalQuery, 100);
    });
  });

  it('should not create bbox portal query if geometry is not valid', async () => {
    const req = {
      query: {
        f: "json",
        where: "typekeywords = 'hubSite'",
        returnGeometry: true,
        geometry: 'a:1,b:2,c:3,d:e',
        geometryType: "esriGeometryEnvelope",
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: 39135,
        inSR: 102100,
        outFields: "*",
        outSR: 102100
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 1
    };

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');
    const buildRemainingPageRequestsSpy = jest.spyOn(model, 'buildRemainingPageRequests');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(buildRemainingPageRequestsSpy).not.toBeCalled();
      expect(getPortalItemsSpy).toHaveBeenCalledWith('http://www.arcgis.com/sharing/rest/search', firstPagePortalQuery, 100);
    });
  });

  it('should add sortfield portal query if orderByFields is provided', async () => {
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
        outSR: 102100,
        orderByFields: {
          orderBy: 'created ASC'
        }
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 1,
      bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
      sortField: "created",
      sortOrder: "ASC"
    };

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(getPortalItemsSpy).toHaveBeenCalledWith('http://www.arcgis.com/sharing/rest/search', firstPagePortalQuery, 100);
    });
  });

  it('should add default sortfield portal query if orderByFields is provided', async () => {
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
        outSR: 102100,
        orderByFields: {
          orderBy: ' '
        }
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "typekeywords:\"hubSite\"",
      num: 100,
      start: 1,
      bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
      sortField: "title",
      sortOrder: "DESC"
    };

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(getPortalItemsSpy).toHaveBeenCalledWith('http://www.arcgis.com/sharing/rest/search', firstPagePortalQuery, 100);
    });
  });

  it('should covert geometry into bbox portal query if wkid supported by proj4', async () => {
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
            wkid: 3785,
          },
        },
        geometryType: "esriGeometryEnvelope",
        inSR: 3785,
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
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');
    const buildRemainingPageRequestsSpy = jest.spyOn(model, 'buildRemainingPageRequests');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(buildRemainingPageRequestsSpy).not.toBeCalled();
      expect(getPortalItemsSpy).toHaveBeenCalledWith('http://www.arcgis.com/sharing/rest/search', firstPagePortalQuery, 100);
    });
  });

  it('should set portal query q to everything (*) if where is not provided', async () => {
    const req = {
      query: {
        f: "json",
        returnGeometry: true,
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: 39135,
        geometry: {
          xmin: -20037508.342788905,
          ymin: 20037508.342788905,
          xmax: -0.000004857778549194336,
          ymax: 40075016.68557295,
          spatialReference: {
            wkid: 3785,
          },
        },
        geometryType: "esriGeometryEnvelope",
        inSR: 3785,
        outFields: "*",
        outSR: 102100
      }
    };

    const firstPagePortalQuery = {
      f: "json",
      q: "*",
      num: 100,
      start: 1,
      bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
    };

    nock('http://www.arcgis.com')
      .get(`/sharing/rest/search?${serializeQueryParams(firstPagePortalQuery)}`)
      .reply(200, limitResponse);

    const model = new ArcgisSearchModel();
    const builPortalQuerySpy = jest.spyOn(model, 'buildPortalQuery');
    const getPortalItemsSpy = jest.spyOn(model, 'getPortalItems');
    const buildRemainingPageRequestsSpy = jest.spyOn(model, 'buildRemainingPageRequests');

    await model.getData(req, (err, geojson) => {
      expect(geojson).toBeDefined();
      expect(builPortalQuerySpy).toHaveBeenCalledWith(req.query);
      expect(buildRemainingPageRequestsSpy).not.toBeCalled();
      expect(getPortalItemsSpy).toHaveBeenCalledWith('http://www.arcgis.com/sharing/rest/search', firstPagePortalQuery, 100);
    });
  });
});