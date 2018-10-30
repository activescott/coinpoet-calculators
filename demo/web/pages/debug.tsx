import React from "react"
import { withRouter } from "next/router"
import getConfig from "next/config"
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig()

let Debug: any = withRouter(props => (
  <div>
    <h1>props:</h1>
    <pre>{JSON.stringify(props, null, "  ")}</pre>
  </div>
))

Debug.getInitialProps = async function(context) {
  return {
    contextKeys: Object.keys(context),
    serverRuntimeConfig,
    publicRuntimeConfig
  }
}

export default Debug
