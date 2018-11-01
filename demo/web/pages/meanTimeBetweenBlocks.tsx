import React from "react"
import { withRouter, SingletonRouter } from "next/router"
import DisplayFetchResult from "../components/DisplayFetchResult"
import Layout from "../components/Layout"
import getConfig from "next/config"
import { NextContext } from "next"
import { Request } from "express"
import * as _ from "lodash"
import { IncomingMessage } from "http"

const { publicRuntimeConfig } = getConfig()

type MyNextContext = NextContext<{ coin: string }>

interface MyQuery {
  coin: string
}

interface MyProps {
  router?: SingletonRouter<MyQuery>
  baseUrl: string
  coin: string
}
interface MyState {
  hours: number
  meanTimeBetweenBlocks?: { value: number }
}

class Page extends React.Component<MyProps, MyState> {
  constructor(props: MyProps) {
    super(props)
    this.state = { hours: 1 }
  }

  render = () => {
    console.log("Page Render State:", this.state)
    console.log("props.router:", this.props.router)
    return (
      <Layout>
        <p style={{ color: "red" }}>
          The mean time between blocks for the last
          <input
            type="text"
            defaultValue={this.state.hours.toString()}
            onChange={this.handleHoursChange}
            pattern="\d{0,3}"
            size={3}
          />{" "}
          hours is:{" "}
          <DisplayFetchResult
            url={buildUrl(
              this.props.baseUrl,
              this.props.coin,
              this.state.hours
            )}
            displayPropAccessor={obj => _.get(obj, "value")}
          />
        </p>
      </Layout>
    )
  }

  handleHoursChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleHoursChange:", event.target.value)
    const hours = parseInt(event.target.value)
    if (hours) {
      this.setState({ hours })
    }
  }

  static async getInitialProps(context: MyNextContext): Promise<MyProps> {
    const baseUrl = buildBaseUrl(context.req)
    const coin = coinFromQuery(context.query)
    return { coin, baseUrl }
  }
}

const coinFromQuery = (query: MyQuery) =>
  query && query.coin ? query.coin : "zcash"

function buildBaseUrl(request?: IncomingMessage) {
  // Next's types assume a raw nodejs request (IncomingMessage) but we happen to know Express is providing our request and it has some very handy properties:
  const expressRequest = request as Request
  const protocol =
    expressRequest && expressRequest.protocol
      ? expressRequest.protocol + ":"
      : window.location.protocol
  const hostname = expressRequest
    ? expressRequest.hostname
    : window.location.hostname
  return `${protocol}//${hostname}:${publicRuntimeConfig.port}`
}

function buildUrl(baseUrl: string, coin: string, hours?: number) {
  let url = `${baseUrl}/api/meanTimeBetweenBlocks?coin=${coin}`
  return hours ? url + `&hours=${hours}` : url
}

export default withRouter<MyProps, MyQuery>(Page)
