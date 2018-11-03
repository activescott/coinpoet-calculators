const withTypescript = require("@zeit/next-typescript")
const SWPrecacheWebpackPlugin = require("sw-precache-webpack-plugin")

let config = withTypescript({
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: "secret"
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    port: parseInt(process.env.PORT, 10) || 3000,
    staticFolder: "/static",
    mySecret: process.env.MY_SECRET // Pass through env variables
  },
  // See https://github.com/zeit/next.js/tree/master/examples/with-sw-precache
  webpack: config => {
    config.plugins.push(
      new SWPrecacheWebpackPlugin({
        verbose: true,
        staticFileGlobsIgnorePatterns: [/\.next\//],
        runtimeCaching: [
          {
            handler: "networkFirst",
            urlPattern: /^https?.*/
          }
        ]
      })
    )
    return config
  }
})
module.exports = config
