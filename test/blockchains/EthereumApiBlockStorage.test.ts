/**
 * reward constants are:
 *  FrontierBlockReward       = big.NewInt(5e+18) // Block reward in wei for successfully mining a block
 *  ByzantiumBlockReward      = big.NewInt(3e+18) // Block reward in wei for successfully mining a block upward from Byzantium
 *  ConstantinopleBlockReward = big.NewInt(2e+18) // Block reward in wei for successfully mining a block upward from Constantinople
 * https://github.com/ethereum/go-ethereum/blob/616cf782036de06e8f9795e4c8782363c7de9898/consensus/ethash/consensus.go#L41
 * Values are in wei (http://www.ethdocs.org/en/latest/ether.html?highlight=wei)
 * Block numbers for Byzantium, Constantinople at https://github.com/ethereum/go-ethereum/blob/ecb781297bfc891f4ff26bdf3fda362744bbb3e3/params/config.go#L35
 * Note that Petersburg doesn't impact block reward: https://github.com/ethereum/EIPs/blob/e2561233569c4c312a5b53849e1df5aacd9260f6/EIPS/eip-1716.md
 */
