const { buildPortalQuery } = require('../../src/helpers/portal-query-builder');

describe('Portal query builder', () => {
    let mockLogger;
    beforeEach(() => {
        mockLogger = {
            warn: jest.fn(),
        };
    });

    it('should set portal query q to everything (*) if where is not provided', async () => {
        const requestQuery = {
            f: "json",
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
            outSR: 102100
        };
        const portalQuery = buildPortalQuery(requestQuery, mockLogger);
        expect(portalQuery).toStrictEqual({
            f: "json",
            q: "*",
            num: 100,
            start: 1,
            bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
        });
    });

    it('should convert geometry into bbox portal query if wkid supported by proj4', async () => {
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
            outSR: 102100
        };
        const portalQuery = buildPortalQuery(requestQuery, mockLogger);
        expect(portalQuery).toStrictEqual({
            f: "json",
            q: "typekeywords:\"hubSite\"",
            num: 100,
            start: 1,
            bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
        });
    });

    it('should add default sortfield portal query if orderByFields is provided', async () => {
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
        const portalQuery = buildPortalQuery(requestQuery, mockLogger);
        expect(portalQuery).toStrictEqual({
            f: "json",
            q: "typekeywords:\"hubSite\"",
            num: 100,
            start: 1,
            bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
            sortField: "title",
            sortOrder: "DESC"
        });
    });

    it('should add sortfield portal query if orderByFields is provided', async () => {
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
                orderBy: 'created ASC'
            }
        };
        const portalQuery = buildPortalQuery(requestQuery, mockLogger);
        expect(portalQuery).toStrictEqual({
            f: "json",
            q: "typekeywords:\"hubSite\"",
            num: 100,
            start: 1,
            bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
            sortField: "created",
            sortOrder: "ASC"
        });
    });

    it('should not create bbox portal query if geometry is not provided', async () => {
        const requestQuery = {
            f: "json",
            where: "typekeywords = 'hubSite'",
            returnGeometry: true,
            spatialRel: "esriSpatialRelIntersects",
            maxAllowableOffset: 39135,
            inSR: 102100,
            outFields: "*",
            outSR: 102100
        };
        const portalQuery = buildPortalQuery(requestQuery, mockLogger);
        expect(portalQuery).toStrictEqual({
            f: "json",
            q: "typekeywords:\"hubSite\"",
            num: 100,
            start: 1
        });
    });

    it('should not create bbox portal query if geometry is other than esriGeometryEnvelope', async () => {
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
            geometryType: "esriGeometryPolygon",
            inSR: 102100,
            outFields: "*",
            outSR: 102100
        };
        const portalQuery = buildPortalQuery(requestQuery, mockLogger);
        expect(portalQuery).toStrictEqual({
            f: "json",
            q: "typekeywords:\"hubSite\"",
            num: 100,
            start: 1
        });
    });

    it('should accept geometry query in comma seperated string', async () => {
        const requestQuery = {
            f: "json",
            where: "typekeywords = 'hubSite'",
            returnGeometry: true,
            spatialRel: "esriSpatialRelIntersects",
            maxAllowableOffset: 39135,
            geometry: '-20037508.342788905,20037508.342788905,-0.000004857778549194336,40075016.68557295',
            geometryType: "esriGeometryEnvelope",
            inSR: 102100,
            outFields: "*",
            outSR: 102100
        };
        const portalQuery = buildPortalQuery(requestQuery, mockLogger);
        expect(portalQuery).toStrictEqual({
            f: "json",
            q: "typekeywords:\"hubSite\"",
            num: 100,
            start: 1,
            bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
        });
    });

    it('should default to WGS84 if no spatial reference is provided', async () => {
        const requestQuery = {
            f: "json",
            where: "typekeywords = 'hubSite'",
            returnGeometry: true,
            spatialRel: "esriSpatialRelIntersects",
            maxAllowableOffset: 39135,
            geometry: {
                xmin: -179.99999999999696,
                ymin: 85.05112877980633,
                xmax: -4.363816717609226e-11,
                ymax: 89.78600707473662
            },
            geometryType: "esriGeometryEnvelope",
            outFields: "*",
            outSR: 102100
        };
        const portalQuery = buildPortalQuery(requestQuery, mockLogger);
        expect(portalQuery).toStrictEqual({
            f: "json",
            q: "typekeywords:\"hubSite\"",
            num: 100,
            start: 1,
            bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
        });
    });

    it('should get input spatial reference from inSR query if geometry object does not contain spatial reference', async () => {
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
                ymax: 40075016.68557295
            },
            geometryType: "esriGeometryEnvelope",
            inSR: 102100,
            outFields: "*",
            outSR: 102100
        };
        const portalQuery = buildPortalQuery(requestQuery, mockLogger);
        expect(portalQuery).toStrictEqual({
            f: "json",
            q: "typekeywords:\"hubSite\"",
            num: 100,
            start: 1,
            bbox: "-179.99999999999696,85.05112877980633,-4.363816717609226e-11,89.78600707473662",
        });
    });

    it('should not create bbox portal query if wkid is not supported by proj4', async () => {
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
                    wkid: 7815,
                },
            },
            geometryType: "esriGeometryEnvelope",
            inSR: 7815,
            outFields: "*",
            outSR: 7815
        };
        const portalQuery = buildPortalQuery(requestQuery, mockLogger);
        expect(portalQuery).toStrictEqual({
            f: "json",
            q: "typekeywords:\"hubSite\"",
            num: 100,
            start: 1
        });
        expect(mockLogger.warn).toHaveBeenCalledTimes(1);
        expect(mockLogger.warn).toHaveBeenCalledWith('unsupported wkid 7815 provided');
    });
});
