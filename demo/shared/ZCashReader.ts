import BlockStorageFileSystem from "../src/blockchains/BlockStorageFileSystem"
import Config from "../src/Config"
import BlockStorageZChainApi from "../src/blockchains/BlockStorageZChainApi"
import LruBlockStorage from "../src/blockchains/LruBlockStorage"
import CompositeBlockStorage from "../src/blockchains/CompositeBlockStorage"
import BlockchainReader from "../src/blockchains/BlockchainReader"

// Init ZCash chain...
const zFileStorage = new BlockStorageFileSystem(
  Config.zcashLargeTestDataPath,
  false
)
const zchainStorage = new LruBlockStorage(new BlockStorageZChainApi())
const zComposite = new CompositeBlockStorage(zFileStorage, zchainStorage)
export const ZCashReader = new BlockchainReader(zComposite)
