import {
  ZChainApiBlockStorage,
  BlockchainReader,
  LruBlockStorage,
  BlockStorageFileSystem,
  CompositeBlockStorage
} from "../../dist"
//from "coinpoet-calculators"

// Init ZCash chain...
const zFileStorage = new BlockStorageFileSystem(
  "/Users/scott/Dropbox/Backups/zcash-blocks/by-height",
  false
)
const zchainStorage = new LruBlockStorage(new ZChainApiBlockStorage())
const zComposite = new CompositeBlockStorage(zFileStorage, zchainStorage)

export const ZCashReader = new BlockchainReader(zComposite)
