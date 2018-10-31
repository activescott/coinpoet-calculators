import { Block, BlockStorage } from "../interfaces"

export default async function proxyBlock(
  block: Block | Promise<Block>,
  owningStorage: BlockStorage<Block>
): Promise<Block> {
  let resolvedBlock = await block
  if (resolvedBlock) {
    return {
      ...resolvedBlock,
      previous: () => owningStorage.getBlock(resolvedBlock.previousBlockHash)
    }
  } else {
    // don't turn a null/undefined value to a non-null value
    return resolvedBlock
  }
}
