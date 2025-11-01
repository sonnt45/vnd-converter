import {getConfig, refreshExchangeRates} from './helpers.js';

chrome.runtime.onInstalled.addListener(async () => {
  await refreshExchangeRates();

  const config = await getConfig();
  const minutes = config.exchangeRateRefreshPeriod || 60;

  if (chrome.alarms) {
    chrome.alarms.create('refreshExchangeRates', {periodInMinutes: minutes});
  } else {
    console.warn('chrome.alarms not available — extension context might be wrong.');
  }
});

chrome.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refreshExchangeRates') refreshExchangeRates();
});
