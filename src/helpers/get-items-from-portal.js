const axios = require('axios');
const { serializeQueryParams } = require('./portal-query-builder');
const ArcgisSearchProviderError = require('../arcgis-search-provider-error');

async function getPortalItems(portalItemsRequestOptions, logOptions) {
    const { portalUrl, portalQuery, maxPageSize } = portalItemsRequestOptions;
    const firstPage = await fetchItemsFromPortal(portalUrl, portalQuery, logOptions);
    const totalBatch = getTotalBatch(firstPage.total, maxPageSize);
    if (totalBatch === 1) {
        return {
            items: firstPage.results,
            count: firstPage.total
        };
    }
    const remainingRequests = buildRemainingPageRequests({ portalUrl, portalQuery, totalBatch, maxPageSize }, logOptions);
    const remainingItems = await getRemainingPortalItems(remainingRequests);
    return {
        items: [...firstPage.results, ...remainingItems],
        count: firstPage.total
    };
};

async function fetchItemsFromPortal(portalUrl, portalQuery, logOptions) {
    const { log, logLevel } = logOptions;
    const url = `${portalUrl}?${serializeQueryParams(portalQuery)}`;
    if (logLevel) {
        log[logLevel](`Request made to ${url}`);
    }
    const items = await axios.get(url);
    return items.data;
}

function getTotalBatch(total, maxPageSize) {
    return Math.ceil(total / maxPageSize);
}

function buildRemainingPageRequests(requestOptions, logOptions) {
    const { portalUrl, portalQuery, totalBatch, maxPageSize } = requestOptions;
    const { log, logLevel } = logOptions;
    const requests = [];
    // Multiple batches each with maxPageSize number of records
    for (let i = 1; i < totalBatch; i++) {
        portalQuery.start += maxPageSize;
        const url = `${portalUrl}?${serializeQueryParams(portalQuery)}`;
        requests.push(createPortalGetRequest(url, log, logLevel));
    }
    return requests;
}

async function createPortalGetRequest(url, log, logLevel) {
    if (logLevel) {
        log[logLevel](`Request made to ${url}`);
    }
    return axios.get(url);
}

async function getRemainingPortalItems(requests) {
    const pages = await Promise.all(requests);
    const items = pages.reduce((collection, page) => {
        return collection.concat(page.data.results);
    }, []);
    return items;
}

function setUserAgentForPortalRequest(userAgent) {
    axios.defaults.headers.common['User-Agent'] = userAgent;
    return userAgent;
}

function shouldFetchItemsFromPortal(request) {
    const { path, query } = request;
    if (isFeatureServiceMetaData(path, query)) {
        return false;
    }

    if (!isFeatureServiceMetaData(path) && !isValidRequestQuery(query)) {
        throw new ArcgisSearchProviderError('Invalid query', 400);
    }

    if (!isFeatureServiceMetaData(path) && isValidRequestQuery(query)) {
        return true;
    }
}

function isFeatureServiceMetaData(requestPath) {
    return new RegExp(/featureserver[./]*[0-9./]*$/, 'i').test(requestPath);;
}

function isValidRequestQuery(requestUrlQuery) {
    return requestUrlQuery.where || requestUrlQuery.geometry;
}

module.exports = { getPortalItems, setUserAgentForPortalRequest, shouldFetchItemsFromPortal }; 