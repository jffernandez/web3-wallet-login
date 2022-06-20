const appConfig = {
  apiUrl: process.env.REACT_APP_API_URL,
  chainId: process.env.REACT_APP_CHAIN_ID,
}

export function getChainId(): string | undefined {
  return appConfig.chainId
}

export function getApiUrl(): string {
  return appConfig.apiUrl ? appConfig.apiUrl : ''
}
