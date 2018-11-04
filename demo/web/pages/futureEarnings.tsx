import React from "react"
import { withRouter, SingletonRouter } from "next/router"
import Layout from "../components/Layout"
import { NextContext } from "next"
import { BigNumber } from "bignumber.js"
import IntlMessageFormat from "intl-messageformat"
import Form from "react-formal"
import * as yup from "yup"

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
    const modelSchema = this.buildFormSchema()
    const form = (
      <Form schema={modelSchema} defaultValue={modelSchema.default()}>
        <div className="form-group">
          <label>
            Time Horizon
            <Form.Field name="timeHorizonInDays" className="form-control" />
          </label>
          <Form.Message for="timeHorizonInDays" />
        </div>

        <div className="form-group">
          <label>
            Your Hashes Per Second
            <Form.Field name="yourHashesPerSecond" className="form-control" />
          </label>
          <Form.Message for="yourHashesPerSecond" />
        </div>

        <div className="form-group">
          <label>
            Watts
            <Form.Field name="watts" className="form-control" />
          </label>
          <Form.Message for="watts" />
        </div>

        <div className="form-group">
          <label>
            Fiat Exchange Rate
            <Form.Field
              name="fiatPerCoinsExchangeRate"
              className="form-control"
            />
          </label>
          <Form.Message for="fiatPerCoinsExchangeRate" />
        </div>

        <div className="form-group">
          <label>
            Electricity Cost (kWh)
            <Form.Field name="electricityCostKwh" className="form-control" />
          </label>
          <Form.Message for="electricityCostKwh" />
        </div>

        <Form.Button type="submit" className="btn btn-primary">
          Submit
        </Form.Button>
      </Form>
    )
    return (
      <Layout>
        <p>hi futureEarnings</p>
        {form}
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

  buildOptions(): EstimateFutureEarningsOptions {
    const options: EstimateFutureEarningsOptions = {
      // TODO: FORM
      timeHorizonInDays: null,
      // TODO: FORM
      yourHashesPerSecond: new BigNumber(290),
      // TODO: FETCH
      networkHashesPerSecond: new BigNumber(492451309),
      // TODO: FETCH
      meanNetworkSecondsBetweenBlocks: 147.29166,
      // static; future fetch.
      rewardedCoinsPerMinedBlock: 10, // is actually 12.5, but 2.5 is "founder reward"
      // TODO: FETCH
      fiatPerCoinsExchangeRate: 241.23,
      // TODO: FORM
      watts: 190,
      // TODO: FORM
      electricityCostKwh: 0.1,
      // TODO: FETCH
      networkHashRateChangePerDay: new BigNumber(0),
      // TODO: FORM
      feesAsPercent: 0.01
    }
    return options
  }

  buildFormSchema() {
    return yup.object({
      timeHorizonInDays: yup
        .number()
        .default(7)
        .label("Time Horizon for how far out to estimate earnings")
        .required(
          "please provide a time horizon for how far out to estimate earnings"
        )
        .positive(),
      yourHashesPerSecond: yup
        .number()
        .default(280)
        .label("Your hash rate in GigaHashes per second")
        .required()
        .positive(),
      watts: yup
        .number()
        .default(150)
        .label("Your hash rate in GigaHashes per second")
        .required()
        .positive(),
      fiatPerCoinsExchangeRate: yup
        .number()
        .default(150) // TODO: FETCH!
        .label("Fiat Exchange Rate")
        .required(
          "Please enter Fiat Exchange Rate (the exchange rate between ZCash and your fiat currency)"
        ),
      electricityCostKwh: yup
        .number()
        .default(0.11)
        .label("Electricity Cost")
    })
  }
}

export default withRouter<MyProps, MyQuery>(MyPage)
