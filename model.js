/*
  model.js

  This file is required. It must export a class with at least one public function called `getData`

  Documentation: http://koopjs.github.io/docs/specs/provider/
*/
const request = require('request-promise').defaults({gzip: true, json: true})
const _maxPageSize = 100
const _fieldDictionary = [ { 'name': 'id', 'type': 'esriFieldTypeString', 'alias': 'id', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'owner', 'type': 'esriFieldTypeString', 'alias': 'owner', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'created', 'type': 'esriFieldTypeDate', 'alias': 'created', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'modified', 'type': 'esriFieldTypeDate', 'alias': 'modified', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'guid', 'type': 'esriFieldTypeString', 'alias': 'guid', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'name', 'type': 'esriFieldTypeString', 'alias': 'name', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'title', 'type': 'esriFieldTypeString', 'alias': 'title', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'type', 'type': 'esriFieldTypeString', 'alias': 'type', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'typekeywords', 'type': 'esriFieldTypeString', 'alias': 'typeKeywords', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'description', 'type': 'esriFieldTypeString', 'alias': 'description', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'tags', 'type': 'esriFieldTypeString', 'alias': 'tags', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'snippet', 'type': 'esriFieldTypeString', 'alias': 'snippet', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'thumbnail', 'type': 'esriFieldTypeString', 'alias': 'thumbnail', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'documentation', 'type': 'esriFieldTypeString', 'alias': 'documentation', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'extent', 'type': 'esriFieldTypeString', 'alias': 'extent', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'categories', 'type': 'esriFieldTypeString', 'alias': 'categories', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'spatialReference', 'type': 'esriFieldTypeString', 'alias': 'spatialReference', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'accessInformation', 'type': 'esriFieldTypeString', 'alias': 'accessInformation', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'licenseInfo', 'type': 'esriFieldTypeString', 'alias': 'licenseInfo', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'culture', 'type': 'esriFieldTypeString', 'alias': 'culture', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'properties', 'type': 'esriFieldTypeString', 'alias': 'properties', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'url', 'type': 'esriFieldTypeString', 'alias': 'url', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'proxyFilter', 'type': 'esriFieldTypeString', 'alias': 'proxyFilter', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'access', 'type': 'esriFieldTypeString', 'alias': 'access', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'size', 'type': 'esriFieldTypeInteger', 'alias': 'size', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'appCategories', 'type': 'esriFieldTypeString', 'alias': 'appCategories', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'industries', 'type': 'esriFieldTypeString', 'alias': 'industries', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'languages', 'type': 'esriFieldTypeString', 'alias': 'languages', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'largeThumbnail', 'type': 'esriFieldTypeString', 'alias': 'largeThumbnail', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'banner', 'type': 'esriFieldTypeString', 'alias': 'banner', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'screenshots', 'type': 'esriFieldTypeString', 'alias': 'screenshots', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'listed', 'type': 'esriFieldTypeString', 'alias': 'listed', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'numComments', 'type': 'esriFieldTypeInteger', 'alias': 'numComments', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'numRatings', 'type': 'esriFieldTypeInteger', 'alias': 'numRatings', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'avgRating', 'type': 'esriFieldTypeInteger', 'alias': 'avgRating', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'numViews', 'type': 'esriFieldTypeInteger', 'alias': 'numViews', 'length': null, 'editable': false, 'nullable': true, 'domain': null },
{ 'name': 'OBJECTID', 'type': 'esriFieldTypeOID', 'alias': 'ID', 'length': null, 'editable': false, 'nullable': false, 'domain': null } ]

function Model (koop) {}

function serializeQueryParams (params) {
  const str = []
  for (const param in params) {
    if (params.hasOwnProperty(param)) {
      let val = params[param]
      if (typeof val !== 'string') {
        val = JSON.stringify(val)
      }
      str.push(`${encodeURIComponent(param)}=${encodeURIComponent(val)}`)
    }
  }
  return str.join('&')
}

