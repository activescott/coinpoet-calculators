import React from "react"
import { withRouter } from "next/router"
import "isomorphic-fetch"
import getConfig from "next/config"
const { publicRuntimeConfig } = getConfig()

let Page: any = withRouter((props: any) => (
  <div>
    <p style={{ color: "red" }}>
      Your mean time between blocks is: {props.meanTimeBetweenBlocks.value}
    </p>
    <h1>props:</h1>
    <pre>{JSON.stringify(props, null, "  ")}</pre>
  </div>
))

Page.getInitialProps = async function(context) {
  const url = `${context.req.protocol}://${context.req.host}:${
    publicRuntimeConfig.port
  }`
  const res = await fetch(`${url}/api/meanTimeBetweenBlocks`)
  const json = await res.json()
  return {
    meanTimeBetweenBlocks: json
  }
}

export default Page
