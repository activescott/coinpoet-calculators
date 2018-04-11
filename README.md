# coinpoet-cryptocurrency-mining-estimators
A library to make various estimates related mining cryptocurrency including time to mine blocks and projecting future difficulty.

# Todo / Roadmap
+ (difficulty) -> hash_target
+ (hash_target) -> difficulty
+ (difficulty, hash_rate) => estimate time to mine block
+ (difficulty, hash_rate, pool_fees, other_fees) => estimate roi
  + In Estimator.
+ Predict future network hash rate (NHR) and factor that in over a time horizon.
  + Predict future NHR:
- ZCash support for estimation
  - By pulling in chainwork and block time from z.chain api
    - GetNetworkHashPS at https://github.com/zcash/zcash/blob/master/src/rpcmining.cpp#L40 (basically workdiff over 17 blocks)
  + Mock data for ZChain API
  - impl and test Estimator.estimateDailyChangeInNetworkHashRateZCash

- Ethereum Support
  - https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getblockbyhash
  - Difficulty is stored in block as "hashes" such that hashes/seconds == hashs per second hashrate - https://ethereum.stackexchange.com/questions/29784/what-is-the-unit-for-measuring-difficulty
- Ethereum Classic
- Bitcoin Support (good for testing and comparing to many other tools out there)
- BitcoinGold Support
- Monero Support
  - Note no chainWork: https://getmonero.org/resources/developer-guides/daemon-rpc.html#getlastblockheader
    - This is perfectly fine since we only care about the relative change in chainWork between two blocks. So we can read a subset of the block chain to determine this. Just start the first one with chainWork=difficulty
    - NOTE: Monero calculates difficulty for each block based on the most recent 720 blocks existing difficulty and block time.
  - Difficulty calculations in tests at https://github.com/monero-project/monero/tree/36241552b56b156c08319935baf7afda12deb3c5/tests/difficulty
  - Actuall difficulty calc: https://github.com/monero-project/monero/blob/36241552b56b156c08319935baf7afda12deb3c5/src/cryptonote_basic/difficulty.cpp called by difficulty_type Blockchain::get_difficulty_for_next_block(): https://github.com/monero-project/monero/blob/36241552b56b156c08319935baf7afda12deb3c5/src/cryptonote_core/blockchain.cpp#L741 WHICH calls 

- X11/Quark/Qubit/Myriad-Groestl ??
- Popular ethos coins:
  |ETH |144  |
  |null|55   |
  |ZEC |23   |
  |ETC |9    |
  |ETN |9    |
  |XMR |9    |
  |ZEN |5    |
  |BTCZ|5    |
  |ZCL |4    |
  |BTG |3    |


# References
- https://en.bitcoin.it/wiki/Difficulty
- http://organofcorti.blogspot.com/2014/02/917-estimating-future-bitcoin-mining.html
- Packed targets as stored in block: https://bitcoin.org/en/developer-reference#target-nbits


# Glossary
(Mostly bitcoin specific, but largely applicable to minable coins)

## Target ("Hash Target") ##
The target is a 256-bit unsigned integer which a header hash must be equal to or below in order for that header to be a valid part of the block chain.

## Difficulty ##
The current Difficulty is calculated by dividing the maximum possible **Target** (see above) by the current target:

    max_target / current_target

NOTE: `max_target` is slightly different depending on BDIFF or PDIFF (see below) as well as some testnets and other implementations will slightly change the permissable max values. I suggest looking at https://en.bitcoin.it/wiki/Difficulty primarily as it documents bitcoin core's behavior and I've found it to be reliable.

## Packed Target ##
Bitcoin core stores the 256-bit target in 32 bits using an scientific-notation-like format. See [bitcoin.org's nBits](https://bitcoin.org/en/developer-reference#target-nbits), [bitcoin.it's difficulty](https://en.bitcoin.it/wiki/Difficulty#How_is_difficulty_stored_in_blocks.3F) articles, and [this stackoverflow answer](https://stackoverflow.com/a/22161019/51061).

Basically it works like this... Given 32 bits like `0xFFFFFFFF`:
* high order byte (`0xFF000000`) is the number of bytes in the hash target.
* The remaining bits (`0x00FFFFFF`) are the prefix for the target.

So to get the target, take the prefix and shift it up according to the first byte.

## BDIFF ("Bitcoin Difficulty") ##
Basically the **Packed Target** as described above expressed as difficulty.

## PDIFF ("Pool Difficulty") ##
This is an accurate version of the target expressed as difficulty if there was no **Packed Target** and everything was done in 256-bit numbers only. On one hand this is "more accurate". However, the bitcoin network honors the calculated BDIFF value as that is what is stored in blockchain.
