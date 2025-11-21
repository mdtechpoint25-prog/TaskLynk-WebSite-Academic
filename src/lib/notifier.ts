// Lightweight multi-channel notifier
// - In-app notifications are handled per-route where needed
// - This utility best-effort sends WhatsApp and Telegram messages when ENV is configured
// - No external SDKs; uses fetch with official HTTP endpoints

export type NotifyChannel = 'whatsapp' | 'telegram' | 'email';

interface NotifyOptions {
  title?: string;
  message: string;
}

// WhatsApp Cloud API
// Requires: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
export async function notifyWhatsApp(toE164Phone: string, opts: NotifyOptions) {
  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID; // Business phone number ID
    if (!token || !phoneNumberId) return { ok: false, skipped: true };

    const payload = {
      messaging_product: 'whatsapp',
      to: toE164Phone,
      type: 'text',
      text: { body: opts.title ? `${opts.title}\n\n${opts.message}` : opts.message },
    };

    const res = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('WhatsApp notify failed:', res.status, errText);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error('WhatsApp notify error:', e);
    return { ok: false };
  }
}

// Telegram Bot API
// Requires: TELEGRAM_BOT_TOKEN, and a chat id per user or default: TELEGRAM_DEFAULT_CHAT_ID
export async function notifyTelegram(chatId: string | undefined, opts: NotifyOptions) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const fallbackChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID;
    const finalChatId = chatId || fallbackChatId;
    if (!token || !finalChatId) return { ok: false, skipped: true };

    const text = opts.title ? `*${escapeMarkdown(opts.title)}*\n\n${escapeMarkdown(opts.message)}` : escapeMarkdown(opts.message);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: finalChatId, text, parse_mode: 'MarkdownV2' }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Telegram notify failed:', res.status, errText);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error('Telegram notify error:', e);
    return { ok: false };
  }
}

function escapeMarkdown(text: string) {
  return text.replace(/[\\_*[\]()~`>#+\-=|{}.!]/g, (m) => `\\${m}`);
}
