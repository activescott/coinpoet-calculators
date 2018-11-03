import React from "react"
import "isomorphic-fetch"

interface DisplayFetchResultProps {
  url: string
  resultRenderer: (fetchFesult: any) => JSX.Element
  loadingNode?: () => JSX.Element
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
  constructor(
    props: DisplayFetchResultProps,
    readonly _loadingNode: () => JSX.Element
  ) {
    super(props)
    this._loadingNode = props.loadingNode
      ? props.loadingNode
      : () => <span>Loading...</span>
  }

  render = () => {
    return this.state && this.state.fetchResult
      ? this.props.resultRenderer(this.state.fetchResult)
      : this._loadingNode()
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
    this.setState({ fetchResult: null })
    const res = await fetch(this.props.url)
    const fetchResult = await res.json()
    console.log("Fetching", this.props.url, "complete:", fetchResult)
    this.setState({ fetchResult })
  }
}
export default DisplayFetchResult
