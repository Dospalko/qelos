const mongoose = require('mongoose')
const { appConfiguration } = require('../../../config')

const Configuration = mongoose.model('Configuration')

const APP_CONFIGS_WITHOUT_WEBSITE_URLS = { key: appConfiguration, metadata: { websiteUrls: { $exists: false } } };

/**
 * update site configuration
 */

/**
 * check if app-configuration doesn't have websiteUrls propery
 */
async function check () {
  const hasMissingWebsiteUrlConfig = await Configuration.countDocuments(APP_CONFIGS_WITHOUT_WEBSITE_URLS)
  return !hasMissingWebsiteUrlConfig
}

/**
 * migrate relevant db rows to fit the new upgrade
 */
function migrate () {
  console.log('start appConfiguration.metadata.websiteUrls migration')
  return Configuration.aggregate([
    { $match: APP_CONFIGS_WITHOUT_WEBSITE_URLS },
    { $limit: 20 },
    { $project: { _id: 1 } }
  ])
    .then(async (list) => {
      if (!list || !list.length) {
        console.log('No more rows to update.')
        return true
      }

      let row
      console.log('start migration of ' + list.length + ' items')
      for (let i in list) {
        row = list[i]
        console.log('update appConfig: ', row._id)
        await Configuration.collection.updateOne({ _id: row._id },
          {
            $set: { 'metadata.websiteUrls': [] }
          })
      }
      return migrate()
    })
}

/**
 * check if all migration changes done as expected
 */
function verify () {
  return Configuration.countDocuments(APP_CONFIGS_WITHOUT_WEBSITE_URLS).then(count => {
    if (!count) return Promise.resolve()
  })
}

module.exports = {
  check, migrate, verify
}
