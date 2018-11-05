import React from "react"
import { withRouter, SingletonRouter } from "next/router"
import Layout from "../components/Layout"
import { NextContext } from "next"
import { BigNumber } from "bignumber.js"
import Form from "react-formal"
import * as yup from "yup"
import * as NProgress from "nprogress"
import { DefaultPageProps, apiRequest } from "../lib"
import { EstimateFutureEarningsOptions } from "../../../src/Estimator"

interface MyQuery {}

interface MyProps extends DefaultPageProps {
  router?: SingletonRouter<MyQuery>
}

interface MyState {
  electricityCostKwh: number
  fiatPerCoinsExchangeRate: number
  timeHorizonInDays: number
  watts: number
  yourHashesPerSecond: number
}

class MyPage extends React.Component<MyProps, MyState> {
  constructor(props: MyProps) {
    super(props)
    const modelSchema = this.buildFormSchema()
    this.state = ({
      ...modelSchema.default()
    } as any) as MyState
  }

  render = () => {
    const modelSchema = this.buildFormSchema()
    const form = (
      <Form
        schema={modelSchema}
        defaultValue={modelSchema.default()}
        onChange={form => {
          const values = form.valueOf()
          console.log("form change:", values)
          this.setState({ ...values })
        }}
        onSubmit={this.handleSubmit}
      >
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
            Electricity Cost ($/kWh)
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
        <h1>Future Earnings</h1>
        {form}
      </Layout>
    )
  }

  handleSubmit = async event => {
    console.log("estimateOptions:", await this.buildOptions())
  }

  apiRequest = async path => apiRequest(this.props.apiBaseUrl, path)

  buildOptions = async (): Promise<EstimateFutureEarningsOptions> => {
    NProgress.start()
    const networkHashesPerSecondPromise = this.apiRequest(
      "/estimateNetworkHashRate"
    ).then(json => {
      NProgress.inc()
      return new BigNumber(json.value)
    })
    const networkHashRateChangePerDay = this.apiRequest(
      "/estimateNetworkHashRateDailyChange"
    ).then(json => {
      NProgress.inc()
      return new BigNumber(json.value)
    })
    const meanNetworkSecondsBetweenBlocksPromise = this.apiRequest(
      "/meanTimeBetweenBlocks"
    ).then(json => {
      NProgress.inc()
      return json.value
    })
    const fiatPerCoinsExchangeRatePromise = this.apiRequest("/fiatRate").then(
      json => {
        NProgress.inc()
        return json.value
      }
    )

    Promise.all([
      networkHashesPerSecondPromise,
      meanNetworkSecondsBetweenBlocksPromise,
      fiatPerCoinsExchangeRatePromise,
      networkHashRateChangePerDay
    ])
      .then(() => NProgress.done())
      .catch(() => NProgress.remove())

    const options: EstimateFutureEarningsOptions = {
      timeHorizonInDays: this.state.timeHorizonInDays,
      yourHashesPerSecond: new BigNumber(this.state.yourHashesPerSecond),
      networkHashesPerSecond: await networkHashesPerSecondPromise,
      meanNetworkSecondsBetweenBlocks: await meanNetworkSecondsBetweenBlocksPromise,
      fiatPerCoinsExchangeRate: await fiatPerCoinsExchangeRatePromise,
      // TODO: fetch (static ok for now)
      rewardedCoinsPerMinedBlock: 10, // is actually 12.5, but 2.5 is "founder reward"
      watts: this.state.watts,
      electricityCostKwh: this.state.electricityCostKwh,
      networkHashRateChangePerDay: await networkHashRateChangePerDay,
      // TODO: FORM
      feesAsPercent: 0.0
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
