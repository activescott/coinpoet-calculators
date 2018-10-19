'use strict'
import * as BbPromise from 'bluebird'
import * as path from 'path'
import { URL } from 'url'
import * as _ from 'lodash'
import MockFetch from '../test-tools/MockFetch'
import Diag, { LogLevel } from '../src/lib/Diag'
import { fetch } from 'cross-fetch'
import * as _fs from 'fs'
import Config from '../Config'
import { mkdir } from './fsutil'

const fs: any = BbPromise.promisifyAll(_fs)

const D = new Diag('genTestDataZcash')

Diag.Level = LogLevel.DEBUG

function localDirMapper (urlInput) {
  const u = new URL(urlInput)
  return `offset=${u.searchParams.get('offset')}.json`
}

function* xrange (start, stop, step=1) {
  for (let i = start; i < stop; i += step) {
    yield i
  }
}

async function getBlockCount() {
  let json = await rpcRequest('getblockcount')
  return json.result
}

async function rpcRequest(method: string, ...params) {
  params = params || []
  let resp = await fetch('http://localhost:8000/', 
  {
    body: JSON.stringify({"jsonrpc": "1.0", "method": method, "params": params }),
    headers: {
      'content-type': 'text/plain',
      'Authorization': 'Basic ' + Buffer.from('activescott:123456').toString('base64')
    },
    method: 'POST'
  })
  return resp.json()
}

async function getBlockHeaderFromHeight(height: number) {
  let json = await rpcRequest('GetBlockHash'.toLocaleLowerCase(), height)
  let hash = json.result
  json = await rpcRequest('GetBlockHeader'.toLocaleLowerCase(), hash)
  const header = json.result
  return header
}


const localDir = Config.zcashBlocksPath
const indexDir = path.join(localDir, 'blockhash-to-height-index')

/**
 * Downloads data from the RPC endpoint/API on a ZCash node and puts it in the configured directory.
 */
async function DOWNLOAD_RPC_TEST_DATA() {
  try {
    console.log('Getting current blockheight')
    let max_block_height = (await getBlockCount()) - 1
    let height = 0
    let pendingPromises = []
    const BATCH_SIZE = 15
    while (height < max_block_height) {
      let dest = path.join(localDir, `${height}.json`)
      if (!fs.existsSync(dest)) {
        console.log('Fetching header at height', height)
        const headerPromise = getBlockHeaderFromHeight(height)
        headerPromise.then(header => {
          console.log('Writing header to file', dest)
          return fs.writeFileAsync(dest, JSON.stringify(header)).then(() => header)
        })
        .then(header => {
          return addIndexFile(header)
        })
        .catch(err => {
          console.log('There was an error writing block?', err)
          process.exit(10)
        })
        pendingPromises.push(headerPromise)
      } else {
        console.log(`File ${dest} exists. Skipping...`)
      }
      height++
      if (height % BATCH_SIZE == 0) {
        if (pendingPromises.length > 0) {
          console.log(`Awaiting ${pendingPromises.length} promises...`)
          await BbPromise.all(pendingPromises)
          pendingPromises = []
        }
        if (height + BATCH_SIZE >= max_block_height) {
          console.log('Fetching fresh block count')
          max_block_height = await getBlockCount()
        }
      }
    }
  } catch (err) {
    console.log('There was an error fetching or writing the block:', err)
    process.exit(20)
  }
}

/**
 * Saves an blockHash -> height index in a subfolder
 */
async function updateBlockhashIndex () {  
  mkdir(indexDir)
  D.log('Getting list of block files...')
  const blockFiles = await fs.readdirAsync(localDir)
  D.log('Getting list of block files complete.')
  const maxPending = 50
  let pending = []
  for (let f of blockFiles) {
    let blockPath, block, dest
    try {
      if (_.includes(['.', '..'], f))
        continue
      blockPath = path.join(localDir, f)
      if (fs.statSync(blockPath).isDirectory())
        continue
      block = await loadBlockFile(blockPath)
      if (!block) {
        throw new Error(`Fund undefined block in file ${blockPath}`)
      }
    } catch (err) {
      throw new Error(`Error loading block from path '${blockPath}':` + err.message)
    }
    pending.push(addIndexFile(block))
    if (pending.length >= maxPending) {
      console.log(`Awaiting ${pending.length} pending index writes`)
      await BbPromise.all(pending)
      pending = []
    }
  }
  console.log(`Awaiting ${pending.length} pending index writes`)
  await BbPromise.all(pending)
}

async function addIndexFile (block) {
  if (!block)
    throw new Error('block must be provided')
  let dest
  try {
    dest = path.join(indexDir, block.hash)
    if (fs.existsSync(dest)) {
      D.log('Skipping existing index file', dest)
      return
    }
    D.log(`Writing index for ${block.hash} -> ${block.height}`)
    return fs.writeFileAsync(dest, block.height.toString())
  } catch (err) {
    throw new Error(`Error writing file ${dest}:` + err.message)
  }
}

async function loadBlockFile (filePath): Promise<any> {
  let str
  try {
    str = await fs.readFileAsync(filePath)
  } catch (err) {
    D.error(`Error reading file ${filePath}: ${err.message}`)
    throw err
  }
  let json
  try {
    json = JSON.parse(str)
  } catch (err) {
    D.error(`Error parsing json in file ${filePath}: ${err.message}`)
    throw err
  }
  return json
}

DOWNLOAD_RPC_TEST_DATA().then(() => updateBlockhashIndex())




