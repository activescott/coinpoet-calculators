import React from "react"
import { withRouter, SingletonRouter } from "next/router"
import Layout from "../components/Layout"
import "isomorphic-fetch"
import getConfig from "next/config"
const { publicRuntimeConfig } = getConfig()
import { NextContext } from "next"
import { Request } from "express"
import * as _ from "lodash"
import { IncomingMessage } from "http"

type MyNextContext = NextContext<{ coin: string }>

interface IQuery {
  coin: string
}

interface MyProps {
  router?: SingletonRouter
  baseUrl: string
  coin: string
}
interface MyState {
  hours: number
  meanTimeBetweenBlocks?: { value: number }
}

class Page extends React.Component<MyProps, MyState> {
  constructor(props) {
    super(props)
    this.state = { hours: 1 }
  }

  render = () => {
    console.log("Page Render State:", this.state)
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
      //let { meanTimeBetweenBlocks } = await fetchData(coinFromQuery(this.props.router.query as any as IQuery), null)
      // this.setState( { hours, meanTimeBetweenBlocks })
      this.setState({ hours })
    }
  }

  static async getInitialProps(context: MyNextContext): Promise<MyProps> {
    const baseUrl = buildBaseUrl(context.req)
    const coin = coinFromQuery(context.query)
    const url = buildUrl(baseUrl, coin)
    return { coin, baseUrl }
  }
}

interface DisplayFetchResultProps {
  url: string
  displayPropAccessor: (result: any) => string
  loadingText?: string
}

interface DisplayFetchResultState {
  fetchResult?: any
}

/**
 * Fetches the url and displays the value of the specified prop.
 */
class DisplayFetchResult extends React.Component<
  DisplayFetchResultProps,
  DisplayFetchResultState
> {
  constructor(props: DisplayFetchResultProps, readonly _loadingText: string) {
    super(props)
    this._loadingText = props.loadingText ? props.loadingText : "Loading..."
  }

  render = () => {
    console.log(
      "fetchResult in render:",
      this.state ? this.state.fetchResult : "null"
    )
    return (
      <span>
        {this.state && this.state.fetchResult
          ? this.props.displayPropAccessor(this.state.fetchResult)
          : this._loadingText}
      </span>
    )
  }

  componentDidMount = async () => {
    return this.fetchData()
  }

  componentDidUpdate = async (prevProps: DisplayFetchResultProps) => {
    if (this.props.url !== prevProps.url) {
      this.fetchData()
    }
  }

  fetchData = async () => {
    console.log("Fetching", this.props.url, "...")
    const res = await fetch(this.props.url)
    const fetchResult = await res.json()
    console.log("Fetching", this.props.url, "complete:", fetchResult)
    this.setState({ fetchResult })
  }
}

const coinFromQuery = (query: IQuery) =>
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

export default withRouter<MyProps, IQuery>(Page)
