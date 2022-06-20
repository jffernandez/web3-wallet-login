import { createGlobalState } from './createGlobalState'

interface IGlobalState {
  processingLogin: boolean
  authToken: undefined | string
  loggedIn: boolean
}

// Init GlobalState
const initialState: IGlobalState = {
  processingLogin: false,
  authToken: undefined,
  loggedIn: false,
}

export const { useGlobalState } = createGlobalState(initialState)
