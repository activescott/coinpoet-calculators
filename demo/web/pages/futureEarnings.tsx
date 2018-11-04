import React from "react"
import { withRouter, SingletonRouter } from "next/router"
import Layout from "../components/Layout"
import { NextContext } from "next"
import { BigNumber } from "bignumber.js"
import IntlMessageFormat from "intl-messageformat"

import {
  buildBaseUrlForApi,
  coinFromQuery,
  fetchMeanTimeBetweenBlocks
} from "../lib"
import { EstimateFutureEarningsOptions } from "../../../src/Estimator"

const formStyle = {
  margin: 20,
  padding: 10,
  border: "1px solid #DDD"
}
interface MyQuery {}

interface MyProps {
  router?: SingletonRouter<MyQuery>
  meanNetworkSecondsBetweenBlocks: number
  //networkHashesPerSecond: BigNumber
}

interface MyState {
  electricityCostKwh: number
}

type MyNextContext = NextContext<{ coin: string }>

class MyPage extends React.Component<MyProps, MyState> {
  constructor(props: MyProps) {
    super(props)
    this.state = {
      electricityCostKwh: 0.11
    }
  }

  render = () => {
    console.log("render state:", this.state)
    return (
      <Layout>
        <p>hi futureEarnings</p>
        <form style={formStyle} onSubmit={this.handleSubmit}>
          <div className="form-group">
            <label>
              Electricity Cost (per kWh):
              <input
                id="electricityCostKwh"
                className="form-control"
                type="number"
                min="0.01"
                max="0.5"
                step="0.01"
                value={
                  this.state && this.state.electricityCostKwh
                    ? this.state.electricityCostKwh
                    : 0
                }
                onChange={event =>
                  event.target && event.target.value
                    ? this.setState({
                        electricityCostKwh: parseFloat(event.target.value)
                      })
                    : null
                }
              />
            </label>
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
            />
          </div>
          <div className="form-group">
            <label>
              Email address2
              <input
                type="email"
                className="form-control"
                placeholder="Enter email"
              />
            </label>
          </div>

          <div>
            <input type="submit" value="BOOM" />
          </div>
        </form>
        <p>
          meanNetworkSecondsBetweenBlocks:{" "}
          {this.formattedSecondsBetweenBlocks()}
        </p>
      </Layout>
    )
  }

  componentDidMount = async () => {}

  formattedCost = () => {
    let cost =
      this.state && this.state.electricityCostKwh
        ? this.state.electricityCostKwh
        : 0
    const msg = new IntlMessageFormat("{cost, number, USD}", "en-US", {
      number: {
        USD: {
          style: "currency",
          currency: "USD"
        }
      }
    })
    return msg.format({ cost })
  }

  formattedSecondsBetweenBlocks = () => {
    let seconds =
      this.state && this.props.meanNetworkSecondsBetweenBlocks
        ? this.props.meanNetworkSecondsBetweenBlocks
        : 0
    const msg = new IntlMessageFormat("{seconds, number}", "en-US", {
      number: {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    })
    return msg.format({ seconds })
  }

  handleSubmit(event) {
    console.log("Form submitted: " + this.state)
    event.preventDefault()
  }

  static async getInitialProps(context: MyNextContext): Promise<MyProps> {
    let baseUrl = buildBaseUrlForApi(context.req)
    console.log("baseUrl:", baseUrl)
    //console.log("ZCashReader:", await ZCashReader.newestBlock())
    return {
      meanNetworkSecondsBetweenBlocks: await fetchMeanTimeBetweenBlocks(
        context.req,
        coinFromQuery(context.query)
      )
      //,networkHashesPerSecond: await Estimator.estimateNetworkHashRate(ZCashReader.newestBlock())
    }
  }

  buildOptions() {
    /*
    let opt: EstimateFutureEarningsOptions = {
      electricityCostKwh: 0.11,
      feesAsPercent: 0.01,
      fiatPerCoinsExchangeRate: 115,
      meanNetworkSecondsBetweenBlocks: ...fetch,
      networkHashesPerSecond: ...fetch,
      networkHashRateChangePerDay: ...fetch,
      rewardedCoinsPerMinedBlock: 10,
      timeHorizonInDays: -input-,
      watts: -input-,
      yourHashesPerSecond: -input-
    }
    return opt
    */
  }
}

export default withRouter<MyProps, MyQuery>(MyPage)
