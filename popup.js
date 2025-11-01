import {getConfig, resetConfig, getExchangeRates, refreshExchangeRates} from './helpers.js';

async function render() {
  const container = document.getElementById('rates');
  container.innerHTML = '';

  const config = await getConfig();
  const storedRates = await getExchangeRates();

  document.getElementById('refresh-period').value = config.exchangeRateRefreshPeriod ?? '';
  document.getElementById('decimal-places').value = config.exchangeRateDecimalPlaces ?? 0;

  for (const { currency, fixedRate } of config.exchangeRates) {
    const currentRate = storedRates[currency]
      ? storedRates[currency].toLocaleString('vi-VN') + ' ₫'
      : 'N/A';

    const div = document.createElement('div');
    div.className = 'rate-row';
    div.innerHTML =
      '<div>' +
      `<label>${currency}</label>` +
      `<span class="current-rate">Hiện tại: ${currentRate}</span>` +
      '</div>' +
      `<input id="rate-${currency}" class="fixed-rate" type="number" placeholder="Tự động" value="${fixedRate ?? ''}"/>`;

    container.appendChild(div);
  }
}

document.getElementById('save-btn').addEventListener('click', async () => {
  const config = await getConfig();

  config.exchangeRates = config.exchangeRates.map((item) => {
    const input = document.getElementById(`rate-${item.currency}`);
    const value = input.value.trim();
    return {
      ...item,
      fixedRate: value ? parseFloat(value) : null
    };
  });

  const refreshPeriod = parseFloat(document.getElementById('refresh-period').value);
  const decimalPlaces = parseInt(document.getElementById('decimal-places').value);

  if (!isNaN(refreshPeriod)) config.exchangeRateRefreshPeriod = refreshPeriod;
  if (!isNaN(decimalPlaces)) config.exchangeRateDecimalPlaces = decimalPlaces;

  await chrome.storage.local.set({ userConfig: config });
  await refreshExchangeRates();

  alert('Đã lưu cấu hình!');
});

document.getElementById('reset-btn').addEventListener('click', async () => {
  if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ cấu hình về mặc định không?')) {
    await resetConfig();
    await refreshExchangeRates();

    alert('Đã đặt lại cấu hình về mặc định!');
    location.reload();
  }
});

render();
