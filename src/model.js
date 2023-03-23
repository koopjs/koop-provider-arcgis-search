/*
  model.js
  This file is required. It must export a class with at least one public function called `getData`
*/
const request = require('request-promise').defaults({ gzip: true, json: true });
const { formatFeature, serializeQueryParams, convertToWGS84 } = require('./helpers/utils');
const ArcgisSearchProviderError = require('./helpers/arcgis-search-provider-error');
const logger = require('./helpers/logger');
const { objTypeGeometryQuerySchema, arrayTypeGeometryQuerySchema } = require('./helpers/geometry-schema');

const MAX_PAGE_SIZE = 100; // maximum number of results returned from portal per request
const FIELD_DICTIONARY = require('./helpers/field-dictionary');
const PORTAL_URL = 'http://www.arcgis.com/sharing/rest/search';
const PROJ4_WKIDS = [4326, 4269, 3857, 3785, 900913, 102113]; // supported wkids by proj4

class ArcgisSearchModel {
  // Main getData method which is used to send data to Koop 
  async getData(req, callback) {
    try {
      const portalQuery = this.buildPortalQuery(req.query);
      const items = await this.getPortalItems(PORTAL_URL, portalQuery, MAX_PAGE_SIZE);
      const geojson = this.getGeoJson(items, FIELD_DICTIONARY);
      callback(null, geojson);
    } catch (error) {
      throw new ArcgisSearchProviderError(
        error.message || 'Error in Arcgis Search Provider',
        error?.statusCode || 500
      );
    }
  }

  buildPortalQuery(requestQuery) {
    const portalQuery = { f: 'json' };
    // TODO: ensure appropriate quotes for Search in Online
    // Remove any variant of 1=1 as it is not recognized by AGO search; replace = with; replace and ' with "
    portalQuery.q =
      (requestQuery.where || '*')
        .replace(/1=1|(\(1=1\))|(AND\s1=1)|(AND\s\(1=1\))/g, '')
        .replace(/\s+=\s+/g, ':')
        .replace(/'/g, '"')
        .replace(/[ \t]+$/, '');

    portalQuery.num = requestQuery.resultRecordCount || 100;
    portalQuery.start = requestQuery.resultOffset || 1;

    if (requestQuery.orderByFields) {
      this.addSortOptionsToPortalQuery(portalQuery, requestQuery.orderByFields);
    }

    if (this.isSupportedGeometry(requestQuery)) {
      this.addBboxToPortalQuery(portalQuery, requestQuery);
    }

    return portalQuery;
  }

  getSpatialReference(requestQuery) {
    const { geometry: { spatialReference: { wkid } = {} } } = requestQuery;
    const queryWkid = wkid || requestQuery.inSR;

    // assume 4326 if no SR is provided
    if (!queryWkid) {
      return 4326;
    }

    // 102100 is the old Esri code for 3857 but not recognized for proj4
    if (queryWkid === 102100) {
      return 3857;
    }
    // If the input wkid is one of the set known to proj4, return it in an object
    if (PROJ4_WKIDS.includes(queryWkid)) {
      return queryWkid;
    }

    logger.debug(`unsupported wkid ${queryWkid} provided`);
  }

  isSupportedGeometry(requestQuery) {
    return (
      requestQuery.geometry &&
      requestQuery.geometryType === 'esriGeometryEnvelope'
    );
  }

  getExtent(geometry) {
    if (!objTypeGeometryQuerySchema.validate(geometry).error) {
      const { xmin, ymin, xmax, ymax } = geometry;
      return [[xmin, ymin], [xmax, ymax]];
    }

    const extent = geometry.split(',').map(Number);
    if (!arrayTypeGeometryQuerySchema.validate(extent).error) {
      return [extent.splice(0, 2), extent];
    }
  }

  addSortOptionsToPortalQuery(portalQuery, orderByFields) {
    const { orderBy } = orderByFields;
    const orderByArr = orderBy.split(' ');
    portalQuery.sortField = orderByArr[0] || 'title';
    portalQuery.sortOrder = orderByArr[1] || 'DESC';
    return portalQuery;
  }

  addBboxToPortalQuery(portalQuery, requestQuery) {
    const extent = this.getExtent(requestQuery.geometry);
    const inSR = extent && this.getSpatialReference(requestQuery);
    if (extent && inSR) {
      const normalizedExtent = convertToWGS84(extent, inSR);
      portalQuery.bbox = normalizedExtent.join(',');
    }
    return portalQuery;
  }

  async getPortalItems(portalUrl, query, maxPageSize) {
    const firstPage = await this.fetchItemsFromPortal(portalUrl, query);
    const totalBatch = this.getTotalBatch(firstPage.total, maxPageSize);
    if (totalBatch === 1) {
      return {
        items: firstPage.results,
        count: firstPage.total
      };
    }
    const remainingRequests = this.buildRemainingPageRequests({ portalUrl, query, totalBatch, maxPageSize });
    const remainingItems = await this.getRemainingPortalItems(remainingRequests);
    return {
      items: [...firstPage.results, ...remainingItems],
      count: firstPage.total
    };
  }

  async getRemainingPortalItems(requests) {
    const pages = await Promise.all(requests);
    const items = pages.reduce((collection, page) => {
      return collection.concat(page.results);
    }, []);
    return items;
  }

  getTotalBatch(total, maxPageSize) {
    return Math.ceil(total / maxPageSize);
  }

  buildRemainingPageRequests({ portalUrl, query, totalBatch, maxPageSize }) {
    const requests = [];
    // Multiple batches each with maxPageSize number of records
    for (let i = 1; i < totalBatch; i++) {
      query.start += maxPageSize;
      requests.push(request(`${portalUrl}?${serializeQueryParams(query)}`));
    }
    return requests;
  }

  async fetchItemsFromPortal(portalUrl, query) {
    const url = `${portalUrl}?${serializeQueryParams(query)}`;
    const items = await request(url);
    return items;
  }

  translate(input) {
    const features = {
      type: 'FeatureCollection',
      features: input.items.map(formatFeature),
      count: input.count
    };
    return features;
  }

  getGeoJson(items, fieldDictionary) {
    const geojson = this.translate(items);
    // Cache data for 10 seconds at a time by setting the ttl or 'Time to Live'
    // geojson.ttl = 10
    geojson.filtersApplied = { where: true };

    geojson.metadata = {
      name: 'ArcGIS Search', // Get the workbook name before ! symbol and set as layer name
      description: 'Search content in ArcGIS Online',
      displayField: 'title',
      fields: fieldDictionary,
      geometryType: 'Polygon',
      idField: 'itemIdHash'
    };
    return geojson;
  }
}

module.exports = ArcgisSearchModel;