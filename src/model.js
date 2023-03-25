/*
  model.js
  This file is required. It must export a class with at least one public function called `getData`
*/
const ArcgisSearchProviderError = require('./arcgis-search-provider-error');
const { buildPortalQuery } = require('./helpers/portal-query-builder');
const { getGeoJson } = require('./helpers/geojson-formatter');
const { getPortalItems } = require('./helpers/get-items-from-portal');
const { validateRequestQuery } = require('./helpers/validate-request-query');

const MAX_PAGE_SIZE = 100; // maximum number of results returned from portal per request
const FIELDS_DEFINITION = require('./fields-definition');
const PORTAL_URL = 'http://www.arcgis.com/sharing/rest/search';

class ArcgisSearchModel {
  constructor(koop = {}) {
    this.log = koop.log;
  }
  // Main getData method which is used to send data to Koop 
  async getData(req, callback) {
    try {
      validateRequestQuery(req.query);
      const portalQuery = buildPortalQuery(req.query, this.log);
      const items = await getPortalItems(PORTAL_URL, portalQuery, MAX_PAGE_SIZE);
      const geojson = getGeoJson(items, FIELDS_DEFINITION);
      callback(null, geojson);
    } catch (error) {
      callback(
        new ArcgisSearchProviderError(
          error?.response?.data || error.message || 'Error in Arcgis Search Provider',
          error?.response?.status || 500,
          error.stack
        )
      );
    }
  }
}

module.exports = ArcgisSearchModel;