import React from "react"
import { withRouter, SingletonRouter } from "next/router"
import Head from "next/head"
import { BigNumber } from "bignumber.js"
import Form from "react-formal"
import * as yup from "yup"
import * as NProgress from "nprogress"
import vegaEmbed from "vega-embed"
import Layout from "../components/Layout"
import { DefaultPageProps, apiRequest } from "../lib"
import { EstimateFutureEarningsOptions } from "../../../dist"

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
  estimateResponse: any
}

class MyPage extends React.Component<MyProps, MyState> {
  constructor(props: MyProps) {
    super(props)
    const modelSchema = this.buildFormSchema()
    this.state = ({
      ...modelSchema.default()
    } as any) as MyState
  }

  componentDidMount = async () => {
    const json = await this.apiRequest("/fiatRate")
    this.setState({ fiatPerCoinsExchangeRate: json.value })
  }

  render = () => {
    return (
      <Layout>
        <h1>Future Earnings</h1>
        {this.renderForm()}
        {this.renderChart()}
      </Layout>
    )
  }

  renderForm = () => {
    const formStyle = {
      display: "inline-block",
      verticalAlign: "top"
    }
    const modelSchema = this.buildFormSchema()
    return (
      <Form
        style={formStyle}
        schema={modelSchema}
        value={this.state}
        onChange={form => {
          const values = form.valueOf()
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
            <Form.Field
              name="electricityCostKwh"
              className="form-control"
              step={0.01}
            />
          </label>
          <Form.Message for="electricityCostKwh" />
        </div>

        <Form.Button type="submit" className="btn btn-primary">
          Submit
        </Form.Button>
      </Form>
    )
  }

  renderChart = () => {
    const chartDivStyle = {
      display: "inline-block",
      border: "0px solid red",
      width: "800px",
      height: "600px",
      margin: "10px"
    }
    return (
      <React.Fragment>
        <Head>
          <script src="https://cdn.jsdelivr.net/npm/vega@4.3.0" key="vega" />
          <script
            src="https://cdn.jsdelivr.net/npm/vega-lite@3.0.0-rc8"
            key="vega-lite"
          />
          <script
            src="https://cdn.jsdelivr.net/npm/vega-embed@3.20.0"
            key="vega-embed"
          />
        </Head>
        <div
          id="chartttt"
          style={chartDivStyle}
          ref={divRef => {
            this.attachChartNode(divRef)
          }}
        />
      </React.Fragment>
    )
  }

  attachChartNode = async (parentNode: HTMLDivElement) => {
    if (!parentNode) {
      return
    }
    // SEE: https://vega.github.io/vega/docs/api/view/
    // TODO: Add networkHashesPerSecond as a separate layer (to separate y-axis scale): https://vega.github.io/vega-lite/docs/layer.html
    const spec = {
      $schema: "https://vega.github.io/schema/vega-lite/v3.json",
      description: "ha ha ha ha ha.",
      width: 600,
      height: 600,
      transform: [
        {
          fold: [
            "totalProfit",
            "totalRevenue",
            "totalElectricCost",
            "totalFeeCost",
            "networkHashesPerSecond"
          ]
        },
        {
          window: [
            {
              op: "last_value",
              field: "dayNumber",
              as: "lastDayNumber"
            }
          ],
          groupby: ["key"],
          frame: [null, null]
        },
        {
          calculate: "datum.lastDayNumber === datum.dayNumber",
          as: "isLastDay"
        }
      ],
      data: {
        values: null
      },
      layer: [
        {
          mark: {
            type: "line",
            style: "myLine"
          },
          transform: [
            {
              filter: {
                field: "key",
                oneOf: [
                  "totalProfit",
                  "totalRevenue",
                  "totalElectricCost",
                  "totalFeeCost"
                ]
              }
            }
          ],
          encoding: {
            x: {
              field: "dayNumber",
              type: "ordinal",
              title: "Day Number"
            },
            y: {
              field: "value",
              type: "quantitative",
              axis: {
                title: "$$"
              }
            },
            color: {
              field: "key",
              type: "nominal",
              legend: null
            }
          }
        },
        {
          mark: {
            type: "line",
            style: "myLine"
          },
          transform: [
            {
              filter: { field: "key", oneOf: ["networkHashesPerSecond"] }
            }
          ],
          encoding: {
            x: { field: "dayNumber", type: "ordinal" },
            y: {
              field: "value",
              type: "quantitative",
              axis: {
                title: "Hashes/Solutions per Second"
              }
            },
            color: {
              value: "firebrick",
              legend: null
            }
          }
        },
        {
          // this text mark is for the first set of lines on one scale.
          mark: {
            type: "text",
            style: "myLabel"
          },
          transform: [
            { filter: { field: "isLastDay", equal: true } },
            {
              filter: {
                field: "key",
                oneOf: [
                  "totalProfit",
                  "totalRevenue",
                  "totalElectricCost",
                  "totalFeeCost"
                ]
              }
            }
          ],
          encoding: {
            y: {
              field: "value",
              type: "quantitative",
              axis: null
            },
            x: { field: "dayNumber", type: "ordinal" },
            text: { field: "key", type: "ordinal" }
          }
        },
        {
          // this text mark is for the networkHashesPerSecond line on its own scale.
          mark: {
            type: "text",
            style: "myLabel"
          },
          transform: [
            { filter: { field: "isLastDay", equal: true } },
            { filter: { field: "key", oneOf: ["networkHashesPerSecond"] } }
          ],
          encoding: {
            y: {
              field: "value",
              type: "quantitative",
              axis: null
            },
            x: { field: "dayNumber", type: "ordinal" },
            text: { field: "key", type: "ordinal" }
          }
        }
      ],
      resolve: {
        scale: { y: "independent" }
      },
      config: {
        style: {
          myLabel: {
            align: "center",
            baseline: "middle",
            dy: -10
          },
          myLine: {
            strokeWidth: 5
          }
        }
      }
    } as any
    const fakeValues = [
      {
        dayNumber: 1,
        totalProfit: 0.1,
        totalRevenue: 0.31,
        totalElectricCost: 0.01,
        totalFeeCost: 0.001,
        networkHashesPerSecond: 8
      },
      {
        dayNumber: 2,
        totalProfit: 0.2,
        totalRevenue: 0.32,
        totalElectricCost: 0.03,
        totalFeeCost: 0.002,
        networkHashesPerSecond: 9
      },
      {
        dayNumber: 3,
        totalProfit: 0.36,
        totalRevenue: 0.34,
        totalElectricCost: 0.06,
        totalFeeCost: 0.003,
        networkHashesPerSecond: 10
      }
    ]
    console.log("this.state.estimateResponse:", this.state.estimateResponse)
    spec.data.values = this.state.estimateResponse
      ? this.state.estimateResponse
      : [] //fakeData
    const options = {
      renderer: "svg",
      actions: false
    }
    await vegaEmbed(parentNode, spec, options)
  }

  handleSubmit = async () => {
    let estimateOptions = await this.buildEstimateOptions()
    console.log("estimateOptions:", estimateOptions)
    let estimateResponse = await this.apiRequest(
      "/estimateFutureEarnings",
      "POST",
      estimateOptions
    )
    console.log("/estimateFutureEarnings response:", estimateResponse)
    this.setState({
      estimateResponse
    })
  }

  apiRequest = async (path, method?, body?) =>
    apiRequest(this.props.apiBaseUrl, path, method, body)

  buildEstimateOptions = async (): Promise<EstimateFutureEarningsOptions> => {
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

    Promise.all([
      networkHashesPerSecondPromise,
      meanNetworkSecondsBetweenBlocksPromise,
      networkHashRateChangePerDay
    ])
      .then(() => NProgress.done())
      .catch(() => NProgress.remove())

    const options: EstimateFutureEarningsOptions = {
      timeHorizonInDays: this.state.timeHorizonInDays,
      yourHashesPerSecond: new BigNumber(this.state.yourHashesPerSecond),
      networkHashesPerSecond: await networkHashesPerSecondPromise,
      meanNetworkSecondsBetweenBlocks: await meanNetworkSecondsBetweenBlocksPromise,
      //fiatPerCoinsExchangeRate: await fiatPerCoinsExchangeRatePromise,
      fiatPerCoinsExchangeRate: this.state.fiatPerCoinsExchangeRate,
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
        .default(90)
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
        .default(
          this.state && this.state.fiatPerCoinsExchangeRate
            ? this.state.fiatPerCoinsExchangeRate
            : 100
        )
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
