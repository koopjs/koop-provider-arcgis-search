
const ArcgisSearchProviderError = require('../arcgis-search-provider-error');
const { requestQuerySchema } = require('../schema/request-query-schema');

function validateRequestQuery(requestQuery) {
  const validate = requestQuerySchema.validate(requestQuery);
  if (validate.error) {
    throw new ArcgisSearchProviderError(validate.error.message, 400);
  }
};

module.exports = { validateRequestQuery };