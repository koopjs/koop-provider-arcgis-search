
const ArcgisSearchProviderError = require('../arcgis-search-provider-error');
const { requestQuerySchema } = require('../schema/request-query-schema');
const { validSortFields, validSortOrder } = require('../valid-sort-options');

function validateRequestQuery(requestQuery) {
  const validate = requestQuerySchema.validate(requestQuery);
  if (validate.error) {
    throw new ArcgisSearchProviderError(validate.error.message, 400);
  }

  if (requestQuery.orderByFields) {
    validateSortOptions(requestQuery.orderByFields);
  }
};

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