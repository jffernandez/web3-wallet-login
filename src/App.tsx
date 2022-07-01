import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { AppShell, MantineProvider, ColorScheme, ColorSchemeProvider } from '@mantine/core'
import { useColorScheme } from '@mantine/hooks'
import { Chain, configureChains, createClient, WagmiConfig } from 'wagmi'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import customTheme from './theme'
import AppHeader from './components/AppHeader'
import Home from './pages/Home'
import Login from './pages/Login'

const bnbChain: Chain = {
  id: 56,
  name: 'BNB Chain',
  network: 'bnb',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: 'https://bsc-dataseed.binance.org/',
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com/' },
  },
  testnet: false,
}

const bnbTestnetChain: Chain = {
  id: 97,
  name: 'BNB Testnet Chain',
  network: 'bnb-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://testnet.bscscan.com/' },
  },
  testnet: true,
}

// Configure chains & providers
const { chains, provider } = configureChains(
  [bnbChain, bnbTestnetChain],
  [jsonRpcProvider({ rpc: (chain) => ({ http: chain.rpcUrls.default }) })],
)

// Configure wallet connectors
const connectors = [
  new MetaMaskConnector({ chains }),
  new CoinbaseWalletConnector({
    chains,
    options: {
      appName: 'Web3 Wallet Login',
    },
  }),
  new WalletConnectConnector({
    chains,
    options: {
      qrcode: true,
    },
  }),
  new InjectedConnector({
    chains,
    options: {
      name: 'Other Wallet',
      shimDisconnect: true,
    },
  }),
]

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
})

const App = () => {
  const systemColorScheme = useColorScheme()
  const [colorScheme, setColorScheme] = useState<ColorScheme>(systemColorScheme)
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'))

  useEffect(() => {
    toggleColorScheme(systemColorScheme)
  }, [systemColorScheme])

  return (
    <WagmiConfig client={wagmiClient}>
      <Router>
        <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
          <MantineProvider theme={customTheme(colorScheme)} withGlobalStyles withNormalizeCSS>
            <AppShell
              header={<AppHeader />}
              fixed
              sx={{
                height: '100vh',
              }}
            >
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/login' element={<Login />} />
                <Route path='*' element={<Home />} />
              </Routes>
            </AppShell>
          </MantineProvider>
        </ColorSchemeProvider>
      </Router>
    </WagmiConfig>
  )
}

export default App
