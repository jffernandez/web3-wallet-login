import { useState, useEffect } from 'react'
import { createStyles, Title, Text, Group, Stepper, Button } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useConnect, useAccount, useNetwork, useSignMessage, Connector } from 'wagmi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ethAddressShort } from '../utils/ethAddressShort'
import { useGlobalState } from '../state'
import { getApiUrl } from '../config'
import { composeMessage, parseAuthToken } from '../utils/auth'
import { debugLog } from '../utils/log'
import { isMobile } from '../utils'

const DEBUG_LEVEL = 0 // 0: no debug, 1: only level 1 msgs, 2: up to level 2 msgs, 3: up to level 3 msgs ... and so on
const TOKEN_EXPIRE = 1 * 60 * 60 * 1000 // 1 hour
const useStyles = createStyles((theme) => ({
  title: {
    fontFamily: theme.fontFamily,
    fontWeight: 900,
  },

  description: {
    maxWidth: 550,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
}))

const Login = () => {
  debugLog(DEBUG_LEVEL, 1, '-- Login --------------------------')
  const { classes } = useStyles()
  const { t } = useTranslation()
  // Global state
  const [processingLogin, setProcessingLogin] = useGlobalState('processingLogin')
  const [authToken, setAuthToken] = useGlobalState('authToken')
  const [loggedIn, setLoggedIn] = useGlobalState('loggedIn')

  // Local state
  const STEP_1_CONNECT = 0,
    STEP_2_AUTHENTICATE = 1,
    STEP_99_DONE = 4
  const [currentStep, setCurrentStep] = useState(STEP_1_CONNECT)
  const [selectConnector, setSelectConnector] = useState(false)
  const [nonce, setNonce] = useState<string | undefined>()
  const [showOpenOnMetaMask, setShowOpenOnMetaMask] = useState(false)

  // hooks
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Web3 hooks
  const { activeChain } = useNetwork()
  const { data: accountData } = useAccount()
  const {
    isConnected,
    activeConnector,
    isConnecting,
    pendingConnector,
    connectors,
    error: connectError,
    connect,
  } = useConnect({
    onConnect: ({ account, chain }) => {
      debugLog(DEBUG_LEVEL, 2, 'account:', account)
      debugLog(DEBUG_LEVEL, 2, 'chain:', chain)
      handleConnection(account)
    },
  })
  debugLog(DEBUG_LEVEL, 2, 'isConnected:', isConnected)
  debugLog(DEBUG_LEVEL, 2, 'isConnecting:', isConnecting)
  debugLog(DEBUG_LEVEL, 2, 'processingLogin:', processingLogin)
  debugLog(DEBUG_LEVEL, 2, 'selectConnector:', selectConnector)
  const {
    data: signData,
    error: signError,
    isLoading,
    signMessage,
  } = useSignMessage({
    onSuccess(data, variables) {
      // Signature completed
      debugLog(DEBUG_LEVEL, 2, '----- SIGNED ----')
      debugLog(DEBUG_LEVEL, 2, 'data', data)
      // send signature to API to get new authToken
      debugLog(DEBUG_LEVEL, 2, '---- api login ----')
      const apiUrl = `${getApiUrl()}auth/login/${accountData?.address}/${nonce}/${data}`
      debugLog(DEBUG_LEVEL, 2, 'apiUrl', apiUrl)
      fetch(apiUrl, { method: 'GET' })
        .then((res) => {
          if (!res.ok) {
            // error coming back from server
            throw Error('could not complete login')
          }
          return res.text()
        })
        .then(
          (result) => {
            setAuthToken(result)
            debugLog(DEBUG_LEVEL, 2, 'result', result)
            debugLog(DEBUG_LEVEL, 2, atob(result.slice(result.indexOf('.') + 1, result.lastIndexOf('.'))))
          },
          (error) => {
            debugLog(DEBUG_LEVEL, 2, 'error', error)
          },
        )
    },
  })

  useEffect(() => {
    debugLog(DEBUG_LEVEL, 1, 'Login.tsx - Effect 1, called only one time')
    let connector
    setProcessingLogin(true)
    if (searchParams.get('connector')) {
      debugLog(DEBUG_LEVEL, 2, 'connector', searchParams.get('connector'))
      connector = connectors.filter((c) => c.id === searchParams.get('connector'))
      if (connector) {
        connector = connector[0]
      }
    }
    debugLog(DEBUG_LEVEL, 2, 'connector', connector)
    initConnection(connector)
  }, [])

  const initConnection = (connector?: any) => {
    debugLog(DEBUG_LEVEL, 2, 'initConnection', connector)
    debugLog(DEBUG_LEVEL, 2, 'isConnected', isConnected)
    if (!isConnected) {
      // if there is only one connector, or one passed as parameter, starts connection,
      // otherwise, show all connectors to select one
      if (connectors.length > 1 && !connector) {
        debugLog(DEBUG_LEVEL, 2, 'show wallet connector selection')
        // show wallet connector selection
        setSelectConnector(true)
      } else {
        debugLog(DEBUG_LEVEL, 2, 'Connect to wallet')
        // Connect to wallet
        setSelectConnector(false)
        connect(!connector ? connectors[0] : connector)
      }
    } else {
      setSelectConnector(false)
      // handleConnection should be launched here, because there is not onConnect() event
      if (accountData?.address) {
        handleConnection(accountData.address)
      } else {
        // TODO: manage this error
        debugLog(DEBUG_LEVEL, 0, 'ERROR: wallet connected but no connection data can be read!??')
      }
    }
  }

  const handleConnection = (wallet: string) => {
    debugLog(DEBUG_LEVEL, 2, '---- wallet connected ----')

    setCurrentStep(STEP_2_AUTHENTICATE)

    const { sub, iat } = parseAuthToken(authToken)
    debugLog(DEBUG_LEVEL, 2, 'iat', iat, Date.now(), Date.now() - iat)

    if (wallet !== sub) {
      handleLogout()
    }

    // test if already logged-in and token is valid
    if (authToken && wallet === sub && Date.now() < iat + TOKEN_EXPIRE) {
      // we keep the existing authToken
      handleLogin(authToken)
    } else {
      // get nonce from API
      debugLog(DEBUG_LEVEL, 2, '---- get nonce ----')
      setNonce(undefined)
      const apiUrl = `${getApiUrl()}auth/nonce/${wallet}`
      debugLog(DEBUG_LEVEL, 2, 'apiUrl', apiUrl)
      fetch(apiUrl, { method: 'GET' })
        .then((res) => {
          if (!res.ok) {
            // error coming back from server
            throw Error('could not get the nonce')
          }
          return res.text()
        })
        .then(
          (result) => {
            setNonce(result)
            debugLog(DEBUG_LEVEL, 2, 'result', result, wallet)
          },
          (error) => {
            debugLog(DEBUG_LEVEL, 0, 'error', error)
          },
        )
    }
  }

  useEffect(() => {
    debugLog(DEBUG_LEVEL, 1, 'Login.tsx - Effect 2, called on change of nonce')
    if (isConnected && currentStep === STEP_2_AUTHENTICATE && nonce) {
      if (accountData?.address && nonce) {
        debugLog(DEBUG_LEVEL, 2, '----- Time to sign! -----')
        const message = composeMessage(accountData.address, nonce)
        debugLog(DEBUG_LEVEL, 2, message)
        signMessage({ message })
      }
    }
  }, [nonce])

  useEffect(() => {
    debugLog(DEBUG_LEVEL, 1, 'Login.tsx - Effect 3, called on change of authToken')
    if (isConnected && currentStep === STEP_2_AUTHENTICATE && nonce && authToken) {
      const { sub, iat } = parseAuthToken(authToken)
      debugLog(DEBUG_LEVEL, 2, 'iat', iat, Date.now(), Date.now() - iat)
      if (accountData && accountData.address === sub && iat < Date.now() + 3000) {
        handleLogin(authToken)
      } else {
        debugLog(DEBUG_LEVEL, 2, 'Login ERROR!')
        // TODO: Handle error
      }
    }
  }, [authToken])

  const handleLogout = () => {
    debugLog(DEBUG_LEVEL, 2, '---- LOGOUT ----')
    setAuthToken(undefined)
    setNonce(undefined)
    setLoggedIn(false)
    sessionStorage.removeItem('authToken')
  }

  const handleLogin = (authToken: string) => {
    debugLog(DEBUG_LEVEL, 2, '---> LOGIN <---')
    sessionStorage.setItem('authToken', authToken)
    setCurrentStep(STEP_99_DONE)
    setProcessingLogin(false)
    setLoggedIn(true)
    // navigate('/')
  }

  const handleSelectConnector = (connector: Connector) => {
    debugLog(DEBUG_LEVEL, 1, '---> Selecting ', connector.name)
    if (connector.id.toLowerCase() === 'metamask') {
      if (isMobile() && window && (!window.ethereum || !window.ethereum.isMetaMask)) {
        setShowOpenOnMetaMask(true)
      } else {
        initConnection(connector)
      }
    } else {
      initConnection(connector)
    }
  }

  // description for step 1
  let step1Description = t('login-step-1-description')
  if (currentStep > STEP_1_CONNECT) {
    step1Description = t('login-step-1-done-description', { wallet: activeConnector?.name, chain: activeChain?.name })
  }

  // description for step 2
  let step2Description = t('login-step-2-pre-description')
  if (currentStep > STEP_1_CONNECT) {
    step2Description = t('login-step-2-description')
  }
  if (currentStep > STEP_2_AUTHENTICATE) {
    step2Description = t('login-step-2-done-description', {
      account: ethAddressShort(accountData?.address || ''),
    })
  }

  return (
    <Group
      position='center'
      direction='column'
      style={{
        textAlign: 'center',
        marginTop: '2em',
        gap: '8px',
      }}
    >
      <Title className={classes.title}>{t('login-title')}</Title>
      {showOpenOnMetaMask && (
        <>
          <Text color='dimmed' size='lg' align='center' className={classes.description}>
            {t('login-open-in-metamask')}
          </Text>
          <Button
            component='a'
            href='https://metamask.app.link/dapp/web3-wallet-login.vercel.app/#/login?connector=metaMask'
          >
            {t('login-open-in-metamask-btn')}
          </Button>
        </>
      )}
      {selectConnector && !showOpenOnMetaMask && (
        <>
          <Text color='dimmed' size='lg' align='center' className={classes.description}>
            {t('login-select-connector')}
          </Text>

          {connectors.map((connector) => (
            <Button
              variant='outline'
              disabled={
                (isMobile() && connector.id != 'metaMask' && !connector.ready) || (!isMobile() && !connector.ready)
              }
              key={connector.id}
              sx={{ width: '100%', maxWidth: '300px' }}
              onClick={() => handleSelectConnector(connector)}
            >
              {connector.name}
              {((isMobile() && connector.id != 'metaMask' && !connector.ready) || (!isMobile() && !connector.ready)) &&
                ' (unsupported)'}
              {isConnecting && connector.id === pendingConnector?.id && ' (connecting)'}
            </Button>
          ))}

          {connectError && <div>{connectError.message}</div>}

          <Group grow sx={{ width: '100%', maxWidth: '300px', padding: '0 75px', marginTop: '2em' }}>
            <Button
              variant='outline'
              onClick={() => {
                navigate('/')
                location.reload()
              }}
            >
              {t('login-cancel-btn')}
            </Button>
          </Group>
        </>
      )}
      {!selectConnector && !showOpenOnMetaMask && (
        <>
          <Text color='dimmed' size='lg' align='center' className={classes.description}>
            {t('login-description')}
          </Text>
          <Stepper active={currentStep} orientation='vertical' styles={{ stepDescription: { maxWidth: '500px' } }}>
            <Stepper.Step label={t('login-step-1-label')} description={step1Description}>
              <Group grow sx={{ padding: '0 50px', marginTop: '2em', justifyContent: 'right' }}>
                <Button
                  variant='outline'
                  onClick={() => {
                    navigate('/')
                    location.reload()
                  }}
                  sx={{ maxWidth: '45%' }}
                >
                  {t('login-cancel-btn')}
                </Button>
                {!isConnecting && (
                  <Button
                    onClick={() => {
                      initConnection()
                    }}
                    sx={{ maxWidth: '45%' }}
                  >
                    {t('login-retry-btn')}
                  </Button>
                )}
              </Group>
            </Stepper.Step>
            <Stepper.Step label={t('login-step-2-label')} description={step2Description}>
              <Group grow sx={{ padding: '0 75px', marginTop: '2em', justifyContent: 'right' }}>
                <Button
                  variant='outline'
                  onClick={() => {
                    navigate('/')
                    location.reload()
                  }}
                  sx={{ maxWidth: '45%' }}
                >
                  {t('login-cancel-btn')}
                </Button>
              </Group>
            </Stepper.Step>
            <Stepper.Completed>
              <Button
                onClick={() => {
                  navigate('/')
                }}
              >
                {t('login-continue-btn')}
              </Button>
            </Stepper.Completed>
          </Stepper>
        </>
      )}
    </Group>
  )
}

export default Login
