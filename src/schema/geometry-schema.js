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

module.exports = { geoservicesEnvelopeObjSchema, geoservicesEnvelopeArraySchema };