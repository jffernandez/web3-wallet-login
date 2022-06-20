export function debugLog(debugLevel: number, msgLevel: number, ...args: any) {
  if (msgLevel <= debugLevel) {
    console.log(...args)
  }
}
