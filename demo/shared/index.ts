import {
  ZChainApiBlockStorage,
  BlockchainReader,
  LruBlockStorage,
  BlockStorageFileSystem,
  CompositeBlockStorage,
  BitcoinApiBlockStorage
} from "../../dist/es"
//from "coinpoet-calculators"

// Init ZCash chain...
const zFileStorage = new BlockStorageFileSystem(
  "/Users/scott/Dropbox/Backups/zcash-blocks/by-height",
  false,
  ZChainApiBlockStorage.calculateRewardForBlockHeight
)
const zchainStorage = new LruBlockStorage(new ZChainApiBlockStorage())
const zComposite = new CompositeBlockStorage(zFileStorage, zchainStorage)

export const ZCashReader = new BlockchainReader(zComposite)

const bitcoinStorage = new LruBlockStorage(new BitcoinApiBlockStorage())

export const BitcoinReader = new BlockchainReader(bitcoinStorage)
