/*
  model.js

  This file is required. It must export a class with at least one public function called `getData`

  Documentation: http://koopjs.github.io/docs/specs/provider/
*/
const request = require('request-promise').defaults({ gzip: true, json: true })
const farmhash = require('farmhash')
const _maxPageSize = 100
const _fieldDictionary = [
  { name: 'id', type: 'String', alias: 'id' },
  { name: 'owner', type: 'String', alias: 'owner' },
  { name: 'created', type: 'Date', alias: 'created' },
  { name: 'modified', type: 'Date', alias: 'modified' },
  { name: 'guid', type: 'String', alias: 'guid' },
  { name: 'name', type: 'String', alias: 'name' },
  { name: 'title', type: 'String', alias: 'title' },
  { name: 'type', type: 'String', alias: 'type' },
  { name: 'typekeywords', type: 'String', alias: 'typeKeywords' },
  { name: 'description', type: 'String', alias: 'description' },
  { name: 'tags', type: 'String', alias: 'tags' },
  { name: 'snippet', type: 'String', alias: 'snippet' },
  { name: 'thumbnail', type: 'String', alias: 'thumbnail' },
  { name: 'documentation', type: 'String', alias: 'documentation' },
  { name: 'extent', type: 'String', alias: 'extent' },
  { name: 'categories', type: 'String', alias: 'categories' },
  { name: 'spatialReference', type: 'String', alias: 'spatialReference' },
  { name: 'accessInformation', type: 'String', alias: 'accessInformation' },
  { name: 'licenseInfo', type: 'String', alias: 'licenseInfo' },
  { name: 'culture', type: 'String', alias: 'culture' },
  { name: 'properties', type: 'String', alias: 'properties' },
  { name: 'url', type: 'String', alias: 'url' },
  { name: 'proxyFilter', type: 'String', alias: 'proxyFilter' },
  { name: 'access', type: 'String', alias: 'access' },
  { name: 'size', type: 'Integer', alias: 'size' },
  { name: 'appCategories', type: 'String', alias: 'appCategories' },
  { name: 'industries', type: 'String', alias: 'industries' },
  { name: 'languages', type: 'String', alias: 'languages' },
  { name: 'largeThumbnail', type: 'String', alias: 'largeThumbnail' },
  { name: 'banner', type: 'String', alias: 'banner' },
  { name: 'screenshots', type: 'String', alias: 'screenshots' },
  { name: 'listed', type: 'String', alias: 'listed' },
  { name: 'numComments', type: 'Integer', alias: 'numComments' },
  { name: 'numRatings', type: 'Integer', alias: 'numRatings' },
  { name: 'avgRating', type: 'Double', alias: 'avgRating' },
  { name: 'numViews', type: 'Integer', alias: 'numViews' },
  { name: 'scoreCompleteness', type: 'Integer' },
  { name: 'groupDesignations', type: 'String' },
  { name: 'itemIdHash', type: 'Integer' }
]

function Model (koop) {}

function serializeQueryParams (params) {
  return Object.keys(params).map(param => {
    let val = params[param]
    if (typeof val !== 'string') val = JSON.stringify(val)
    return `${encodeURIComponent(param)}=${encodeURIComponent(val)}`
  }).join('&')
}

// This is the only public function you need to implement
Model.prototype.getData = function (req, callback) {
  const portal = 'http://www.arcgis.com/sharing/rest/search'
  const query = { f: 'json' }

  if (req.query === undefined || req.query === null) {
    req.query = {}
  }

  // TODO: ensure appropriate quotes for Search in Online
  // Remove any variant of 1=1 as it is not recognized by AGO search; replace = with; replace and ' with "
  query.q = (req.query.where || '*').replace(/1=1|(\(1=1\))|(AND\s1=1)|(AND\s\(1=1\))/g, '').replace(/\s+=\s+/g, ':').replace(/'/g, '"').replace(/[ \t]+$/, '')

  query.num = req.query.resultRecordCount || 5000
  query.start = req.query.resultOffset || 1
  const orderBy = req.query.orderByFields
  if (orderBy !== undefined && orderBy !== null) {
    const orderByArr = orderBy.split(' ')
    query.sortField = orderByArr[0] || 'title'
    query.sortOrder = orderByArr[1] || 'DESC'
  }
  const url = `${portal}?${serializeQueryParams(query)}`

  const requests = []
  requests.push(request(url))

  // Multiple pages
  while (query.num > _maxPageSize && query.start < query.num) {
    query.start = parseInt(query.start) + _maxPageSize
    requests.push(request(`${portal}?${serializeQueryParams(query)}`))
  }

  console.log(`pass-through requests: ${requests.length}`)

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
      geojson.filtersApplied = { where: true }

      geojson.metadata = {
        name: 'ArcGIS Search', // Get the workbook name before ! symbol and set as layer name
        description: 'Search content in ArcGIS Online',
        displayField: 'title',
        fields: _fieldDictionary,
        geometryType: 'Polygon',
        idField: 'itemIdHash'
      }
      // hand off the data to Koop
      callback(null, geojson)
    }).catch(e => {
      console.error(e)
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
  // inspectData(input.id, 'https://s3.amazonaws.com/geohub-assets/templates/public-engagement/city-skyline.jpg')

  // Most of what we need to do here is extract the longitude and latitude
  const ring = []
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
      type: 'Polygon',
      coordinates: [ring]
    }
  }

  // Create a 32-bit integer for use as the OBJECTID
  feature.properties.itemIdHash = transformId(feature.properties.id)

  // But we also want to translate a few of the date fields so they are easier to use downstream
  const dateFields = ['created', 'modified']
  dateFields.forEach(field => {
    feature.properties[field] = new Date(feature.properties[field]).toISOString()
  })
  return feature
}

/**
 * Create an ID that is an integer in range of 0 - 2147483647. Should be noted that
 * the scaling of unsigned 32-bit integers to a range of 0 - 2147483647 increases likely hood
 * that two different input receive the same output
 * @param {*} id
 */
function transformId (id) {
  // Hash to 32 bit unsigned integer
  const hash = farmhash.hash32(id.toString())

  // Normalize to range of postive values of signed integer
  return Math.round((hash / 4294967295) * (2147483647))
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
