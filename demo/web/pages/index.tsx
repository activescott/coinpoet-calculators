import React from "react"
import Link from "next/link"
import Layout from "../components/Layout"

const linkStyle = {}

export default () => (
  <Layout>
    <ul>
      <li>
        <Link href="/meanTimeBetweenBlocks?coin=zcash">
          <a style={linkStyle}>ZCash: Mean Time Between Blocks</a>
        </Link>
      </li>
      <li>
        <Link href="/meanTimeBetweenBlocks?coin=bitcoin">
          <a style={linkStyle}>Bitcoin: Mean Time Between Blocks</a>
        </Link>
      </li>
      <li>
        <Link href="/futureEarnings?coin=zcash">
          <a style={linkStyle}>ZCash: Future Earnings</a>
        </Link>
      </li>
    </ul>
  </Layout>
)
