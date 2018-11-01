import React from "react"
import "isomorphic-fetch"

interface DisplayFetchResultProps {
  url: string
  displayPropAccessor: (result: any) => string
  loadingText?: string
}

interface DisplayFetchResultState {
  fetchResult?: any
}

//TODO: Add a resultRenderer instead of a displayPropAccessor

/**
 * Fetches the url and displays the value of the specified prop.
 */
class DisplayFetchResult extends React.Component<
  DisplayFetchResultProps,
  DisplayFetchResultState
> {
  constructor(props: DisplayFetchResultProps, readonly _loadingText: string) {
    super(props)
    this._loadingText = props.loadingText ? props.loadingText : "Loading..."
  }

  render = () => {
    console.log(
      "fetchResult in render:",
      this.state ? this.state.fetchResult : "null"
    )
    return (
      <span>
        {this.state && this.state.fetchResult
          ? this.props.displayPropAccessor(this.state.fetchResult)
          : this._loadingText}
      </span>
    )
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
