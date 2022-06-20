import { createStyles, Title, Text, Group } from '@mantine/core'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '../state'
import { debugLog } from '../utils/log'

const DEBUG_LEVEL = 0 // 0: no debug, 1: only level 1 msgs, 2: up to level 2 msgs, 3: up to level 3 msgs ... and so on

const useStyles = createStyles((theme) => ({
  title: {
    fontFamily: theme.fontFamily,
    fontWeight: 900,
  },

  description: {
    maxWidth: 550,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
}))

const Home = () => {
  debugLog(DEBUG_LEVEL, 1, '-- Home ---------------------------')
  // hooks
  const { classes } = useStyles()
  const { t } = useTranslation()

  // Global state
  const [authToken] = useGlobalState('authToken')
  const [loggedIn] = useGlobalState('loggedIn')

  console.log('authToken', authToken)

  return (
    <Group
      position='center'
      direction='column'
      style={{
        textAlign: 'center',
        marginTop: '2em',
      }}
    >
      <Title className={classes.title}>{t('home-title')}</Title>
      {!loggedIn && (
        <Text color='dimmed' size='lg' align='center' className={classes.description}>
          {t('home-description')}
        </Text>
      )}
      {loggedIn && (
        <>
          <Text color='dimmed' size='lg' align='center' className={classes.description}>
            {t('home-description-logged-in')}
          </Text>
        </>
      )}
    </Group>
  )
}

export default Home
