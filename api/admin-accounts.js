/* ==========================================================================
   TOTAL TENIS · GESTIÓN Y RECUPERACIÓN REAL DE CUENTAS (ADMIN SERVERLESS)
   Ruta: /api/admin-accounts
   Cero librerías externas (Node 18+ fetch nativo).
   Requiere en Vercel:
     - SUPABASE_URL (o VITE_SUPABASE_URL)
     - SUPABASE_SERVICE_ROLE_KEY (llave secreta de Supabase)
     - ADMIN_MASTER_PIN (opcional, por defecto '1234')
   ========================================================================== */

const SITE_ORIGIN = 'https://huancayo-tenis.vercel.app';

function getConfig() {
  const supabaseUrl = String(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  ).replace(/\/+$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const masterPin = String(process.env.ADMIN_MASTER_PIN || '1234').trim();
  return { supabaseUrl, serviceKey, masterPin };
}

function adminHeaders(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };
}

async function fetchAuthUsers(supabaseUrl, serviceKey) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
    method: 'GET',
    headers: adminHeaders(serviceKey),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.msg || data?.message || `Error consultando Auth (${res.status})`);
  }
  return Array.isArray(data?.users) ? data.users : [];
}

async function resolveAuthUserId({ supabaseUrl, serviceKey, authId, email }) {
  if (authId) return String(authId).trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return '';
  const users = await fetchAuthUsers(supabaseUrl, serviceKey);
  const match = users.find((u) => String(u.email || '').trim().toLowerCase() === cleanEmail);
  return match?.id || '';
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const { supabaseUrl, serviceKey, masterPin } = getConfig();
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      ok: false,
      error:
        'Falta configurar SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel (Environment Variables).',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  // Validación estricta de PIN maestro Admin
  if (String(body.adminPin || '').trim() !== masterPin) {
    return res.status(401).json({ ok: false, error: 'PIN de administrador inválido.' });
  }

  const action = String(body.action || '').trim();

  try {
    /* 1. LISTAR TODOS LOS CORREOS REALES EN SUPABASE AUTH (INCLUYE HUÉRFANOS) */
    if (action === 'list_auth_users') {
      const users = await fetchAuthUsers(supabaseUrl, serviceKey);
      const mapped = users.map((u) => ({
        authId: u.id,
        email: u.email || '',
        confirmed: Boolean(u.email_confirmed_at || u.confirmed_at),
        provider: u.app_metadata?.provider || 'email',
        lastSignInAt: u.last_sign_in_at || null,
        createdAt: u.created_at || null,
      }));
      return res.status(200).json({ ok: true, users: mapped });
    }

    /* 2. ENVIAR CORREO OFICIAL DE RECUPERACIÓN DE CLAVE (USA BREVO SMTP) */
    if (action === 'send_reset_email') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return res.status(400).json({ ok: false, error: 'Correo inválido.' });
      }
      const r = await fetch(`${supabaseUrl}/auth/v1/recover`, {
        method: 'POST',
        headers: adminHeaders(serviceKey),
        body: JSON.stringify({ email, redirect_to: SITE_ORIGIN }),
      });
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(
          errData?.msg || errData?.error_description || 'No se pudo enviar el correo de recuperación.'
        );
      }
      return res.status(200).json({
        ok: true,
        message: `Correo de recuperación enviado a ${email}.`,
      });
    }

    /* 3. GENERAR ENLACE DE RECUPERACIÓN DIRECTO (PARA ENVIAR POR WHATSAPP EN 1 TOQUE) */
    if (action === 'generate_recovery_link') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return res.status(400).json({ ok: false, error: 'Correo inválido.' });
      }
      const r = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: adminHeaders(serviceKey),
        body: JSON.stringify({
          type: 'recovery',
          email,
          redirect_to: SITE_ORIGIN,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.action_link) {
        throw new Error(data?.msg || data?.message || 'No se pudo generar el enlace.');
      }
      return res.status(200).json({
        ok: true,
        actionLink: data.action_link,
      });
    }

    /* 4. CAMBIAR CORREO O CONTRASEÑA REAL DIRECTO EN AUTH + PROFILES */
    if (action === 'update_auth_account') {
      const newEmail = body.newEmail ? String(body.newEmail).trim().toLowerCase() : '';
      const newPassword = body.newPassword ? String(body.newPassword) : '';
      const profileId = String(body.profileId || '').trim();

      const resolvedAuthId = await resolveAuthUserId({
        supabaseUrl,
        serviceKey,
        authId: body.authId,
        email: body.currentEmail,
      });

      if (resolvedAuthId && (newEmail || newPassword)) {
        const patch = {};
        if (newEmail) {
          patch.email = newEmail;
          patch.email_confirm = true;
        }
        if (newPassword) {
          if (newPassword.length < 6) {
            return res.status(400).json({
              ok: false,
              error: 'La contraseña debe tener al menos 6 caracteres.',
            });
          }
          patch.password = newPassword;
        }

        const r = await fetch(
          `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(resolvedAuthId)}`,
          {
            method: 'PUT',
            headers: adminHeaders(serviceKey),
            body: JSON.stringify(patch),
          }
        );
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(data?.msg || data?.message || 'No se pudo actualizar Auth.');
        }
      }

      if (profileId && newEmail) {
        await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`,
          {
            method: 'PATCH',
            headers: adminHeaders(serviceKey),
            body: JSON.stringify({ email: newEmail }),
          }
        );
      }

      return res.status(200).json({
        ok: true,
        authUpdated: Boolean(resolvedAuthId),
        message: resolvedAuthId
          ? 'Credenciales reales actualizadas en Supabase Auth.'
          : 'Perfil actualizado (esta cuenta aún no tenía usuario en Auth).',
      });
    }

    /* 5. BORRADO TOTAL REAL (ELIMINA AUTH.USERS + PROFILES · CERO CORREOS ATRAPADOS) */
    if (action === 'delete_account_full') {
      const profileId = String(body.profileId || '').trim();
      const resolvedAuthId = await resolveAuthUserId({
        supabaseUrl,
        serviceKey,
        authId: body.authId,
        email: body.email,
      });

      let authDeleted = false;
      if (resolvedAuthId) {
        const r = await fetch(
          `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(resolvedAuthId)}`,
          {
            method: 'DELETE',
            headers: adminHeaders(serviceKey),
          }
        );
        if (r.ok || r.status === 404) {
          authDeleted = true;
        } else {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData?.msg || errData?.message || 'No se pudo eliminar en Auth.');
        }
      }

      if (profileId) {
        await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`,
          {
            method: 'DELETE',
            headers: adminHeaders(serviceKey),
          }
        );
      }

      return res.status(200).json({
        ok: true,
        authDeleted,
        profileDeleted: Boolean(profileId),
        message: authDeleted
          ? 'Cuenta eliminada completamente (Auth + Perfil). El correo quedó libre para volver a registrarse.'
          : 'Perfil eliminado de la base de datos.',
      });
    }

    return res.status(400).json({ ok: false, error: `Acción no soportada: ${action}` });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Error interno procesando la cuenta.',
    });
  }
}
