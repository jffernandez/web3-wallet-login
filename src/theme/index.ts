import { MantineThemeOverride, ColorScheme } from '@mantine/core'

const customTheme = (colorScheme?: ColorScheme): MantineThemeOverride => ({
  colorScheme,
  primaryColor: 'blue',
  defaultRadius: 'xl',
})

export default customTheme