// This is the only public function you need to implement
Model.prototype.getData = function (req, callback) {
  const portal = 'http://www.arcgis.com/sharing/rest/search'
  let query = {f: 'json'}

  if (req.query === undefined || req.query === null) {
    req.query = {}
  }

  // TODO: ensure appropriate quotes for Search in Online
  query.q = (req.query.where || '*').replace(/\s+=\s+/g, ':').replace(/'/g, '"')

  query.num = req.query.resultRecordCount || 5000
  query.start = req.query.resultOffset || 1
  let orderBy = req.query.orderByFields
  if (orderBy !== undefined && orderBy !== null) {
    let orderByArr = orderBy.split(' ')
    query.sortField = orderByArr[0] || 'title'
    query.sortOrder = orderByArr[1] || 'DESC'
  }
  let url = `${portal}?${serializeQueryParams(query)}`

  const requests = []
  requests.push(request(url))

  // Multiple pages
  while (query.num > _maxPageSize && query.start < query.num) {
    query.start = parseInt(query.start) + _maxPageSize
    requests.push(request(`${portal}?${serializeQueryParams(query)}`))
  }

  Promise.all(requests)
    .then((pages) => {
      // if (err) return callback(err)
      // translate the response into geojson

      const items = {}
      items.total = pages[0].total

      items.results = pages.reduce((collection, page) => {
        return collection.concat(page.results)
      }, [])

      const geojson = translate(items)
      // Cache data for 10 seconds at a time by setting the ttl or 'Time to Live'
      // geojson.ttl = 10
      geojson.metadata = { name: 'ArcGIS Search' }
      geojson.filtersApplied = { where: true }

      geojson.metadata = {
        name: 'ArcGIS Search', // Get the workbook name before ! symbol and set as layer name
        description: 'Search content in ArcGIS Online',
        displayField: 'title',
        fields: _fieldDictionary,
        geometryType: 'Polygon'
      }
      // hand off the data to Koop
      callback(null, geojson)
    })
}

function translate (input) {
  const features = {
    type: 'FeatureCollection',
    features: input.results.map(formatFeature),
    count: input.total
  }
  return features
}

function formatFeature (input) {
  // Most of what we need to do here is extract the longitude and latitude
  let ring = []
  if (input.extent.length === 0) {
    input.extent = [[0, 0], [1, 1]]
  }
  ring.push([input.extent[0][0], input.extent[0][1]])
  ring.push([input.extent[1][0], input.extent[0][1]])
  ring.push([input.extent[1][0], input.extent[1][1]])
  ring.push([input.extent[0][0], input.extent[1][1]])
  ring.push([input.extent[0][0], input.extent[0][1]])

  const feature = {
    type: 'Feature',
    properties: input,
    geometry: {
      'type': 'Polygon',
      'coordinates': [ring]
    }
  }
  // But we also want to translate a few of the date fields so they are easier to use downstream
  const dateFields = ['created', 'modified']
  dateFields.forEach(field => {
    feature.properties[field] = new Date(feature.properties[field]).toISOString()
  })
  return feature
}

module.exports = Model

/* Example raw API response
{
  "query": "group:47dd57c9a59d458c86d3d6b978560088",
  "total": 5640,
  "start": 1,
  "num": 10,
  "nextStart": 11,
  "results": [
    {
      "id": "94f838a535334cf1aa061846514b77c7",
      "owner": "esri",
      "created": 1261093511000,
      "modified": 1501816425000,
      "guid": null,
      "name": "World_Transportation",
      "title": "World Transportation",
      "type": "Map Service",
      "typeKeywords": [ "ArcGIS Server", "Data", "Map Service", "Service", "Tiled" ],
      "description": "...",
      "tags": [ "world", "transportation", "street", "road", "streets", "roads",
        "railroads", "airports", "street names", "road names", "street labels",
        "road labels", "name", "label", "labels", "highways", "highway names",
        "highway labels", "names", "reference", "basemap", "esri_basemap",
        "general availability"
      ],
      "snippet": "This reference map provides a transportation and street name labels reference overlay that is particularly useful on top of imagery.",
      "thumbnail": "thumbnail/ago_downloaded.jpg",
      "documentation": null,
      "extent": [ [ -179.999988540844, -85 ], [ 179.999988540844, 85 ] ],
      "categories": [],
      "spatialReference": "102100",
      "accessInformation": "Sources: Esri, Garmin, HERE, MapmyIndia, © OpenStreetMap contributors, and the GIS User Community",
      "licenseInfo": "...",
      "culture": null,
      "properties": null,
      "url": "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer",
      "proxyFilter": null,
      "access": "public",
      "size": -1,
      "appCategories": [],
      "industries": [],
      "languages": [],
      "largeThumbnail": null,
      "banner": null,
      "screenshots": [],
      "listed": false,
      "numComments": 9,
      "numRatings": 9,
      "avgRating": 4.449999809265137,
      "numViews": 19057389
    }
  ]
}
*/
