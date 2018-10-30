import React from "react"
import { withRouter } from "next/router"
import Layout from "../components/Layout"
import "isomorphic-fetch"
import getConfig from "next/config"
const { publicRuntimeConfig } = getConfig()

let Page: any = withRouter((props: any) => (
  <Layout>
    <p style={{ color: "red" }}>
      The expected mean time between blocks is:{" "}
      {props.meanTimeBetweenBlocks.value}
    </p>
  </Layout>
))

Page.getInitialProps = async function(context) {
  // console.log("context keys", Object.keys(context))
  const coin = context.query.coin ? context.query.coin : "zcash"
  const protocol = context.req
    ? context.req.protocol + ":"
    : window.location.protocol
  const hostname = context.req ? context.req.hostname : window.location.hostname
  const url = `${protocol}//${hostname}:${publicRuntimeConfig.port}`
  console.log("url", url)
  const res = await fetch(`${url}/api/meanTimeBetweenBlocks?coin=${coin}`)
  const json = await res.json()
  console.log("api/meanTimeBetweenBlocks json:", json)
  return {
    meanTimeBetweenBlocks: json
  }
}

export default Page
