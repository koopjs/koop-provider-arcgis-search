# Koop Provider for ArcGIS Search

Provides a GeoService API to ArcGIS Search for Online and Portal

Build your own Koop provider using [koop-provider-sample](https://github.com/koopjs/koop-provider-sample) or [docs](https://koopjs.github.io/docs/specs/provider/).

## Test it out
Run server:
- `npm install`
- `npm start`

Example API Query:
- `curl localhost:8080/sample/FeatureServer/0/query?returnCountOnly=true`

Tests:
- `npm test`

## With Docker

- `docker build -t koop-provider-arcgis-search .`
- `docker run -it -p 8080:8080 koop-provider-arcgis-search`

## Publish to npm
- run `npm init` and update the fields
  - Choose a name like `koop-provider-foo`
- run `npm publish`
