import * as BbPromise from 'bluebird'
import * as _fs from 'fs'
import * as path from 'path'
import { fetch as _realFetch } from 'cross-fetch'
import * as _ from 'lodash'
import Diag from '../src/Diag';
const fs = BbPromise.promisifyAll(_fs)

const D = new Diag('MockFetch')

/**
 * A minimal implementation of https://fetch.spec.whatwg.org for testing with local files instead of internet requests
 */
export default class MockFetch {
  readonly localDir
  readonly urlMapper
  /**
   * 
   * @param localDir A local directory to pull requests from.
   * @param urlMapper A map function that maps fetch request URL paths to its corresponding path in the local directory
   */
  constructor (localDir, urlMapper) {
    this.localDir = localDir
    this.urlMapper = urlMapper
    D.debug('Using localDir:', this.localDir)
  }
  
  async fetch (input: any, init?: any): Promise<FetchResponse> {
    // D.debug('Mapping', input, 'to...')
    let dir = this.urlMapper(input)
    // D.debug('...', input, '.')
    return new ResponseImpl(path.join(this.localDir, dir))
  }

  fetchThunk () {
    return this.fetch.bind(this)
  }

  /**
   * Creates a snapshot of live data from the specified URLs as local data for testing.
   * @param fromUrls A set of real urls to fetch the test data from
   */
  async createMockData (fromUrls: string[]) {
    console.log('writing test data')
    // respect 10rps:
    const MAXRPS = 8
    const interval = 1000 / MAXRPS
    let delay = 0
    let promises = BbPromise.map(fromUrls, async url => {
      await BbPromise.delay(delay += interval)
      console.log('url:', url)
      let response = await _realFetch(url)
      let dir = this.urlMapper(url)
      let dest = path.join(this.localDir, dir)
      console.log('writing response to', dest)
      return fs.writeFileAsync(dest, await response.text())
    })
    return await BbPromise.all(promises)
  }
}

class ResponseImpl implements FetchResponse {
  readonly localPath: string

  constructor (localPath) {
    this.localPath = localPath
  }

  get ok () {
    return true
  }

  async json () {
    D.debug('fetching localPath', this.localPath)
    let str = await fs.readFileAsync(this.localPath, 'utf8')
    // D.debug('return JSON with length', _.size(str))
    return JSON.parse(str)
  }
}

interface FetchResponse {
  readonly ok: boolean
  json(): Promise<any>
}
