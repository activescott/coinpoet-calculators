import React from "react"
import App, { Container } from "next/app"
import * as _ from "lodash"
import { apiRequest, buildBaseUrlForApi } from "../lib"

export default class MyApp extends App {
  static async getInitialProps({ Component, router, ctx }) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    // Add custom props for each page (effectively making pageProps DefaultPageProps):
    pageProps = {
      ...pageProps,
      apiBaseUrl: buildBaseUrlForApi(ctx.req)
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
