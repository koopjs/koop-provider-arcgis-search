/*
  model.js
  This file is required. It must export a class with at least one public function called `getData`
*/
const request = require('request-promise').defaults({ gzip: true, json: true });
const { translate, serializeQueryParams, normalizeCoordinates } = require('./utils');
const ArcgisSearchProviderError = require('./ArcgisSearchProviderError');
const MAX_PAGE_SIZE = 100;
const FIELD_DICTIONARY = require('./field-dictionary');
const PORTAL_URL = 'http://www.arcgis.com/sharing/rest/search';

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
        error?.message || 'Error in Arcgis Search Provider', 
        error?.status || error?.statusCode || 500
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
      this.addSortOptionsToPortalQuery(portalQuery, requestQuery);
    }

    if (requestQuery.geometry && requestQuery.geometryType === 'esriGeometryEnvelope') {
      this.addBboxToPortalQuery(portalQuery, requestQuery);
    }

    return portalQuery;
  }

  addSortOptionsToPortalQuery(portalQuery, requestQuery) {
    const { orderBy } = requestQuery;
    const orderByArr = orderBy.split(' ');
    portalQuery.sortField = orderByArr[0] || 'title';
    portalQuery.sortOrder = orderByArr[1] || 'DESC';
    return portalQuery;
  }

  addBboxToPortalQuery(portalQuery, requestQuery) {
    const { geometry: { xmin, ymin, xmax, ymax } } = requestQuery;
    portalQuery.bbox = [
      ...normalizeCoordinates([xmin, ymin]),
      ...normalizeCoordinates([xmax, ymax])
    ].join(',');
    return portalQuery;
  }

  async getPortalItems(portal, query, maxPageSize) {
    const firstPage = await this.fetchItemsFromPortal(portal, query);
    const totalBatch = this.getTotalBatch(firstPage.total, maxPageSize);
    let totalItems = [...firstPage.results];

    if (totalBatch > 1) {
      const remainingRequests = this.buildRemainingPageRequests({ portal, query, totalBatch, maxPageSize });
      const remainingItems = await this.getRemainingPortalItems(remainingRequests);
      totalItems = [...totalItems, ...remainingItems];
    }
    return totalItems;
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

  buildRemainingPageRequests({ portal, query, totalBatch, maxPageSize }) {
    const requests = [];
    // Multiple batches each with maxPageSize number of records
    for (let i = 1; i < totalBatch; i++) {
      query.start += maxPageSize;
      requests.push(request(`${portal}?${serializeQueryParams(query)}`));
    }
    return requests;
  }

  async fetchItemsFromPortal(portal, query) {
    const url = `${portal}?${serializeQueryParams(query)}`;
    const items = await request(url);
    return items;
  }

  getGeoJson(items, fieldDictionary) {
    const geojson = translate(items);
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