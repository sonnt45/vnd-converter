const defaultConfig = {
  "exchangeRates": [
    {
      "currency": "USD",
      "fixedRate": null
    },
    {
      "currency": "CNY",
      "fixedRate": null
    }
  ],
  "exchangeRateRefreshPeriod": 30,
  "exchangeRateDecimalPlaces": 0,
  "sites": {
    "buff.163.com": [
      {
        "currency": "CNY",
        "selector": "div.list_card ul li strong.f_Strong",
        "remarks": "Card"
      },
      {
        "currency": "CNY",
        "selector": "#j_popup_item_detail div.scope-price strong.f_Strong",
        "remarks": "Inspection popup"
      },
      {
        "currency": "CNY",
        "selector": "div.market-list div.detail-header div.detail-summ strong.f_Strong",
        "remarks": "List header"
      },
      {
        "currency": "CNY",
        "selector": "table.list_tb tr td strong.f_Strong",
        "remarks": "List row"
      }
    ],
    "tradeit.gg": [
      {
        "currency": "USD",
        "selector": "div.inventory-card div.item-cell div.price div",
        "remarks": "Card"
      }
    ]
  }
};

export async function getConfig() {
  const {userConfig} = await chrome.storage.local.get('userConfig');
  if (!userConfig) return defaultConfig;

  const mergedConfig = structuredClone(defaultConfig);

  if (userConfig.exchangeRates) {
    mergedConfig.exchangeRates = defaultConfig.exchangeRates.map((item) => {
      const override = userConfig.exchangeRates.find(u => u.currency === item.currency);
      return override ? {...item, ...override} : item;
    });
  }

  if (userConfig.exchangeRateRefreshPeriod) {
    mergedConfig.exchangeRateRefreshPeriod = userConfig.exchangeRateRefreshPeriod;
  }

  if (userConfig.exchangeRateDecimalPlaces !== undefined) {
    mergedConfig.exchangeRateDecimalPlaces = userConfig.exchangeRateDecimalPlaces;
  }

  if (userConfig.sites) {
    mergedConfig.sites = {...defaultConfig.sites, ...userConfig.sites};
  }

  return mergedConfig;
}

export async function resetConfig() {
  try {
    await chrome.storage.local.remove(['userConfig', 'exchangeRates', 'lastUpdate']);
    console.log('Configuration has been reset.');
  } catch (error) {
    console.error('Failed to reset configuration:', error);
  }
}

export async function getExchangeRates() {
  const storage = await chrome.storage.local.get('exchangeRates');
  return storage.exchangeRates || {};
}

export async function refreshExchangeRates() {
  try {
    const config = await getConfig();
    const result = {};

    for (const {currency, fixedRate} of config.exchangeRates) {
      if (fixedRate) {
        result[currency] = fixedRate;
        continue;
      }

      const response = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
      const data = await response.json();

      if (data.result === 'success' && data.rates && data.rates.VND) {
        result[currency] = data.rates.VND;
      } else {
        console.warn(`Missing VND rate for ${currency}:`, data);
      }
    }

    await chrome.storage.local.set({
      exchangeRates: result,
      lastUpdate: Date.now()
    });

    console.log('Updated exchange rates:', result);
  } catch (error) {
    console.error('Failed to update exchange rates:', error);
  }
}

export function convert(values = {}, rates = {}, decimals = 0) {
  const results = {};
  for (const [currency, amount] of Object.entries(values)) {
    const rate = rates[currency];
    if (!rate || isNaN(rate)) continue;

    const vndValue = (amount ?? 1) * rate;
    results[currency] = parseFloat(vndValue.toFixed(decimals));
  }

  return results;
}
