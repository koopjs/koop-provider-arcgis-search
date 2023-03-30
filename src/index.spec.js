const providerConfig = require('./');
const ArcgiSearchModel = require('../src/model');

describe('provider registration', () => {
  it('creates a provider options object', () => {
    expect(providerConfig).toBeDefined();
    expect(providerConfig.name).toBe('arcgissearch');
    expect(providerConfig.type).toBe('provider');
    expect(providerConfig.disableIdParam).toBe(true);
    expect(providerConfig.Model).toEqual(ArcgiSearchModel);
  });
});
