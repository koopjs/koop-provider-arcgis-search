const { validateRequestQuery } = require('../../src/helpers/validate-request-query');
const ArcgisSearchProviderError = require('../../src/arcgis-search-provider-error');

describe('Validate Request Query', () => {
    it('should throw validation error if orderByFields contains invalid sort field', async () => {
        const requestQuery = {
            f: "json",
            where: "typekeywords = 'hubSite'",
            returnGeometry: true,
            spatialRel: "esriSpatialRelIntersects",
            maxAllowableOffset: 39135,
            geometry: {
                xmin: -20037508.342788905,
                ymin: 20037508.342788905,
                xmax: -0.000004857778549194336,
                ymax: 40075016.68557295,
                spatialReference: {
                    wkid: 3785,
                },
            },
            geometryType: "esriGeometryEnvelope",
            inSR: 3785,
            outFields: "*",
            outSR: 102100,
            orderByFields: {
                orderBy: 'invalidKey'
            }
        };

        try {
            validateRequestQuery(requestQuery);
        } catch (err) {
            expect(err.statusCode).toBe(400);
            expect(err.message).toBe('Invalid sort field given');
            expect(err).toBeInstanceOf(ArcgisSearchProviderError);
        };
    });

    it('should throw validation error if orderByFields contains invalid sort order', async () => {
        const requestQuery = {
            f: "json",
            where: "typekeywords = 'hubSite'",
            returnGeometry: true,
            spatialRel: "esriSpatialRelIntersects",
            maxAllowableOffset: 39135,
            geometry: {
                xmin: -20037508.342788905,
                ymin: 20037508.342788905,
                xmax: -0.000004857778549194336,
                ymax: 40075016.68557295,
                spatialReference: {
                    wkid: 3785,
                },
            },
            geometryType: "esriGeometryEnvelope",
            inSR: 3785,
            outFields: "*",
            outSR: 102100,
            orderByFields: {
                orderBy: 'title invalidSortOrder'
            }
        };

        try {
            validateRequestQuery(requestQuery);
        } catch (err) {
            expect(err.statusCode).toBe(400);
            expect(err.message).toBe('Invalid sort order given');
            expect(err).toBeInstanceOf(ArcgisSearchProviderError);
        };
    });

    it('should throw validation error if orderByFields contains invalid sort object', async () => {
        const requestQuery = {
            f: "json",
            where: "typekeywords = 'hubSite'",
            returnGeometry: true,
            spatialRel: "esriSpatialRelIntersects",
            maxAllowableOffset: 39135,
            geometry: {
                xmin: -20037508.342788905,
                ymin: 20037508.342788905,
                xmax: -0.000004857778549194336,
                ymax: 40075016.68557295,
                spatialReference: {
                    wkid: 3785,
                },
            },
            geometryType: "esriGeometryEnvelope",
            inSR: 3785,
            outFields: "*",
            outSR: 102100,
            orderByFields: {
                foo: 'bar'
            }
        };

        try {
            validateRequestQuery(requestQuery);
        } catch (err) {
            expect(err.statusCode).toBe(400);
            expect(err.message).toBe('"orderByFields.foo" is not allowed');
            expect(err).toBeInstanceOf(ArcgisSearchProviderError);
        };
    });

    it('should throw error if request query is in invalid format inSR query', async () => {
        const requestQuery = {
            f: "json",
            where: "typekeywords = 'hubSite'",
            returnGeometry: true,
            spatialRel: "esriSpatialRelIntersects",
            maxAllowableOffset: 39135,
            geometry: {
                xmin: -20037508.342788905,
                ymin: 20037508.342788905,
                xmax: -0.000004857778549194336,
                ymax: 40075016.68557295,
                spatialReference: {
                    wkid: 102100,
                },
            },
            geometryType: "esriGeometryEnvelope",
            inSR: 'string inSR',
            outFields: "*",
            outSR: 102100
        };

        try {
            validateRequestQuery(requestQuery);
        } catch (err) {
            expect(err.statusCode).toBe(400);
            expect(err.message).toBe('"inSR" must be a number');
            expect(err).toBeInstanceOf(ArcgisSearchProviderError);
        };
    });

    it('should not throw error if orderByFields query only contains valid sort field', async () => {
        const requestQuery = {
            f: "json",
            where: "typekeywords = 'hubSite'",
            returnGeometry: true,
            spatialRel: "esriSpatialRelIntersects",
            maxAllowableOffset: 39135,
            geometry: {
                xmin: -20037508.342788905,
                ymin: 20037508.342788905,
                xmax: -0.000004857778549194336,
                ymax: 40075016.68557295,
                spatialReference: {
                    wkid: 3785,
                },
            },
            geometryType: "esriGeometryEnvelope",
            inSR: 3785,
            outFields: "*",
            outSR: 102100,
            orderByFields: {
                orderBy: 'title'
            }
        };
        
        expect(() => validateRequestQuery(requestQuery)).not.toThrow(ArcgisSearchProviderError);
    });
});