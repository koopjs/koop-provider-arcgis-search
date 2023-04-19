
const proj4 = require("proj4");
const PROJ4_WKIDS = [4326, 4269, 3857, 3785, 900913, 102113]; // supported wkids by proj4

function buildPortalQuery(requestQuery, log) {
  let portalQuery = { f: 'json' };
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
    portalQuery = addSortOptionsToPortalQuery(portalQuery, requestQuery.orderByFields);
  }

  if (requestQuery.geometryType === 'esriGeometryEnvelope') {
    portalQuery = addBboxToPortalQuery(portalQuery, requestQuery, log);
  }

  return portalQuery;
}

function serializeQueryParams(params) {
  return Object.keys(params).map(param => {
    let val = params[param];
    if (typeof val !== 'string') val = JSON.stringify(val);
    return `${encodeURIComponent(param)}=${encodeURIComponent(val)}`;
  }).join('&');
}

function addBboxToPortalQuery(portalQuery, requestQuery, log) {
  let geometry;
  try {
    geometry = JSON.parse(requestQuery.geometry);
  } catch(e){
    geometry = requestQuery.geometry;
  }

  const extent = getExtent(geometry);
  const inSR = extent && getSpatialReference(geometry, requestQuery, log);
  if (extent && inSR) {
    const normalizedExtent = convertToWGS84(extent, inSR);
    portalQuery.bbox = normalizedExtent.join(',');
  }
  return portalQuery;
}

function addSortOptionsToPortalQuery(portalQuery, orderByFields) {
  const { orderBy } = orderByFields;
  const orderByArr = orderBy.split(' ');
  portalQuery.sortField = orderByArr[0];
  portalQuery.sortOrder = orderByArr.length === 2 ? orderByArr[1] : 'DESC';
  return portalQuery;
}

function getSpatialReference(geometry, requestQuery, log) {
  let queryWkid;

  if(typeof geometry === Object) {
    const { geometry: { spatialReference: { wkid } = {} } = {}} = geometry;
    queryWkid = Number(wkid);
  } else {
    queryWkid = Number(requestQuery.inSR);
  }

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

  log?.warn(`unsupported wkid ${queryWkid} provided`);
}

function convertToWGS84(coordinates, spatialReference) {
  const normalizedCoordinates = spatialReference === 4326 ?
    coordinates :
    coordinates.map((co) => proj4(`EPSG:${spatialReference}`, 'EPSG:4326', co));
  return normalizedCoordinates.splice(0, 2);
}

function getExtent(geometry) {
  if (typeof geometry === 'object') {
    const { xmin, ymin, xmax, ymax } = geometry;
    return [[xmin, ymin], [xmax, ymax]];
  }

  const extent = geometry.split(',').map(Number);
  return [extent.splice(0, 2), extent];
}

module.exports = { serializeQueryParams, buildPortalQuery };
