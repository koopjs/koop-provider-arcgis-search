# Change Log

All notable changes to this project will be documented in this file. This project adheres to
[Semantic Versioning](http://semver.org/).

## Unreleased
### Fixed
* importing module issue

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