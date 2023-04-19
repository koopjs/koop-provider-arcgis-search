const axios = require('axios');
const { serializeQueryParams } = require('./portal-query-builder');

async function getPortalItems(portalItemsRequestOptions, logger) {
    const { portalUrl, portalQuery, MAX_PAGE_SIZE } = portalItemsRequestOptions;
    const firstPage = await fetchItemsFromPortal(portalUrl, portalQuery, logger);
    const totalBatch = getTotalBatch(firstPage.total, MAX_PAGE_SIZE);
    if (totalBatch === 1) {
        return {
            items: firstPage.results,
            count: firstPage.total
        };
    }
    const remainingRequests = buildRemainingPageRequests({ portalUrl, portalQuery, totalBatch, MAX_PAGE_SIZE });
    const remainingItems = await getRemainingPortalItems(remainingRequests, logger);
    return {
        items: [...firstPage.results, ...remainingItems],
        count: firstPage.total
    };
};

async function fetchItemsFromPortal(portalUrl, portalQuery, logger) {
    const { log, logLevel } = logger;
    const url = `${portalUrl}?${serializeQueryParams(portalQuery)}`;
    const items = await axios.get(url);
    if (logLevel) {
        log[logLevel](`Request made to ${url}`);
    }
    return items.data;
}

function getTotalBatch(total, maxPageSize) {
    return Math.ceil(total / maxPageSize);
}

function buildRemainingPageRequests(requestOptions) {
    const { portalUrl, portalQuery, totalBatch, MAX_PAGE_SIZE } = requestOptions;
    const requests = [];
    // Multiple batches each with maxPageSize number of records
    for (let i = 1; i < totalBatch; i++) {
        portalQuery.start += MAX_PAGE_SIZE;
        requests.push(axios.get(`${portalUrl}?${serializeQueryParams(portalQuery)}`));
    }
    return requests;
}

async function getRemainingPortalItems(requests, logger) {
    const { log, logLevel } = logger;
    const pages = await Promise.all(requests);
    const items = pages.reduce((collection, page) => {
        if (logLevel) {
            log[logLevel](`Request made to https://${page.request.host}${page.request.path}`);
        }
        return collection.concat(page.data.results);
    }, []);
    return items;
}

function setUserAgentForPortalRequest(userAgent) {
    axios.defaults.headers.common['User-Agent'] = userAgent;
    return userAgent;
}
module.exports = { getPortalItems, setUserAgentForPortalRequest }; 