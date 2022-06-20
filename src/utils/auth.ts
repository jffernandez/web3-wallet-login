export function parseAuthToken(authToken: string | undefined) {
  if (authToken) {
    const index1 = authToken.indexOf('.')
    const index2 = authToken.lastIndexOf('.')
    if (index1 > 15 && index2 > index1 * 2) {
      try {
        return JSON.parse(atob(authToken.slice(authToken.indexOf('.') + 1, authToken.lastIndexOf('.'))))
        // eslint-disable-next-line no-empty
      } catch (Error) {}
    }
  }
  return {}
}

export function composeMessage(address: string, nonce: string) {
  return `Welcome to Bitmon Paradise!
Please, sign this message to login.

Wallet address:
${address}
Nonce:
${nonce}`
}
