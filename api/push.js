/* ==========================================================================
   TOTAL TENIS · ENDPOINT SERVERLESS VERCEL PARA NOTIFICACIONES PUSH
   - Mantiene ONESIGNAL_REST_API_KEY protegida en el servidor (nunca en React).
   - Construye siempre URL absoluta https:// (requerido por OneSignal v16).
   - Adjunta automáticamente el logotipo oficial logo-total-tenis.png.
   ========================================================================== */

const DEFAULT_ORIGIN = 'https://huancayo-tenis.vercel.app';
const OFFICIAL_ICON_URL = `${DEFAULT_ORIGIN}/assets/logo-total-tenis.png`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', DEFAULT_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const appId =
    process.env.ONESIGNAL_APP_ID ||
    process.env.VITE_ONESIGNAL_APP_ID ||
    '48f44cfa-0872-4a85-aded-bb1e235daea7';

  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    return res.status(200).json({
      skipped: true,
      reason: 'Falta configurar ONESIGNAL_REST_API_KEY en Vercel',
    });
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const {
      targetPlayerIds = [],
      title = 'TOTAL TENIS',
      message = '',
      path = '/',
      url = '',
    } = rawBody;

    const externalIds = Array.from(
      new Set((Array.isArray(targetPlayerIds) ? targetPlayerIds : []).filter(Boolean).map(String))
    );

    const cleanMessage = String(message || '').trim();
    if (!externalIds.length || !cleanMessage) {
      return res.status(400).json({ error: 'Faltan destinatarios o mensaje' });
    }

    // OneSignal exige URL absoluta https://
    let finalUrl = DEFAULT_ORIGIN;
    if (url && /^https?:\/\//i.test(url)) {
      finalUrl = url;
    } else if (path) {
      const normalizedPath = String(path).startsWith('/') ? path : `/${path}`;
      finalUrl = `${DEFAULT_ORIGIN}${normalizedPath}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: 'push',
        include_aliases: {
          external_id: externalIds,
        },
        headings: { es: String(title || 'TOTAL TENIS'), en: String(title || 'TOTAL TENIS') },
        contents: { es: cleanMessage, en: cleanMessage },
        url: finalUrl,
        chrome_web_icon: OFFICIAL_ICON_URL,
        firefox_icon: OFFICIAL_ICON_URL,
      }),
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: data?.errors || 'OneSignal rechazó la notificación',
        data,
      });
    }

    return res.status(200).json({ ok: true, id: data?.id || null, recipients: externalIds.length });
  } catch (err) {
    const isTimeout = err?.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({
      ok: false,
      error: isTimeout ? 'Tiempo de espera agotado con OneSignal' : err?.message || 'Error interno',
    });
  }
}
