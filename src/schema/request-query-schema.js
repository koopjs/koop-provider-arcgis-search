const Joi = require('joi');
const { geoservicesEnvelopeObjSchema, geoservicesEnvelopeArraySchema } = require('./geometry-schema');
const requestQuerySchema = Joi.object().keys({
    resultRecordCount: Joi.number().positive().integer(),
    resultOffset: Joi.number().positive().integer(),
    num: Joi.number().positive().integer(),
    inSR: Joi.number().positive().integer(),
    outSR: Joi.number().positive().integer(),
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

module.exports = { requestQuerySchema };