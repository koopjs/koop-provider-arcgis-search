
const ArcgisSearchProviderError = require('../arcgis-search-provider-error');
const { validSortFields, validSortOrder } = require('../valid-sort-options');
const Joi = require('joi');

const geoservicesEnvelopeObjSchema = Joi.object({
  xmin: Joi.number().required(),
  ymin: Joi.number().required(),
  xmax: Joi.number().required(),
  ymax: Joi.number().required(),
  spatialReference: {
    wkid: Joi.number().required()
  }
});
const geoservicesEnvelopeArraySchema = Joi.array().items(Joi.number()).length(4).required();

const wkidSchema = Joi.object({
  wkid: Joi.number().positive().integer().required(),
  latestWkid: Joi.number().positive().integer(),
  vcsWkid: Joi.number().positive().integer().required(),
  latestVcsWkid: Joi.number().positive().integer()
});
const wktSchema = Joi.object({
  wkt: Joi.number().positive().integer().required()
});
const spatialReferenceSchema = Joi.object({
  spatialReference: Joi.alternatives(wkidSchema, wktSchema)
});
const requestQuerySchema = Joi.object().keys({
  resultRecordCount: Joi.number().positive().integer(),
  resultOffset: Joi.number().positive().integer(),
  inSR: Joi.alternatives(Joi.number().positive().integer(), spatialReferenceSchema),
  where: Joi.string(),
  orderByFields: Joi.object().keys({
    orderBy: Joi.string().pattern(new RegExp(/^[a-zA-Z]+\s?[a-zA-Z]*$/)),
  }),
  geometry: Joi.when('geometryType', {
    is: 'esriGeometryEnvelope',
    then: Joi.alternatives(geoservicesEnvelopeObjSchema, geoservicesEnvelopeArraySchema)
  }),
  geometryType: Joi.string().valid('esriGeometryEnvelope', 'esriGeometryPolygon')
}).unknown(true);

function validateRequestQuery(requestQuery) {
  const prasedRequerQuery = parseRequestQuery(requestQuery);
  const validate = requestQuerySchema.validate(prasedRequerQuery);
  if (validate.error) {
    throw new ArcgisSearchProviderError(validate.error.message, 400);
  }

  if (requestQuery.orderByFields) {
    validateSortOptions(requestQuery.orderByFields);
  }
};

function parseRequestQuery(requestQuery) {
  try {
    const parsedRequestQuery = {
      ...requestQuery,
      geometry: typeof requestQuery.geometry === 'string' ? JSON.parse(requestQuery.geometry) : requestQuery.geometry
    };
    return parsedRequestQuery;
  } catch (err) {
    throw new ArcgisSearchProviderError('geometry field is not valid JSON', 400);
  }
}

function validateSortOptions(orderByFields) {
  const { orderBy } = orderByFields;
  const orderByArr = orderBy.split(' ');
  if (!validSortFields[orderByArr[0]]) {
    throw new ArcgisSearchProviderError('Invalid sort field given', 400);
  }

  if (orderByArr.length === 2 && !validSortOrder[validSortOrder[1]]) {
    throw new ArcgisSearchProviderError('Invalid sort order given', 400);
  }
}

module.exports = { validateRequestQuery };