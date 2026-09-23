var offerLabels = {
  audit: 'Аудит привлечения капитала',
  'capital-growth': 'Капитал Роста',
  premium: 'Личное сопровождение'
};

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildMessage(data) {
  var offer = data.offer || 'audit';
  var label = offerLabels[offer] || offer;
  var price = data.price ? ' (€' + data.price + ')' : '';

  var lines = [];
  lines.push('<b>\uD83D\uDD14 Новая заявка: ' + escapeHtml(label) + '</b>' + escapeHtml(price));
  lines.push('');
  lines.push('<b>Имя:</b> ' + escapeHtml(data.name || '—'));
  lines.push('<b>Контакт:</b> ' + escapeHtml(data.contact || '—'));
  if (data.project) lines.push('<b>Проект/сайт:</b> ' + escapeHtml(data.project));
  if (data.description) lines.push('<b>О бизнесе:</b> ' + escapeHtml(data.description));
  if (data.amount) lines.push('<b>Сумма инвестиций:</b> ' + escapeHtml(data.amount));
  lines.push('');
  lines.push('<b>Страница:</b> ' + escapeHtml(data.page || '—'));

  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
    if (data[k]) lines.push('<code>' + escapeHtml(k) + '</code>: ' + escapeHtml(data[k]));
  });

  if (data.ts) lines.push('<b>Время:</b> ' + escapeHtml(data.ts));

  return lines.join('\n');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  var token = process.env.TELEGRAM_BOT_TOKEN;
  var chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'Telegram not configured' });
  }

  var data;
  try {
    data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
  }

  try {
    var resp = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(data),
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    var json = await resp.json();
    if (!json.ok) throw new Error(JSON.stringify(json));
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ ok: false, error: 'Telegram API error: ' + err.message });
  }
};