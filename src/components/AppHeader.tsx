import { useState, useEffect } from 'react'
import { createStyles, Text, Group, Button, Header, Image, Dialog } from '@mantine/core'
import logo from '../assets/img/logo.png'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useNetwork, useConnect, useBalance, useDisconnect } from 'wagmi'
import { useGlobalState } from '../state'
import { ethAddressShort } from '../utils/ethAddressShort'
import { parseAuthToken } from '../utils/auth'
import { debugLog } from '../utils/log'

const DEBUG_LEVEL = 2 // 0: no debug, 1: only level 1 msgs, 2: up to level 2 msgs, 3: up to level 3 msgs ... and so on

const useStyles = createStyles((theme) => ({
  headerGroup: {
    flexFlow: 'nowrap',
    gap: '8px',
  },
  title: {
    fontFamily: theme.fontFamily,
    fontSize: '1.75em',
    fontWeight: 700,
  },
  nodecor: {
    textDecoration: 'none',
    color: 'inherit',
  },
}))

const AppHeader = () => {
  debugLog(DEBUG_LEVEL, 1, '-- AppHeader ----------------------')
  const { classes } = useStyles()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [processingLogin, setProcessingLogin] = useGlobalState('processingLogin')
  const [authToken, setAuthToken] = useGlobalState('authToken')
  const [loggedIn, setLoggedIn] = useGlobalState('loggedIn')
  const [showDialog, setShowDialog] = useState(false)

  const { name, sub: account } = parseAuthToken(authToken)

  // Web3 hooks
  const { isConnected } = useConnect()
  const { activeChain } = useNetwork()
  const {
    data: balanceData,
    isError: balanceIsError,
    isLoading: balanceIsLoading,
  } = useBalance({
    addressOrName: account,
  })
  const { disconnect } = useDisconnect()

  const handleClick = () => {
    if (loggedIn) {
      setShowDialog(!showDialog)
    } else {
      navigate('/login')
    }
  }

  useEffect(() => {
    debugLog(DEBUG_LEVEL, 1, 'AppHeader.tsx - Effect 1, called only one time')
    // load authToken from SessionStorage
    if (!authToken) {
      const token = sessionStorage.getItem('authToken')
      debugLog(DEBUG_LEVEL, 2, 'token', token)
      if (token) {
        const { sub } = parseAuthToken(token)
        if (sub) {
          setAuthToken(token)
          debugLog(DEBUG_LEVEL, 2, 'authToken restored from session storage')
        }
      }
    }
  }, [])

  useEffect(() => {
    debugLog(DEBUG_LEVEL, 1, 'AppHeader.tsx - Effect 2, called  on change of isConnected')
    debugLog(DEBUG_LEVEL, 2, 'isConnected', isConnected)
    if (!isConnected && loggedIn) {
      // Wallet got disconnected
      handleDisconnect()
    }
  }, [isConnected])

  const handleDisconnect = () => {
    if (loggedIn) {
      setShowDialog(false)
      setLoggedIn(false)
      disconnect()
      sessionStorage.removeItem('authToken')
    }
  }

  return (
    <Header height={60}>
      <Group
        style={{
          height: '100%',
          marginTop: 0,
          marginBottom: 0,
        }}
        px='lg'
        position='apart'
        align='center'
        noWrap
      >
        <Group className={classes.headerGroup}>
          <Link to={'/'}>
            <Image height={40} src={logo}></Image>
          </Link>
          <Link className={classes.nodecor} to={'/'}>
            <Text className={classes.title}>Web3 Wallet Login</Text>
          </Link>
        </Group>
        <Group>
          <Button loading={processingLogin} onClick={handleClick}>
            {loggedIn ? `${name ? name : ''} ${ethAddressShort(account)}` : t('header-login-btn')}
          </Button>
        </Group>
      </Group>
      <Dialog position={{ top: 48, right: 20 }} opened={showDialog} size='md' radius='md'>
        <Group position='center' direction='column'>
          <Text>{t('header-connected-label', { chain: activeChain?.name })}</Text>
          <Text size='xl' sx={{ fontWeight: 'bold' }}>
            {balanceData?.formatted} {balanceData?.symbol}
          </Text>
        </Group>
        <Group position='right' mt='md'>
          <Button variant='outline' onClick={handleDisconnect}>
            {t('header-disconnect-btn')}
          </Button>
        </Group>
      </Dialog>
    </Header>
  )
}

export default AppHeader
