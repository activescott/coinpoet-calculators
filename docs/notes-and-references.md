# References

- https://en.bitcoin.it/wiki/Difficulty
- http://organofcorti.blogspot.com/2014/02/917-estimating-future-bitcoin-mining.html
- Packed targets as stored in block: https://bitcoin.org/en/developer-reference#target-nbits

# Glossary

(Mostly bitcoin specific, but largely applicable to minable coins)

## Target ("Hash Target")

The target is a 256-bit unsigned integer which a header hash must be equal to or below in order for that header to be a valid part of the block chain.

## Difficulty

The current Difficulty is calculated by dividing the maximum possible **Target** (see above) by the current target:

    max_target / current_target

NOTE: `max_target` is slightly different depending on BDIFF or PDIFF (see below) as well as some testnets and other implementations will slightly change the permissable max values. I suggest looking at https://en.bitcoin.it/wiki/Difficulty primarily as it documents bitcoin core's behavior and I've found it to be reliable.

## Packed Target

Bitcoin core stores the 256-bit target in 32 bits using an scientific-notation-like format. See [bitcoin.org's nBits](https://bitcoin.org/en/developer-reference#target-nbits), [bitcoin.it's difficulty](https://en.bitcoin.it/wiki/Difficulty#How_is_difficulty_stored_in_blocks.3F) articles, and [this stackoverflow answer](https://stackoverflow.com/a/22161019/51061).

Basically it works like this... Given 32 bits like `0xFFFFFFFF`:

- high order byte (`0xFF000000`) is the number of bytes in the hash target.
- The remaining bits (`0x00FFFFFF`) are the prefix for the target.

So to get the target, take the prefix and shift it up according to the first byte.

## BDIFF ("Bitcoin Difficulty")

Basically the **Packed Target** as described above expressed as difficulty.

## PDIFF ("Pool Difficulty")

This is an accurate version of the target expressed as difficulty if there was no **Packed Target** and everything was done in 256-bit numbers only. On one hand this is "more accurate". However, the bitcoin network honors the calculated BDIFF value as that is what is stored in blockchain.
