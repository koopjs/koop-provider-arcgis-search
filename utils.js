const request = require('request-promise').defaults({ gzip: true, json: true })

// Development Function - outputs string matches in the Item/data
function inspectData (id, match) {
  const dataUrl = `http://www.arcgis.com/sharing/rest/content/items/${id}/data?f=json`
  console.log('dataUrl', dataUrl)
  request(dataUrl).then((data) => {
    // console.log("Data", data)
    const layout = JSON.stringify(data.values.layout)
    // console.log("layout", layout)

    let matchLayout = null
    if (layout !== undefined && layout !== null) {
      matchLayout = layout.match(match)
    } else {
      console.log(`Layout null for ${dataUrl}`)
    }
    if (matchLayout !== undefined && matchLayout !== null) {
      console.log(`Match for [${match}] from ${id}`, matchLayout)
    }
  })
}

module.exports = { inspectData }
