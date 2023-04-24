# Change Log

All notable changes to this project will be documented in this file. This project adheres to
[Semantic Versioning](http://semver.org/).

## [2.0.8] - 2023-04-23
### Changed
* Update farmhash package

## [2.0.7] - 2023-04-23
### Added
* Skip requests to portal for invalid requests

## [2.0.6] - 2023-04-21
### Added
* Log all requests to portal

## [2.0.5] - 2023-04-17
### Added
* Log full portal request with query parameters

## [2.0.4] - 2023-04-14
### Fixed
* Use Koop logger

## [2.0.3] - 2023-04-13
### Added
* Support to set log level
* Log portal url whenever portal request is made 

## [2.0.2] - 2023-03-31
### Added
* Support for stringifield valid geometry JSON object in request query

## [2.0.1] - 2023-03-30
### Fixed
* importing module issue

### Added
* Support for custom portal endpoint 

## [2.0.0] - 2023-03-30
### Added
* Support for `bbox` query parameter for Arcgis portal search
* Better batching mechanism to retreive data from Arcgis portal when result exceeds the limit
* Request query validation
* Unit tests and coverage badge

### Changed
* Refactor code for better readability and maintainability

## [1.0.2] - 2019-08-01
### Fixed
* remove aws-serveless package from package dependencies
* get unit tests passing

### Changed
* Update style for standard

## [1.0.1] - 2019-01-08
### Fixed
* Add regex to remove variants of `1=1` from query terms sent to AGO search
* Hash item id for ObjectID

## [1.0.0] - 2019-01-02
Initial release of a ArcGIS Online and Portal search provider.

[1.0.2]: https://github.com/koopjs/koop-provider-file-geojson/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/koopjs/koop-provider-file-geojson/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/koopjs/koop-provider-file-geojson/releases/tag/v1.0.0