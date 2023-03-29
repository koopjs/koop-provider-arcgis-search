const axios = require('axios');
const { serializeQueryParams } = require('./portal-query-builder');

async function getPortalItems(portalUrl, query, maxPageSize) {
    const firstPage = await fetchItemsFromPortal(portalUrl, query);
    const totalBatch = getTotalBatch(firstPage.total, maxPageSize);
    if (totalBatch === 1) {
        return {
            items: firstPage.results,
            count: firstPage.total
        };
    }
    const remainingRequests = buildRemainingPageRequests({ portalUrl, query, totalBatch, maxPageSize });
    const remainingItems = await getRemainingPortalItems(remainingRequests);
    return {
        items: [...firstPage.results, ...remainingItems],
        count: firstPage.total
    };
};

async function fetchItemsFromPortal(portalUrl, query) {
    const url = `${portalUrl}?${serializeQueryParams(query)}`;
    const items = await axios.get(url);
    return items.data;
}

function getTotalBatch(total, maxPageSize) {
    return Math.ceil(total / maxPageSize);
}

function buildRemainingPageRequests({ portalUrl, query, totalBatch, maxPageSize }) {
    const requests = [];
    // Multiple batches each with maxPageSize number of records
    for (let i = 1; i < totalBatch; i++) {
        query.start += maxPageSize;
        requests.push(axios.get(`${portalUrl}?${serializeQueryParams(query)}`));
    }
    return requests;
}

async function getRemainingPortalItems(requests) {
    const pages = await Promise.all(requests);
    const items = pages.reduce((collection, page) => {
        return collection.concat(page.data.results);
    }, []);
    return items;
}

module.exports = { getPortalItems }; 