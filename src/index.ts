export * from "./BitcoinDifficulty"
export * from "./Estimator"
import Diag, { LogLevel } from "./lib/Diag"
import BlockStorageFileSystem from "./blockchains/BlockStorageFileSystem"
import BlockStorageZChainApi from "./blockchains/BlockStorageZChainApi"
import LruBlockStorage from "./blockchains/LruBlockStorage"
import CompositeBlockStorage from "./blockchains/CompositeBlockStorage"
import Config from "./Config"
import BlockchainReader from "./blockchains/BlockchainReader"

Diag.Level = LogLevel.WARN

// Init ZCash chain...
const zFileStorage = new BlockStorageFileSystem(Config.zcashBlocksPath)
const zchainStorage = new LruBlockStorage(new BlockStorageZChainApi())
const zComposite = new CompositeBlockStorage(zFileStorage, zchainStorage)
export const ZCashReader = new BlockchainReader(zComposite)
