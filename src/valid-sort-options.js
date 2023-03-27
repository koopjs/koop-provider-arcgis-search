// valid portal sort fields
const validSortFields = {
    title: true,
    created: true,
    listingpublisheddate: true,
    type: true,
    owner: true,
    avgrating: true,
    numratings: true,
    numcomments: true,
    numviews: true
};
const validSortOrder = {
    asc: true,
    desc: true
};

module.exports = { validSortFields, validSortOrder };