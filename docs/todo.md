- publish NPM package;
  - Publish from master via travis (and use it for test)
  - Like vega-embed: https://github.com/vega/vega-embed#release-process
- prettier

- Put Diag in it's own NPM Package. Using it from several places.
  - Add tests for Diag (AVA)
  - Have Diag detect log level via environment variable like DIAG*LOG_LEVEL*<PREFIX>
  - Add time & timeEnd to Diag: https://nodejs.org/api/console.html#console_console_timelog_label_data
  - Coveralls & travis for Diag

- Put LruCache in it's own package

- Demo Fit & Finish:
  - Separate API node app from front-end app so api can be scaled seperately.
  - https://getbootstrap.com/docs/4.0/components/navbar/

- Create a cache for s3. This would make it work better in serverless environment.

- Test for LruNode.removeYourselfFromChain
+ Cleanup demo/web/pages/meanTimeBetweenBlocks.tsx (separate components, etc.)
- Test for CompositeBlockStorage usage of proxyBlock


- Ethereum Support
  - https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getblockbyhash
  - Difficulty is stored in block as "hashes" such that hashes/seconds == hashs per second hashrate - https://ethereum.stackexchange.com/questions/29784/what-is-the-unit-for-measuring-difficulty
- Ethereum Classic
- Bitcoin Support (good for testing and comparing to many other tools out there)
- Monero Support
  - Note no chainWork: https://getmonero.org/resources/developer-guides/daemon-rpc.html#getlastblockheader
    - This is perfectly fine since we only care about the relative change in chainWork between two blocks. So we can read a subset of the block chain to determine this. Just start the first one with chainWork=difficulty
    - NOTE: Monero calculates difficulty for each block based on the most recent 720 blocks existing difficulty and block time.
  - Difficulty calculations in tests at https://github.com/monero-project/monero/tree/36241552b56b156c08319935baf7afda12deb3c5/tests/difficulty
  - Actuall difficulty calc: https://github.com/monero-project/monero/blob/36241552b56b156c08319935baf7afda12deb3c5/src/cryptonote_basic/difficulty.cpp called by difficulty_type Blockchain::get_difficulty_for_next_block(): https://github.com/monero-project/monero/blob/36241552b56b156c08319935baf7afda12deb3c5/src/cryptonote_core/blockchain.cpp#L741 WHICH calls

- X11/Quark/Qubit/Myriad-Groestl ??


# Misc Factoring #
- Need a cheap way to cache arbitrary values on the server for periods of time. Like LruCache but at with time-based expirations. The hydration functions would work similarly to LruCache and could eagerly or lazily cache upon expiration. Expensive IO operations that require chain could then be easily cached.

- Start reading rewardedCoinsPerMinedBlock from chain (requires reading initial transaction from each block)
  - See https://en.bitcoin.it/wiki/Transaction#Generation
  - See https://api.zcha.in/v2/mainnet/blocks/00000000037c2a86ce03689ae0b3704f31e29104f1a37e826d8b191585c336f8/transactions?limit=10&offset=0&sort=index&direction=ascending



- Create `BlockStorage` caching implementations that can have a fallback and chained together.
+ CompositeBlockStorage -> Reads from multiple block storage implementatios falling back to the best one (the one that doesn't fail or the one with the longest chain, etc.)
  + Basic Unit Tests with two mock implementions.
  + Test with mock implementations and another (normally skipped) test with real Disk+ZChain API implementations
+ LruBlockStorage -> Least recently used block storage that caches ~5K blocks?
+ The chain for these are: Memory -> Local Disk -> ZCash Node (or zchain api)
  + Consider skipping memory and just doing local disk + rpc node or local disk + zcha.in
    + Cache blocks in memory using `height -> Block` map.
    + Cache a small number like ~7 days of blocks (576 per day ~576\*7=4K)
- ZcashNodeRpcBlockStorage - reads directly from a zcash node's RPC interface.
  - Why - Only make sense if we deploy zcash node in production


