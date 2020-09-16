import React, { useState } from "react"
import { withRouter, SingletonRouter } from "next/router"
import Head from "next/head"
import { BigNumber } from "bignumber.js"
import * as yup from "yup"
import * as NProgress from "nprogress"
import vegaEmbed from "vega-embed"
import Layout from "../components/Layout"
import { DefaultPageProps, apiRequest as apiRequestLib } from "../lib"
import { EstimateFutureEarningsOptions } from "../../../dist/es"
import { useForm } from "react-hook-form"
import { Renderers } from "vega"

interface MyQuery {}

interface MyProps extends DefaultPageProps {
  router: SingletonRouter
}

interface MyState {
  electricityCostKwh: number
  fiatPerCoinsExchangeRate: number
  timeHorizonInDays: number
  watts: number
  yourHashesPerSecond: number
  estimateResponse: any
}

// TODO: Kill yup
const buildFormSchema = (fiatPerCoinsExchangeRate?: Number) => {
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
      .default(fiatPerCoinsExchangeRate ? fiatPerCoinsExchangeRate : 100)
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

let MyPage: any = withRouter((props: MyProps) => {
  const defaultState = buildFormSchema().default()
  const [state, setState] = useState<MyState>({
    ...defaultState,
    estimateResponse: null
  })

  const apiRequest = async (state: MyState, path, method?, body?) =>
    apiRequestLib(props.apiBaseUrl, path, method, body)

  const buildEstimateOptions = async (
    state: MyState
  ): Promise<EstimateFutureEarningsOptions> => {
    NProgress.start()
    const networkHashesPerSecondPromise = apiRequest(
      state,
      "/estimateNetworkHashRate"
    ).then(json => {
      NProgress.inc()
      return new BigNumber(json.value)
    })
    const networkHashRateChangePerDay = apiRequest(
      state,
      "/estimateNetworkHashRateDailyChange"
    ).then(json => {
      NProgress.inc()
      return new BigNumber(json.value)
    })
    const meanNetworkSecondsBetweenBlocksPromise = apiRequest(
      state,
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
      timeHorizonInDays: state.timeHorizonInDays,
      yourHashesPerSecond: new BigNumber(state.yourHashesPerSecond),
      networkHashesPerSecond: await networkHashesPerSecondPromise,
      meanNetworkSecondsBetweenBlocks: await meanNetworkSecondsBetweenBlocksPromise,
      //fiatPerCoinsExchangeRate: await fiatPerCoinsExchangeRatePromise,
      fiatPerCoinsExchangeRate: state.fiatPerCoinsExchangeRate,
      // TODO: fetch (static ok for now)
      rewardedCoinsPerMinedBlock: 10, // is actually 12.5, but 2.5 is "founder reward"
      watts: state.watts,
      electricityCostKwh: state.electricityCostKwh,
      networkHashRateChangePerDay: await networkHashRateChangePerDay,
      // TODO: FORM
      feesAsPercent: 0.0
    }
    return options
  }

  const renderForm = (
    state: MyState,
    setState: React.Dispatch<React.SetStateAction<MyState>>
  ) => {
    const formStyle = {
      display: "inline-block",
      verticalAlign: "top"
    }
    const modelSchema = buildFormSchema()
    const { register, handleSubmit } = useForm()
    return (
      <form
        style={formStyle}
        onSubmit={handleSubmit(async () => {
          let estimateOptions = await buildEstimateOptions(state)
          console.log("estimateOptions:", estimateOptions)
          let estimateResponse = await apiRequest(
            state,
            "/estimateFutureEarnings",
            "POST",
            estimateOptions
          )
          console.log("/estimateFutureEarnings response:", estimateResponse)
          setState({
            ...state,
            estimateResponse
          })
        })}
      >
        <div className="form-group">
          <label>
            Time Horizon
            <input
              name="timeHorizonInDays"
              className="form-control"
              ref={register({ required: true, min: 0 })}
              defaultValue={state.timeHorizonInDays}
            />
          </label>
          <small className="form-text text-muted">
            Time Horizon for how far out to estimate earnings
          </small>
        </div>

        <div className="form-group">
          <label>
            Your Hashes Per Second
            <input
              name="yourHashesPerSecond"
              className="form-control"
              ref={register({ required: true, min: 0 })}
              defaultValue={state.yourHashesPerSecond}
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Watts
            <input
              name="watts"
              className="form-control"
              ref={register({ required: true, min: 0 })}
              defaultValue={state.watts}
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Fiat Exchange Rate
            <input
              name="fiatPerCoinsExchangeRate"
              className="form-control"
              ref={register({ required: true, min: 0 })}
              defaultValue={state.fiatPerCoinsExchangeRate}
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Electricity Cost ($/kWh)
            <input
              name="electricityCostKwh"
              className="form-control"
              ref={register({ required: true, min: 0 })}
              defaultValue={state.electricityCostKwh}
            />
          </label>
        </div>

        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>
    )
  }

  const renderChart = (state: MyState) => {
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
            attachChartNode(divRef, state)
          }}
        />
      </React.Fragment>
    )
  }

  const attachChartNode = async (
    parentNode: HTMLDivElement,
    state: MyState
  ) => {
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
    console.log("state.estimateResponse:", state.estimateResponse)
    spec.data.values = state.estimateResponse ? state.estimateResponse : [] //fakeData
    const options = {
      renderer: "svg" as Renderers,
      actions: false
    }
    await vegaEmbed(parentNode, spec, options)
  }

  return (
    <Layout>
      <h1>Future Earnings</h1>
      {renderForm(state, setState)}
      {renderChart(state)}
    </Layout>
  )
})

export default MyPage
