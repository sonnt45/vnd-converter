(async () => {
  const {getConfig, getExchangeRates, convert} = await import(chrome.runtime.getURL('helpers.js'));

  async function convertPrices() {
    const config = await getConfig();
    const rates = await getExchangeRates();
    const decimals = config.exchangeRateDecimalPlaces ?? 0;

    const hostname = window.location.hostname.replace('www.', '');
    const siteRules = config.sites[hostname];
    if (!siteRules) return;

    for (const rule of siteRules) {
      const elements = document.querySelectorAll(rule.selector);
      const rate = rates[rule.currency];
      if (!rate) continue;

      for (const element of elements) {
        if (element.classList.contains('vnd-converted')) continue;

        const text = element.innerText || '';
        const match = text.match(/[\d,.]+/);
        if (!match) continue;

        const num = parseFloat(match[0].replace(/,/g, ''));
        if (isNaN(num)) continue;

        const result = convert({[rule.currency]: num}, rates, decimals);
        const formatted = result[rule.currency].toLocaleString('vi-VN') + ' ₫';

        const span = document.createElement('span');
        span.className = 'vnd-value';
        span.style.color = 'green';
        span.style.fontSize = '0.9em';
        span.style.marginLeft = '4px';
        span.innerText = `(${formatted})`;

        element.appendChild(span);
        element.classList.add('vnd-converted');
      }
    }
  }

  window.addEventListener('load', async () => {
    await convertPrices();

    const observer = new MutationObserver(() => {
      convertPrices();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
