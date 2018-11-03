import React from "react"
import { withRouter, SingletonRouter } from "next/router"
import Layout from "../components/Layout"
import { NextContext } from "next"
import { BigNumber } from "bignumber.js"
import {
  buildBaseUrlForApi,
  coinFromQuery,
  fetchMeanTimeBetweenBlocks
} from "../lib"
import { EstimateFutureEarningsOptions } from "../../../src/Estimator"
/*
import { ZCashReader } from "../../shared/ZCashReader"
import { Estimator } from "../../../src/Estimator"
*/

interface MyQuery {}

interface MyProps {
  router?: SingletonRouter<MyQuery>
  meanNetworkSecondsBetweenBlocks: number
  //networkHashesPerSecond: BigNumber
}

interface MyState {}

type MyNextContext = NextContext<{ coin: string }>

class MyPage extends React.Component<MyProps, MyState> {
  constructor(props: MyProps) {
    super(props)
  }

  render = () => (
    <Layout>
      <p>hi futureEarnings</p>
      <p>
        meanNetworkSecondsBetweenBlocks:{" "}
        {this.props.meanNetworkSecondsBetweenBlocks}
      </p>
    </Layout>
  )

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
