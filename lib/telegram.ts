const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE = `https://api.telegram.org/bot${TOKEN}`;

export async function tgRequest(method: string, body: object): Promise<Response> {
  return fetch(`${BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function sendMessage(chatId: number | string, text: string, extra?: object) {
  return tgRequest('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });
}

export async function sendWebAppButton(
  chatId: number | string,
  text: string,
  buttonText: string,
  url: string
) {
  return tgRequest('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{ text: buttonText, web_app: { url } }]],
    },
  });
}

export async function setWebhook(webhookUrl: string) {
  return tgRequest('setWebhook', { url: webhookUrl });
}
