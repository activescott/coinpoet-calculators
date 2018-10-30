const withTypescript = require("@zeit/next-typescript")

module.exports = withTypescript({
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: "secret"
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    port: parseInt(process.env.PORT, 10) || 3000,
    staticFolder: "/static",
    mySecret: process.env.MY_SECRET // Pass through env variables
  }
})
