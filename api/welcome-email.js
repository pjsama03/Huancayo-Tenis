/* ==========================================================================
   VERCEL SERVERLESS: /api/welcome-email.js
   Correo automático de bienvenida vía Brevo API v3 (Plan Gratis S/ 0)
   - BLINDAJE DE CUOTA DIARIA: Máximo 50 correos/día (hora Perú) para
     garantizar que los otros 250 correos/día queden 100% reservados para
     recuperación de contraseñas y confirmaciones en Supabase Auth.
   - Requiere variable de entorno en Vercel: BREVO_API_KEY
   ========================================================================== */
const DAILY_WELCOME_CAP = 50;
const SENDER_EMAIL = 'soporte.totaltenis@gmail.com';
const SENDER_NAME = 'TOTAL TENIS · Circuito Oficial';
const SITE_URL = 'https://huancayo-tenis.vercel.app';

function getPeruDateKey() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildWelcomeHtml({ firstName, categoryName, points }) {
  const safeName = escapeHtml(firstName || 'Tenista');
  const safeCat = escapeHtml(categoryName || '5ª Categoría');
  const safePts = Number(points) || 1200;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a TOTAL TENIS</title>
</head>
<body style="margin:0;padding:0;background-color:#120321;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#FAF9F5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#120321;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:linear-gradient(180deg,#24093F 0%,#160428 100%);border:1px solid #3B1A5E;border-radius:22px;overflow:hidden;">
          <tr>
            <td style="padding:26px 24px 18px;text-align:center;border-bottom:1px solid rgba(250,249,245,0.1);">
              <img src="${SITE_URL}/assets/logo-total-tenis.png" alt="TOTAL TENIS" width="60" height="60" style="border-radius:50%;border:2px solid #00DC7D;display:block;margin:0 auto 12px;" />
              <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#00DC7D;text-transform:uppercase;">CIRCUITO OFICIAL DE TENIS · HUANCAYO</div>
              <h1 style="margin:8px 0 0;font-size:24px;line-height:1.15;color:#FAF9F5;">¡Bienvenido a la cancha, ${safeName}!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 24px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#E9E3F3;">
                Tu cuenta oficial en <strong>TOTAL TENIS</strong> ya está activa. Arrancas con una calibración inicial en <strong>${safeCat}</strong> (${safePts.toLocaleString('es-PE')} pts) y tus primeros <strong>5 partidos oficiales</strong> ajustarán tu nivel real en el Ranking.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:rgba(0,220,125,0.09);border:1px solid rgba(0,220,125,0.35);border-radius:14px;margin-bottom:20px;">
                <tr>
                  <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#FAF9F5;">
                    <div style="font-weight:800;color:#00DC7D;margin-bottom:6px;">TU PRIMER PARTIDO EN 3 PASOS:</div>
                    1. Entra a <strong>Retos → Lanzar Reto</strong> y elige un rival de tu rango.<br />
                    2. Acuerda sede y hora (cualquier club aliado o cancha libre).<br />
                    3. Sube el marcador al terminar: cuando tu rival confirme, suben tus puntos y Gemas en vivo.
                  </td>
                </tr>
              </table>

              <div style="text-align:center;margin:22px 0 10px;">
                <a href="${SITE_URL}" style="display:inline-block;padding:14px 28px;border-radius:14px;background-color:#00DC7D;color:#120321;font-size:14px;font-weight:900;text-decoration:none;letter-spacing:0.4px;">
                  ABRIR TOTAL TENIS AHORA
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 24px 22px;background-color:rgba(10,2,20,0.45);border-top:1px solid rgba(250,249,245,0.08);text-align:center;font-size:11px;line-height:1.5;color:#B5A9C7;">
              ¿Dudas? Escríbenos a <a href="mailto:${SENDER_EMAIL}" style="color:#00DC7D;text-decoration:none;">${SENDER_EMAIL}</a> o abre el Centro de Ayuda dentro de la app.<br />
              TOTAL TENIS · Cumplimiento Ley N° 29733 (Protección de Datos Personales) e Indecopi (Perú).
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function checkAndIncrementDailyQuota() {
  const sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const sbKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!sbUrl || !sbKey) {
    return { allowed: true, count: 1 };
  }

  const todayKey = getPeruDateKey();
  const baseHeaders = {
    apikey: sbKey,
    Authorization: `Bearer ${sbKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const getRes = await fetch(
      `${sbUrl}/rest/v1/app_settings?key=eq.brevo_welcome_quota&select=value`,
      { headers: baseHeaders }
    );
    const rows = getRes.ok ? await getRes.json() : [];
    const cur = rows?.[0]?.value || {};
    const curCount = cur.date === todayKey ? Number(cur.count) || 0 : 0;

    if (curCount >= DAILY_WELCOME_CAP) {
      return { allowed: false, count: curCount };
    }

    const nextVal = { date: todayKey, count: curCount + 1, cap: DAILY_WELCOME_CAP };
    await fetch(`${sbUrl}/rest/v1/app_settings`, {
      method: 'POST',
      headers: { ...baseHeaders, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        key: 'brevo_welcome_quota',
        value: nextVal,
        updated_at: new Date().toISOString(),
      }),
    });

    return { allowed: true, count: curCount + 1 };
  } catch {
    return { allowed: true, count: 1 };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      ok: false,
      skipped: true,
      reason: 'BREVO_API_KEY no configurada en Vercel aún.',
    });
  }

  const { email, name, categoryName, points } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ ok: false, error: 'Correo inválido.' });
  }

  // Respetar estrictamente el límite de 50/día (250/día blindados para Auth/claves)
  const quota = await checkAndIncrementDailyQuota();
  if (!quota.allowed) {
    return res.status(200).json({
      ok: false,
      skipped: true,
      reason: `Tope diario de ${DAILY_WELCOME_CAP} correos de bienvenida alcanzado (cuota de claves protegida).`,
    });
  }

  const firstName = String(name || 'Tenista').trim().split(' ')[0];

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: cleanEmail, name: String(name || firstName).trim() }],
        replyTo: { name: SENDER_NAME, email: SENDER_EMAIL },
        subject: `🎾 ¡Bienvenido a TOTAL TENIS, ${firstName}!`,
        htmlContent: buildWelcomeHtml({ firstName, categoryName, points }),
      }),
    });

    const json = await brevoRes.json().catch(() => ({}));
    if (!brevoRes.ok) {
      return res.status(200).json({ ok: false, error: json?.message || 'Error en Brevo API' });
    }

    return res.status(200).json({
      ok: true,
      messageId: json?.messageId || null,
      dailyCount: quota.count,
      dailyCap: DAILY_WELCOME_CAP,
    });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err?.message || 'Error de red' });
  }
}
