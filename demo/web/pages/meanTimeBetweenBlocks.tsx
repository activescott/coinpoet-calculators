import React from "react"
import { withRouter, SingletonRouter } from "next/router"
import DisplayFetchResult from "../components/DisplayFetchResult"
import Layout from "../components/Layout"
import { NextContext } from "next"
import * as _ from "lodash"
import { buildBaseUrlForApi, coinFromQuery } from "../lib"

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
    return (
      <Layout>
        <p style={{ color: "red" }}>
          The mean time between blocks for the last &nbsp;
          <select value={this.state.hours} onChange={this.handleHoursChange}>
            {_.range(1, 25).map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          &nbsp; hours is: &nbsp;
          <DisplayFetchResult
            url={buildUrl(
              this.props.baseUrl,
              this.props.coin,
              this.state.hours
            )}
            resultRenderer={obj => <span>{_.get(obj, "value")}</span>}
          />
        </p>
      </Layout>
    )
  }

  handleHoursChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const hours = parseInt(event.target.value)
    if (hours) {
      this.setState({ hours })
    }
  }

  static async getInitialProps(context: MyNextContext): Promise<MyProps> {
    const baseUrl = buildBaseUrlForApi(context.req)
    const coin = coinFromQuery(context.query)
    return { coin, baseUrl }
  }
}

function buildUrl(baseUrl: string, coin: string, hours?: number) {
  let url = `${baseUrl}/api/meanTimeBetweenBlocks?coin=${coin}`
  return hours ? url + `&hours=${hours}` : url
}

export default withRouter<MyProps, MyQuery>(Page)
