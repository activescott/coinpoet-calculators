import React from "react"
import { withRouter, SingletonRouter } from "next/router"
import DisplayFetchResult from "../components/DisplayFetchResult"
import Layout from "../components/Layout"
import * as _ from "lodash"
import { DefaultPageProps } from "../lib"

interface MyQuery {
  coin: string
}

interface MyProps extends DefaultPageProps {
  router?: SingletonRouter<MyQuery>
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
              this.props.apiBaseUrl,
              this.props.coin,
              this.state.hours
            )}
            resultRenderer={obj => <span>{_.get(obj, "value")} seconds</span>}
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
}

function buildUrl(baseUrl: string, coin: string, hours?: number) {
  let url = `${baseUrl}/meanTimeBetweenBlocks?coin=${coin}`
  return hours ? url + `&hours=${hours}` : url
}

export default withRouter<MyProps, MyQuery>(Page)
