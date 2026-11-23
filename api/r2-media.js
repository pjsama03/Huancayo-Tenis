import crypto from 'node:crypto';

/* ==========================================================================
   ENDPOINT SERVERLESS: /api/r2-media.js (CLOUDFLARE R2 · ZERO DEPENDENCIES)
   - Subida directa Celular -> R2 con Presigned PUT (expira en 120s)
   - Freno duro anti-factura en 8.5 GB (cuota gratuita real R2 = 10 GB)
   - Cuotas por plan (COACH: 4 x 25MB | CLUB: 2 x 40MB) + borrado real
   ========================================================================== */
const HARD_LIMIT_BYTES = Math.floor(8.5 * 1024 * 1024 * 1024); // 8.5 GB tope seguro
const PLAN_LIMITS = {
  COACH: { maxVideos: 4, maxBytes: 25 * 1024 * 1024 },
  CLUB: { maxVideos: 2, maxBytes: 40 * 1024 * 1024 },
};
const ALLOWED_MIME = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

function getR2Config() {
  const accountId = String(process.env.R2_ACCOUNT_ID || '').trim().replace(/^https?:\/\//, '').split('.')[0];
  const accessKeyId = String(process.env.R2_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = String(process.env.R2_SECRET_ACCESS_KEY || '').trim();
  const bucket = String(process.env.R2_BUCKET_NAME || 'total-tenis-media').trim();
  const publicUrl = String(process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

function rfc3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodeKeyPath(key) {
  return String(key)
    .split('/')
    .map((seg) => rfc3986(seg))
    .join('/');
}

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function getSigningKey(secretKey, dateStamp) {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, 'auto');
  const kService = hmac(kRegion, 's3');
  return hmac(kService, 'aws4_request');
}

function getAmzDates() {
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

async function signedR2Fetch(cfg, method, canonicalUri, queryParams = {}) {
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const { amzDate, dateStamp } = getAmzDates();
  const payloadHash = sha256Hex('');

  const sortedQuery = Object.keys(queryParams)
    .filter((k) => queryParams[k] !== undefined && queryParams[k] !== '')
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(String(queryParams[k]))}`)
    .join('&');

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalReq = `${method}\n${canonicalUri}\n${sortedQuery}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256Hex(canonicalReq)}`;
  const signature = crypto.createHmac('sha256', getSigningKey(cfg.secretAccessKey, dateStamp)).update(stringToSign).digest('hex');

  const url = `https://${host}${canonicalUri}${sortedQuery ? `?${sortedQuery}` : ''}`;
  return fetch(url, {
    method,
    headers: {
      Host: host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  });
}

async function listBucketTotalBytes(cfg) {
  let totalBytes = 0;
  let objectCount = 0;
  let token = '';
  let pages = 0;

  while (pages < 10) {
    pages += 1;
    const res = await signedR2Fetch(cfg, 'GET', `/${rfc3986(cfg.bucket)}`, {
      'list-type': '2',
      'continuation-token': token || undefined,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`R2 ListObjects error (${res.status}): ${txt.slice(0, 160)}`);
    }
    const xml = await res.text();
    const sizeMatches = xml.matchAll(/<Size>(\d+)<\/Size>/g);
    for (const m of sizeMatches) {
      totalBytes += Number(m[1]) || 0;
      objectCount += 1;
    }
    const isTruncated = /<IsTruncated>true<\/IsTruncated>/i.test(xml);
    const nextMatch = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
    if (isTruncated && nextMatch?.[1]) {
      token = nextMatch[1].replace(/&amp;/g, '&');
    } else {
      break;
    }
  }

  return { totalBytes, objectCount };
}

function buildPresignedPutUrl(cfg, objectKey, contentType, sizeBytes, expiresSec = 120) {
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const { amzDate, dateStamp } = getAmzDates();
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const canonicalUri = `/${rfc3986(cfg.bucket)}/${encodeKeyPath(objectKey)}`;
  const signedHeaders = 'content-length;content-type;host';

  const queryParams = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${cfg.accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresSec),
    'X-Amz-SignedHeaders': signedHeaders,
  };

  const canonicalQuery = Object.keys(queryParams)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(queryParams[k])}`)
    .join('&');

  const canonicalHeaders = `content-length:${sizeBytes}\ncontent-type:${contentType}\nhost:${host}\n`;
  const canonicalReq = `PUT\n${canonicalUri}\n${canonicalQuery}\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256Hex(canonicalReq)}`;
  const signature = crypto.createHmac('sha256', getSigningKey(cfg.secretAccessKey, dateStamp)).update(stringToSign).digest('hex');

  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const cfg = getR2Config();
  if (!cfg.accountId || !cfg.accessKeyId || !cfg.secretAccessKey || !cfg.bucket || !cfg.publicUrl) {
    return res.status(500).json({ error: 'Faltan variables de entorno de Cloudflare R2 en Vercel.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const action = String(body.action || '').toLowerCase();

    /* 1. CONSULTA DE CONSUMO REAL DEL BUCKET (PARA MONITOR ADMIN) */
    if (action === 'stats') {
      const { totalBytes, objectCount } = await listBucketTotalBytes(cfg);
      const totalMB = Number((totalBytes / (1024 * 1024)).toFixed(1));
      const pct = Math.min(100, Number(((totalBytes / HARD_LIMIT_BYTES) * 100).toFixed(1)));
      return res.status(200).json({
        ok: true,
        objectCount,
        totalBytes,
        totalMB,
        maxBytes: HARD_LIMIT_BYTES,
        maxGB: 8.5,
        pct,
        blocked: totalBytes >= HARD_LIMIT_BYTES,
      });
    }

    /* 2. FIRMAR PERMISO DE SUBIDA DIRECTA (CON FRENO 8.5 GB Y CUOTAS POR ROL) */
    if (action === 'presign') {
      const ownerType = body.ownerType === 'CLUB' ? 'CLUB' : 'COACH';
      const limits = PLAN_LIMITS[ownerType];
      const maxVideos = Math.max(1, Number(body.maxVideos) || limits.maxVideos);
      const maxBytes = Math.max(1024 * 1024, Number(body.maxBytes) || limits.maxBytes);
      const currentCount = Math.max(0, Number(body.currentCount) || 0);
      const sizeBytes = Math.floor(Number(body.sizeBytes) || 0);
      const contentType = String(body.contentType || '').toLowerCase();

      if (!ALLOWED_MIME[contentType]) {
        return res.status(400).json({ error: 'Formato no permitido. Usa video MP4, MOV o WebM.' });
      }
      if (currentCount >= maxVideos) {
        return res.status(400).json({
          error: `Alcanzaste el límite de tu plan (${maxVideos} videos). Elimina uno para subir otro.`,
        });
      }
      if (sizeBytes <= 0 || sizeBytes > maxBytes) {
        const mbLimit = Math.round(maxBytes / (1024 * 1024));
        return res.status(400).json({
          error: `El video supera el peso máximo permitido (${mbLimit} MB). Recórtalo o comprímelo.`,
        });
      }

      // Kill-Switch Anti-Factura: bloquea antes de llegar a los 10 GB gratuitos de R2
      const { totalBytes } = await listBucketTotalBytes(cfg);
      if (totalBytes + sizeBytes > HARD_LIMIT_BYTES) {
        return res.status(403).json({
          error: 'Espacio gratuito del servidor al límite seguro (8.5 GB). Contacta a TOTAL TENIS para ampliar plan.',
        });
      }

      const safeOwner = String(body.ownerId || 'partner')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, 40) || 'partner';
      const folder = ownerType === 'CLUB' ? 'clubs' : 'coaches';
      const ext = ALLOWED_MIME[contentType];
      const rand = crypto.randomBytes(4).toString('hex');
      const r2Key = `uploads/${folder}/${safeOwner}/${Date.now()}-${rand}.${ext}`;

      const uploadUrl = buildPresignedPutUrl(cfg, r2Key, contentType, sizeBytes, 120);
      const publicUrl = `${cfg.publicUrl}/${r2Key}`;

      return res.status(200).json({
        ok: true,
        uploadUrl,
        publicUrl,
        r2Key,
        expiresIn: 120,
      });
    }

    /* 3. BORRADO FÍSICO EN R2 (LIBERA CUOTA AL INSTANTE; PROTEGE VIDEOS BASE) */
    if (action === 'delete') {
      const r2Key = String(body.r2Key || '').trim().replace(/^\/+/, '');
      if (!r2Key.startsWith('uploads/')) {
        return res.status(200).json({ ok: true, skipped: true });
      }
      const delRes = await signedR2Fetch(cfg, 'DELETE', `/${rfc3986(cfg.bucket)}/${encodeKeyPath(r2Key)}`);
      if (!delRes.ok && delRes.status !== 404) {
        return res.status(502).json({ error: `No se pudo borrar de R2 (${delRes.status}).` });
      }
      return res.status(200).json({ ok: true, deleted: true });
    }

    return res.status(400).json({ error: 'Acción inválida.' });
  } catch (err) {
    console.error('[api/r2-media]', err);
    return res.status(500).json({ error: err?.message || 'Error interno en el servidor multimedia.' });
  }
}
