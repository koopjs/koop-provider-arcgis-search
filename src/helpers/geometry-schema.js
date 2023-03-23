const Joi = require('joi');

const objTypeGeometryQuerySchema = Joi.object({
    xmin: Joi.number().required(),
    ymin: Joi.number().required(),
    xmax: Joi.number().required(),
    ymax: Joi.number().required(),
    spatialReference: {
        wkid: Joi.number().required()
    }
});
const arrayTypeGeometryQuerySchema = Joi.array().items(Joi.number()).length(4).required();

module.exports = { objTypeGeometryQuerySchema, arrayTypeGeometryQuerySchema };
