import Bowser from 'bowser'

const browser = Bowser.getParser(window.navigator.userAgent)

export function isMobile() {
  return browser.getOSName(true) === 'android' || browser.getOSName(true) === 'ios'
}

export function isChrome() {
  return browser.getBrowserName(true) === 'chrome'
}
