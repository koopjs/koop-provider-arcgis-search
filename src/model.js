/*
  model.js
  This file is required. It must export a class with at least one public function called `getData`
*/
const ArcgisSearchProviderError = require('./arcgis-search-provider-error');
const { buildPortalQuery } = require('./helpers/portal-query-builder');
const { getGeoJson } = require('./helpers/geojson-formatter');
const { getPortalItems, setUserAgentForPortalRequest, shouldFetchItemsFromPortal } = require('./helpers/get-items-from-portal');
const { validateRequestQuery } = require('./helpers/validate-request-query');

const MAX_PAGE_SIZE = 100; // maximum number of results returned from portal per request
const FIELDS_DEFINITION = require('./fields-definition');
const PORTAL_ENDPOINTS = {
  prod: 'https://www.arcgis.com/sharing/rest/search',
  qa: 'https://qaext.arcgis.com/sharing/rest/search',
  dev: 'https://devext.arcgis.com/sharing/rest/search'
};

class ArcgisSearchModel {
  constructor(koop, options = {}) {
    this.log = koop.log;
    this.ttl = options.ttl || 0;
    this.logLevel = options.logLevel;
    this.portalUrl = PORTAL_ENDPOINTS[options.portalEnv] || PORTAL_ENDPOINTS['prod'];
    this.userAgent = options.userAgent && setUserAgentForPortalRequest(options.userAgent);
  }
  // Main getData method which is used to send data to Koop 
  async getData(req, callback) {
    try {
      let portalItems = { items: [] };
      if (shouldFetchItemsFromPortal(req)) {
        portalItems = await this.getItemsFromPortal(
          this.portalUrl,
          req.query,
          {
            log: this.log,
            logLevel: this.logLevel
          }
        );
      }
      const geojson = getGeoJson(portalItems, FIELDS_DEFINITION);

      geojson.ttl = this.ttl;
      geojson.filtersApplied = { where: true };
      geojson.geometry = true;

      callback(null, geojson);
    } catch (error) {
      callback(
        new ArcgisSearchProviderError(
          error?.response?.data || error.message || 'Error in Arcgis Search Provider',
          error?.response?.status || error.statusCode || 500,
          error.stack
        )
      );
    }
  }

  async getItemsFromPortal(portalUrl, requestQuery, logOptions) {
    validateRequestQuery(requestQuery);
    const portalQuery = buildPortalQuery(requestQuery, logOptions.log);
    const portalItems = await getPortalItems({
        portalUrl,
        portalQuery, 
        maxPageSize: MAX_PAGE_SIZE
      },
      logOptions
    );
    return portalItems;
  }
}

module.exports = ArcgisSearchModel;