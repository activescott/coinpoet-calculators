import * as BbPromise from 'bluebird'
import * as _fs from 'fs'
import * as path from 'path'
import { fetch as _realFetch } from 'cross-fetch'
import * as _ from 'lodash'
import Diag from '../src/lib/Diag'
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
  async createMockData (fromUrls: string[], overwrite = false) {
    console.log('writing test data. overwrite=', overwrite, '. url count:', _.size(fromUrls))
    // respect 10rps:
    const MAXRPS = 8
    const interval = 1000 / MAXRPS
    let delay = 0
    for (let url of fromUrls) {
      D.log('url:', url)
      let dir = this.urlMapper(url)
      let dest = path.join(this.localDir, dir)
      let destExists
      try {
        fs.accessSync(dest, fs.constants.F_OK)
        destExists = true
      } catch (err) {
        destExists = false
      }
      D.debug('dest:', dest, '; exists:', destExists)
      if (!overwrite && destExists) {
        D.info('File', dest, 'exists. Skipping...')
        return undefined
      }
      await BbPromise.delay(interval)
      try {
        await this.download(url, dest)
      } catch (err) {
        D.error(`Error processing url ${url}:`, err)
        break
      }
    }
  }

  private async download (url, dest) {
    let response = await _realFetch(url)
    if (!response.ok) {
      throw new Error(`failed to fetch ${url}. status: ${response.status} ${response.statusText}`)
    }
    let text: string = await response.text()
    const ct = response.headers.get('content-type')
    if (ct && ct.startsWith('application/json')) {
      let j = JSON.parse(text)
      if (_.isNull(j)) {
        throw new Error(`Fetched null JSON from ${url}. status: ${response.status} ${response.statusText}`)
      }
    }
    D.info('writing', _.size(JSON.parse(text)), 'blocks to', dest)
    return fs.writeFileAsync(dest, text)
  }
}

class ResponseImpl implements FetchResponse {
  readonly localPath: string
  readonly str: string
  readonly status: number = 200
  readonly statusText: string = 'OK'
  
  constructor (localPath) {
    this.localPath = localPath
    //D.debug('fetching localPath', this.localPath)
    this.str = fs.readFileSync(this.localPath, 'utf8')
  }

  get ok () {
    return true
  }

  async json () {
    return JSON.parse(this.str)
  }
}

interface FetchResponse {
  readonly ok: boolean
  json(): Promise<any>
  readonly status: number
  readonly statusText: string
}
