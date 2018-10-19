export * from './src/BitcoinDifficulty'
export * from './src/Estimator'
import Diag, { LogLevel } from './src/lib/Diag'

Diag.Level = LogLevel.WARN
