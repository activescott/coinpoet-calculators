import * as BbPromise from 'bluebird'
import * as _fs from 'fs'
import * as path from 'path'
import * as _ from 'lodash'
import Diag from '../src/Diag'
import { fetch } from 'cross-fetch'
const fs = BbPromise.promisifyAll(_fs)

const D = new Diag('tool')
const PAGES_DIR = path.resolve('zcash-blocks/ascending-pages')
const BLOCK_DIR = path.resolve('zcash-blocks/by-height')

async function ascendingPagesToBlocksByHeight () {
  fs.readdirAsync(PAGES_DIR)
  //.map(pageFileName => { // .map was way to slow. too many file handles open at once? Trying sequentially..
  .then(async pageFileNames => {
    for (const pageFileName of pageFileNames) {
      const pageFilePath = path.resolve(PAGES_DIR, pageFileName)
      D.log(`reading file ${pageFilePath}...`)
      await fs.readFileAsync(pageFilePath, 'utf8').then(content => {
        D.log(`reading file ${pageFilePath} complete.`)
        return JSON.parse(content) // return json is an array of blocks
      })
      .map(block => {
        //    write block to new path
        let height = block.height.toString()
        let blockFilePath = path.resolve(BLOCK_DIR, height + '.json')
        D.log(`Writing block ${height} to ${blockFilePath}...`)
        return fs.writeFileAsync(blockFilePath, JSON.stringify(block))
          .then(() => D.log(`Writing block ${height} to ${blockFilePath} complete.`))
          .catch(err => console.log('Error writing file:' + err))
      })
      .then(async blockWritingPromises => await Promise.all(blockWritingPromises))
      .catch(err => console.log('Error reading or writing file:' + err))
    }
  })
  .catch(err => console.log('Error reading dir:' + err))
}

// ascendingPagesToBlocksByHeight ()

async function testReadBlocksFromZCashRPC () {
  let url = 'http://localhost:8000'
  let body = JSON.stringify({
    id: `${Date.now()}`,
    method: 'getblockcount',
    params: []
  })
  let headers = {
    'content-type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from('activescott:123456').toString('base64'),
  }
  D.log('fetching...')
  let res = await fetch(url, { method: 'POST', body, headers })
  console.log('response:', await res.text())
}

testReadBlocksFromZCashRPC()
