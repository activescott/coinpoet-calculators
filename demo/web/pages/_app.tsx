import React from "react"
import App, { Container } from "next/app"
import * as _ from "lodash"
import { buildBaseUrlForApi, coinFromQuery } from "../lib"

export default class MyApp extends App {
  static async getInitialProps({ Component, router, ctx }) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    // Add custom props for each page (effectively making pageProps DefaultPageProps):
    const { req, query } = ctx
    const uniQuery = req && req.query ? req.query : query
    //console.log("app uniQuery:", uniQuery)
    pageProps = {
      ...pageProps,
      apiBaseUrl: buildBaseUrlForApi(ctx.req),
      uniQuery,
      coin: coinFromQuery(uniQuery)
    }
    return { pageProps }
  }

  render() {
    const { Component, pageProps } = this.props
    return (
      <Container>
        <Component {...pageProps} />
      </Container>
    )
  }
}
