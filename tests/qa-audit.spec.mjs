import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

/* ==========================================================================
   TOTAL TENIS · BOT QA AUTOMATIZADO PRO (PLAYWRIGHT)
   Audita:
   1. Renderizado, imágenes rotas, desbordes horizontales, recorte de texto
      y contraste de botones/pestañas en iPhone (Oscuro + Claro) y Desktop.
   2. Seguridad de visitantes (Libro de Reclamaciones bloqueado + candado
      en acciones protegidas como Retar / Inscribirse).
   3. Portal de Acceso: Login, Recuperación, Registro ("Género" sin "Rama",
      checkbox legal Indecopi desmarcado por defecto).
   4. Flujo logueado (cuando modo Beta/demo esté activo): Perfil logueado
      y verificación real del Estudio de Foto restaurado (Zoom, X/Y,
      Rotación y Silueta Editorial).
   5. Errores reales de consola JS, excepciones y URLs exactas con HTTP 4xx/5xx.
   ========================================================================== */

const TARGET_URL = process.env.QA_TARGET_URL || 'https://huancayo-tenis.vercel.app';
const OUT_DIR = path.resolve('qa-output');
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots');

fs.mkdirSync(SHOTS_DIR, { recursive: true });

const report = {
  url: TARGET_URL,
  timestamp: new Date().toISOString(),
  checks: [],
  bugs: [],
  warnings: [],
  screenshots: [],
  metrics: {
    mobileConsoleErrors: [],
    mobilePageErrors: [],
    mobileHttpFailures: [],
    desktopConsoleErrors: [],
    desktopPageErrors: [],
    desktopHttpFailures: [],
  },
};

function addCheck(category, name, ok, detail = '') {
  report.checks.push({ category, name, ok, detail });
  if (!ok) {
    report.bugs.push(`[${category}] ${name}: ${detail}`);
  }
}

function addWarning(category, msg) {
  report.warnings.push(`[${category}] ${msg}`);
}

function uniqueList(arr) {
  return Array.from(new Set(arr));
}

function isIgnoredUrl(url = '') {
  const u = String(url).toLowerCase();
  return (
    u.includes('onesignal') ||
    u.includes('favicon') ||
    u.includes('chrome-extension') ||
    u.includes('fonts.gstatic.com')
  );
}

function attachNetworkListeners(page, bucket) {
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text() || '';
    if (text.includes('OneSignal') || text.includes('favicon')) return;
    // Evitar ruido genérico cuando ya capturamos la URL exacta en response >= 400
    if (text.startsWith('Failed to load resource: the server responded with a status of')) return;
    bucket.consoleErrors.push(text.slice(0, 220));
  });

  page.on('pageerror', (err) => {
    bucket.pageErrors.push(String(err?.message || err).slice(0, 220));
  });

  page.on('response', (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && !isIgnoredUrl(url)) {
      const cleanUrl = url.replace(TARGET_URL, '');
      bucket.httpFailures.push(`${status} ${cleanUrl}`);
    }
  });
}

async function waitForUiReady(page, extraMs = 700) {
  await page
    .evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready.catch(() => {});
      }
    })
    .catch(() => {});
  await page.waitForTimeout(extraMs);
}

async function dismissSplashIfPresent(page) {
  await page.waitForTimeout(1600);
  const enterBtn = page
    .locator(
      'button:has-text("Entrar"), button:has-text("Empezar"), button:has-text("Ingresar"), button:has-text("Explorar"), button:has-text("Saltar")'
    )
    .first();
  if (await enterBtn.isVisible().catch(() => false)) {
    await enterBtn.click().catch(() => {});
    await page.waitForTimeout(900);
  }
  await page
    .waitForFunction(
      () => {
        const splash = document.querySelector('.tt-splash-overlay');
        if (!splash) return true;
        const st = window.getComputedStyle(splash);
        return st.display === 'none' || parseFloat(st.opacity || '1') < 0.1;
      },
      { timeout: 6000 }
    )
    .catch(() => {});
  await waitForUiReady(page, 600);
}

async function takeShot(page, filename, label) {
  const fullPath = path.join(SHOTS_DIR, filename);
  await page.screenshot({ path: fullPath, fullPage: false });
  report.screenshots.push({ filename, label });
}

async function closeTopModal(page) {
  const closeSelectors = [
    '.tt-auth-close-x',
    '.tt-modal-close',
    'button[aria-label*="Cerrar" i]',
  ];
  for (const sel of closeSelectors) {
    const btn = page.locator(sel).last();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(450);
      return true;
    }
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);
  return false;
}

async function clickDockTab(page, labelRegex) {
  const dockBtn = page
    .locator('nav button, .tt-dock button, .tt-bottom-dock button, [role="tablist"] button')
    .filter({ hasText: labelRegex })
    .first();
  if (await dockBtn.isVisible().catch(() => false)) {
    await dockBtn.click().catch(() => {});
    await waitForUiReady(page, 750);
    return true;
  }
  return false;
}

/* ==========================================================================
   INSPECTOR VISUAL + CONTRASTE WCAG + RECORTES + IMÁGENES ROTAS
   ========================================================================== */
async function inspectScreenHealth(page, category, screenLabel, { checkModalsOnly = false } = {}) {
  const health = await page.evaluate((modalsOnly) => {
    function parseRgb(str) {
      const m = String(str || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
      if (!m) return null;
      return {
        r: Number(m[1]),
        g: Number(m[2]),
        b: Number(m[3]),
        a: m[4] === undefined ? 1 : Number(m[4]),
      };
    }

    function luminance({ r, g, b }) {
      const toLin = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
    }

    function contrastRatio(c1, c2) {
      const l1 = luminance(c1);
      const l2 = luminance(c2);
      const hi = Math.max(l1, l2);
      const lo = Math.min(l1, l2);
      return (hi + 0.05) / (lo + 0.05);
    }

    const rootEl = modalsOnly
      ? document.querySelector('.tt-modal-card, .tt-auth-sheet-container, [role="dialog"]') || document.body
      : document.body;

    // 1. Imágenes rotas visibles
    const brokenImgs = [];
    rootEl.querySelectorAll('img').forEach((img) => {
      const st = window.getComputedStyle(img);
      const rect = img.getBoundingClientRect();
      const visible =
        st.display !== 'none' &&
        st.visibility !== 'hidden' &&
        parseFloat(st.opacity || '1') > 0.05 &&
        rect.width > 2 &&
        rect.height > 2;
      if (visible && (!img.complete || img.naturalWidth === 0)) {
        brokenImgs.push(img.getAttribute('src') || img.alt || 'img-sin-src');
      }
    });

    // 2. Desborde horizontal global
    const overflowX = Math.max(0, Math.round(document.documentElement.scrollWidth - window.innerWidth));

    // 3. Texto cortado en pestañas/botones y bajo contraste en botones sólidos
    const clippedButtons = [];
    const lowContrastButtons = [];

    rootEl.querySelectorAll('button, [role="tab"]').forEach((el) => {
      const st = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const visible =
        st.display !== 'none' &&
        st.visibility !== 'hidden' &&
        parseFloat(st.opacity || '1') > 0.2 &&
        rect.width >= 36 &&
        rect.height >= 24 &&
        rect.right > 0 &&
        rect.left < window.innerWidth &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight;
      if (!visible) return;

      const label = (el.innerText || '').replace(/\s+/g, ' ').trim();
      if (!label || label.length > 48) return;

      // Detectar recorte horizontal de texto en tabs y pills (ej. "Libro Reclamaci")
      if (
        (el.getAttribute('role') === 'tab' || /tab|pill|btn/i.test(el.className || '')) &&
        el.scrollWidth > el.clientWidth + 6 &&
        st.overflowX !== 'visible'
      ) {
        clippedButtons.push(`"${label}" (+${Math.round(el.scrollWidth - el.clientWidth)}px)`);
      }

      // Detectar contraste muy bajo en botones con color de fondo sólido (sin degradado complejo)
      const bgColor = parseRgb(st.backgroundColor);
      const fgColor = parseRgb(st.color);
      const hasGradient = (st.backgroundImage || '').includes('gradient');
      if (bgColor && fgColor && bgColor.a >= 0.85 && !hasGradient) {
        const ratio = contrastRatio(bgColor, fgColor);
        if (ratio < 2.6) {
          lowContrastButtons.push(`"${label}" (ratio ${ratio.toFixed(1)}:1)`);
        }
      }
    });

    return {
      brokenImgs: Array.from(new Set(brokenImgs)),
      overflowX,
      clippedButtons: Array.from(new Set(clippedButtons)).slice(0, 5),
      lowContrastButtons: Array.from(new Set(lowContrastButtons)).slice(0, 5),
      themeAttr: document.documentElement.getAttribute('data-theme') || 'unknown',
      textLen: (rootEl.innerText || '').trim().length,
    };
  }, checkModalsOnly);

  addCheck(
    category,
    `Renderizado ${screenLabel}`,
    health.textLen >= 25,
    health.textLen >= 25 ? `Tema activo: ${health.themeAttr}` : 'Pantalla vacía o sin contenido.'
  );

  addCheck(
    category,
    `Imágenes ${screenLabel}`,
    health.brokenImgs.length === 0,
    health.brokenImgs.length === 0
      ? 'Todas las imágenes visibles cargaron bien.'
      : `${health.brokenImgs.length} rota(s): ${health.brokenImgs.join(', ')}`
  );

  if (health.overflowX > 4) {
    addWarning(category, `Desborde horizontal en ${screenLabel}: +${health.overflowX}px`);
  }
  if (health.clippedButtons.length > 0) {
    addWarning(category, `Texto cortado en botones de ${screenLabel}: ${health.clippedButtons.join(', ')}`);
  }
  if (health.lowContrastButtons.length > 0) {
    addCheck(
      category,
      `Contraste botones ${screenLabel}`,
      false,
      `Bajo contraste detectado: ${health.lowContrastButtons.join(', ')}`
    );
  }
}

/* ==========================================================================
   CAMBIO FIABLE A MODO CLARO (PRUEBA UI DEL MENÚ ☰ + RESPALDO PERSISTENTE)
   ========================================================================== */
async function switchToLightMode(page) {
  let viaUi = false;

  const menuBtn = page.locator('header button').first();
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click().catch(() => {});
    await page.waitForTimeout(600);

    const themeToggle = page
      .locator(
        'button:has-text("Modo Claro"), button:has-text("Tema Claro"), button:has-text("Claro"), button:has-text("Apariencia"), button[aria-label*="tema" i], button[aria-label*="claro" i]'
      )
      .first();

    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click().catch(() => {});
      await page.waitForTimeout(700);
      const nowTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      if (nowTheme === 'light') viaUi = true;
    }

    await closeTopModal(page);
    await page.waitForTimeout(400);
  }

  if (!viaUi) {
    await page.evaluate(() => {
      window.localStorage.setItem('tt_theme_pref_v2', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.reload({ waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await dismissSplashIfPresent(page);
  }

  const finalTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  addCheck(
    'Modo Claro',
    'Activación de Modo Claro',
    finalTheme === 'light',
    finalTheme === 'light'
      ? viaUi
        ? 'Activado desde el menú lateral (UI).'
        : 'Activado vía preferencia localStorage (revisar etiqueta del botón en menú ☰).'
      : `Se mantuvo en tema "${finalTheme}".`
  );
  return finalTheme === 'light';
}

/* ==========================================================================
   EJECUCIÓN PRINCIPAL DE LA AUDITORÍA QA
   ========================================================================== */
async function runAudit() {
  const browser = await chromium.launch({ headless: true });

  /* ------------------------------------------------------------------------
     FASE 1 · IPHONE (390×844) · MODO OSCURO · 5 VISTAS + MODALES + SEGURIDAD
     ------------------------------------------------------------------------ */
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  });

  const page = await mobileCtx.newPage();
  const mobileNet = { consoleErrors: [], pageErrors: [], httpFailures: [] };
  attachNetworkListeners(page, mobileNet);

  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await dismissSplashIfPresent(page);

  const mainTabs = [
    { key: 'retos', regex: /Retos/i, file: '01-iphone-dark-retos.png' },
    { key: 'ranking', regex: /Ranking/i, file: '02-iphone-dark-ranking.png' },
    { key: 'torneos', regex: /Torneos/i, file: '03-iphone-dark-torneos.png' },
    { key: 'sedes', regex: /Sedes|Clubes/i, file: '04-iphone-dark-sedes.png' },
    { key: 'perfil', regex: /Perfil/i, file: '05-iphone-dark-perfil.png' },
  ];

  for (const t of mainTabs) {
    await clickDockTab(page, t.regex);
    await inspectScreenHealth(page, 'iPhone Oscuro', t.key.toUpperCase());
    await takeShot(page, t.file, `iPhone Oscuro · ${t.key.toUpperCase()}`);
  }

  // 1B. Modal de Torneo ("Llaves y Premios" · verificar 3D en Cuadro y Octavos)
  await clickDockTab(page, /Torneos/i);
  const keysBtn = page
    .locator('button:has-text("Llaves y Premios"), button:has-text("Ver Cuadro"), button:has-text("Cuadro")')
    .first();
  if (await keysBtn.isVisible().catch(() => false)) {
    await keysBtn.click().catch(() => {});
    await waitForUiReady(page, 850);
    await inspectScreenHealth(page, 'iPhone Oscuro', 'Modal Cuadro Torneo', { checkModalsOnly: true });
    await takeShot(page, '06-iphone-dark-torneo-modal.png', 'iPhone Oscuro · Modal Cuadro Torneo (3D)');
    await closeTopModal(page);
  } else {
    addWarning('iPhone Oscuro', 'No se encontró botón "Llaves y Premios" en Torneos.');
  }

  // 1C. Subpestaña Coaches en Sedes
  await clickDockTab(page, /Sedes|Clubes/i);
  const coachesTab = page.locator('button:has-text("Coaches")').first();
  if (await coachesTab.isVisible().catch(() => false)) {
    await coachesTab.click().catch(() => {});
    await waitForUiReady(page, 800);
    await inspectScreenHealth(page, 'iPhone Oscuro', 'COACHES');
    await takeShot(page, '07-iphone-dark-coaches.png', 'iPhone Oscuro · Coaches');
  }

  // 1D. Pro Shop / Tienda desde cabecera
  const shopBtn = page.locator('header button:has-text("Tienda")').first();
  if (await shopBtn.isVisible().catch(() => false)) {
    await shopBtn.click().catch(() => {});
    await waitForUiReady(page, 850);
    await inspectScreenHealth(page, 'iPhone Oscuro', 'Modal Pro Shop', { checkModalsOnly: true });
    await takeShot(page, '08-iphone-dark-proshop.png', 'iPhone Oscuro · Tienda Pro Shop');
    await closeTopModal(page);
  }

  /* ------------------------------------------------------------------------
     FASE 2 · SEGURIDAD DE VISITANTES (SIN SESIÓN INICIADA)
     ------------------------------------------------------------------------ */
  // 2A. Libro de Reclamaciones bloqueado a visitantes
  await clickDockTab(page, /Retos/i);
  await page.evaluate(() => {
    const scroller = document.querySelector('.tt-main-scroll');
    if (scroller) scroller.scrollTo(0, scroller.scrollHeight);
  });
  await page.waitForTimeout(700);

  const libroBtn = page
    .locator('button:has-text("Libro de Reclamaciones"), a:has-text("Libro de Reclamaciones")')
    .first();
  if (await libroBtn.isVisible().catch(() => false)) {
    await libroBtn.click().catch(() => {});
    await waitForUiReady(page, 850);
    await inspectScreenHealth(page, 'Seguridad', 'Libro de Reclamaciones', { checkModalsOnly: true });
    await takeShot(
      page,
      '09-iphone-seguridad-libro-visitante.png',
      'Seguridad Visitante · Libro de Reclamaciones'
    );

    const hasGate = await page
      .locator('text=Inicia sesión para registrar una reclamación')
      .isVisible()
      .catch(() => false);
    const hasForm = await page.locator('#tt-lr-detail').isVisible().catch(() => false);

    addCheck(
      'Seguridad',
      'Libro de Reclamaciones bloqueado sin sesión',
      hasGate && !hasForm,
      hasGate && !hasForm
        ? 'Bloqueo activo: exige iniciar sesión.'
        : 'ALERTA: El formulario sigue accesible sin iniciar sesión.'
    );
    await closeTopModal(page);
  } else {
    addWarning('Seguridad', 'No se encontró acceso al Libro de Reclamaciones en el pie de página.');
  }

  // 2B. Candado en acción protegida ("Retar" desde Ranking sin sesión)
  await clickDockTab(page, /Ranking/i);
  const retarBtn = page.locator('button:has-text("Retar")').first();
  if (await retarBtn.isVisible().catch(() => false)) {
    await retarBtn.click().catch(() => {});
    await waitForUiReady(page, 800);
    const authOpened = await page.locator('.tt-auth-sheet-container').isVisible().catch(() => false);
    addCheck(
      'Seguridad',
      'Acción "Retar" exige iniciar sesión',
      authOpened,
      authOpened
        ? 'Redirige correctamente al Portal de Acceso.'
        : 'No abrió el modal de login al pulsar Retar sin sesión.'
    );
    if (authOpened) await closeTopModal(page);
  }

  /* ------------------------------------------------------------------------
     FASE 3 · PORTAL DE ACCESO (LOGIN, RECUPERACIÓN, REGISTRO + "GÉNERO")
     ------------------------------------------------------------------------ */
  await clickDockTab(page, /Perfil/i);
  const openAuthBtn = page
    .locator('button:has-text("Iniciar Sesión"), button:has-text("Entrar"), button:has-text("Crear Cuenta")')
    .first();

  if (await openAuthBtn.isVisible().catch(() => false)) {
    await openAuthBtn.click().catch(() => {});
    await waitForUiReady(page, 850);

    const authSheet = page.locator('.tt-auth-sheet-container');
    await takeShot(page, '10-iphone-auth-login.png', 'Portal Acceso · Iniciar Sesión');

    // 3A. Recuperación de clave y correo
    const forgotBtn = authSheet.locator('button:has-text("Olvidaste")').first();
    if (await forgotBtn.isVisible().catch(() => false)) {
      await forgotBtn.click().catch(() => {});
      await waitForUiReady(page, 700);
      await takeShot(page, '11-iphone-auth-recuperacion.png', 'Portal Acceso · Recuperación');
      const recText = await authSheet.innerText().catch(() => '');
      const hasBothPaths =
        /Cambiar clave|Olvidé mi clave/i.test(recText) &&
        /Recordar mi correo|Olvidé mi correo/i.test(recText);
      addCheck(
        'Portal Acceso',
        'Recuperación simple (clave + correo + WhatsApp)',
        hasBothPaths,
        hasBothPaths
          ? 'Ambas pestañas de recuperación visibles.'
          : 'Falta alguna opción de recuperación en el modal.'
      );
      const backBtn = authSheet.locator('.tt-auth-back-link').first();
      if (await backBtn.isVisible().catch(() => false)) {
        await backBtn.click().catch(() => {});
        await page.waitForTimeout(500);
      }
    }

    // 3B. Registro: "Género" (sin "Rama") + Checkbox Legal desmarcado (Ley 29733)
    const regSwitch = authSheet
      .locator('button:has-text("Regístrate"), button:has-text("Crear cuenta gratis")')
      .first();
    if (await regSwitch.isVisible().catch(() => false)) {
      await regSwitch.click().catch(() => {});
      await waitForUiReady(page, 800);
      await takeShot(page, '12-iphone-auth-registro.png', 'Portal Acceso · Registro');

      const regText = await authSheet.innerText().catch(() => '');
      const hasGenero = /G[eé]nero/i.test(regText);
      const hasRama = /\bRama\b/i.test(regText);
      addCheck(
        'Portal Acceso',
        'Etiqueta "Género" en Registro (sin "Rama")',
        hasGenero && !hasRama,
        hasGenero && !hasRama
          ? 'Muestra "Género" (Masculino / Femenino) correctamente.'
          : `Encontrado: hasGenero=${hasGenero}, hasRama=${hasRama}.`
      );

      const legalBox = authSheet.locator('.tt-legal-check input[type="checkbox"]').first();
      if (await legalBox.count()) {
        const isChecked = await legalBox.isChecked().catch(() => true);
        addCheck(
          'Legal Perú',
          'Checkbox Términos/Privacidad arranca desmarcado',
          !isChecked,
          !isChecked
            ? 'Cumple Indecopi / Ley N° 29733.'
            : 'ALERTA LEGAL: El checkbox aparece pre-marcado.'
        );
      }

      // Volver a login para probar sesión demo (si está habilitada en Beta)
      const backToLogin = authSheet.locator('button:has-text("Entrar")').first();
      if (await backToLogin.isVisible().catch(() => false)) {
        await backToLogin.click().catch(() => {});
        await page.waitForTimeout(500);
      }
    }

    /* ----------------------------------------------------------------------
       FASE 4 · FLUJO LOGUEADO (PERFIL + ESTUDIO DE FOTO RESTAURADO)
       ---------------------------------------------------------------------- */
    const demoChip = authSheet.locator('.tt-demo-chip').first();
    if (await demoChip.isVisible().catch(() => false)) {
      await demoChip.click().catch(() => {});
      await waitForUiReady(page, 1300);

      await clickDockTab(page, /Perfil/i);
      await inspectScreenHealth(page, 'Usuario Logueado', 'PERFIL LOGUEADO');
      await takeShot(page, '13-iphone-dark-perfil-logueado.png', 'Usuario Logueado · Perfil');

      const camBtn = page.locator('button[aria-label*="foto" i]').first();
      if (await camBtn.isVisible().catch(() => false)) {
        await camBtn.click().catch(() => {});
        await waitForUiReady(page, 800);
        await takeShot(page, '14-iphone-dark-estudio-foto.png', 'Usuario Logueado · Estudio de Foto');

        const studioText = await page
          .locator('.tt-pf-modal-stack')
          .last()
          .innerText()
          .catch(() => '');
        const slidersCount = await page
          .locator('.tt-pf-studio-sliders input[type="range"]')
          .count()
          .catch(() => 0);
        const hasAllControls =
          slidersCount >= 4 &&
          /Zoom/i.test(studioText) &&
          /Vertical/i.test(studioText) &&
          /Horizontal/i.test(studioText) &&
          /Rotaci[oó]n/i.test(studioText) &&
          /Silueta/i.test(studioText);

        addCheck(
          'Perfil · Estudio de Foto',
          'Controles restaurados (Zoom, X/Y, Rotación, Silueta)',
          hasAllControls,
          hasAllControls
            ? `Los ${slidersCount} deslizadores y el botón de Silueta están activos.`
            : `Faltan controles en el Estudio de Foto (sliders=${slidersCount}). Sube PerfilView.jsx actualizado.`
        );
        await closeTopModal(page);
      } else {
        addWarning('Usuario Logueado', 'No se encontró el botón de cámara en el perfil logueado.');
      }
    } else {
      await closeTopModal(page);
      addWarning('Usuario Logueado', 'Cuentas demo ocultas (modo producción): se omitió prueba de Estudio de Foto.');
    }
  }

  /* ------------------------------------------------------------------------
     FASE 5 · IPHONE (390×844) · MODO CLARO (4 VISTAS CLAVE + CONTRASTE)
     ------------------------------------------------------------------------ */
  const lightOk = await switchToLightMode(page);
  if (lightOk) {
    const lightTabs = [
      { key: 'retos', regex: /Retos/i, file: '15-iphone-light-retos.png' },
      { key: 'ranking', regex: /Ranking/i, file: '16-iphone-light-ranking.png' },
      { key: 'torneos', regex: /Torneos/i, file: '17-iphone-light-torneos.png' },
      { key: 'sedes', regex: /Sedes|Clubes/i, file: '18-iphone-light-sedes.png' },
    ];
    for (const lt of lightTabs) {
      await clickDockTab(page, lt.regex);
      await inspectScreenHealth(page, 'iPhone Claro', lt.key.toUpperCase());
      await takeShot(page, lt.file, `iPhone Modo Claro · ${lt.key.toUpperCase()}`);
    }
  }

  report.metrics.mobileConsoleErrors = uniqueList(mobileNet.consoleErrors);
  report.metrics.mobilePageErrors = uniqueList(mobileNet.pageErrors);
  report.metrics.mobileHttpFailures = uniqueList(mobileNet.httpFailures);

  addCheck(
    'Salud Técnica Móvil',
    'Cero excepciones JS y errores de consola',
    report.metrics.mobileConsoleErrors.length === 0 && report.metrics.mobilePageErrors.length === 0,
    report.metrics.mobileConsoleErrors.length + report.metrics.mobilePageErrors.length === 0
      ? '0 errores JS en consola.'
      : [...report.metrics.mobilePageErrors, ...report.metrics.mobileConsoleErrors]
          .slice(0, 5)
          .join(' | ')
  );

  addCheck(
    'Salud Técnica Móvil',
    'Cero recursos rotos (HTTP 404 / 500)',
    report.metrics.mobileHttpFailures.length === 0,
    report.metrics.mobileHttpFailures.length === 0
      ? '0 peticiones fallidas.'
      : `${report.metrics.mobileHttpFailures.length} fallo(s): ${report.metrics.mobileHttpFailures
          .slice(0, 8)
          .join(' | ')}`
  );

  await mobileCtx.close();

  /* ------------------------------------------------------------------------
     FASE 6 · ESCRITORIO (1366×860) · RETOS, RANKING Y TORNEOS
     ------------------------------------------------------------------------ */
  const desktopCtx = await browser.newContext({
    viewport: { width: 1366, height: 860 },
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  });
  const dPage = await desktopCtx.newPage();
  const deskNet = { consoleErrors: [], pageErrors: [], httpFailures: [] };
  attachNetworkListeners(dPage, deskNet);

  await dPage.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await dismissSplashIfPresent(dPage);

  const desktopTabs = [
    { key: 'retos', regex: /Retos/i, file: '19-desktop-dark-retos.png' },
    { key: 'ranking', regex: /Ranking/i, file: '20-desktop-dark-ranking.png' },
    { key: 'torneos', regex: /Torneos/i, file: '21-desktop-dark-torneos.png' },
  ];

  for (const dt of desktopTabs) {
    await clickDockTab(dPage, dt.regex);
    await inspectScreenHealth(dPage, 'Desktop', dt.key.toUpperCase());
    await takeShot(dPage, dt.file, `Desktop · ${dt.key.toUpperCase()}`);
  }

  report.metrics.desktopConsoleErrors = uniqueList(deskNet.consoleErrors);
  report.metrics.desktopPageErrors = uniqueList(deskNet.pageErrors);
  report.metrics.desktopHttpFailures = uniqueList(deskNet.httpFailures);

  await desktopCtx.close();
  await browser.close();

  /* ------------------------------------------------------------------------
     FASE 7 · EXPORTAR REPORTE MARKDOWN + JSON (RESUMEN EN GITHUB ACTIONS)
     ------------------------------------------------------------------------ */
  const passed = report.checks.filter((c) => c.ok).length;
  const failed = report.checks.filter((c) => !c.ok).length;
  const scorePct = report.checks.length
    ? Math.round((passed / report.checks.length) * 100)
    : 0;

  const mdLines = [
    `# Reporte QA Automatizado Pro · TOTAL TENIS`,
    `- **URL auditada:** ${report.url}`,
    `- **Fecha (UTC):** ${report.timestamp}`,
    `- **Salud global:** **${scorePct}%** (${passed} aprobadas · ${failed} fallos · ${report.warnings.length} advertencias)`,
    ``,
    `## 1. Fallos críticos detectados (${failed})`,
    failed === 0
      ? `✅ Ningún fallo crítico detectado.`
      : report.bugs.map((b) => `- ❌ ${b}`).join('\n'),
    ``,
    `## 2. Advertencias visuales / UX (${report.warnings.length})`,
    report.warnings.length === 0
      ? `✅ Sin advertencias visuales ni de desborde.`
      : report.warnings.map((w) => `- ⚠️ ${w}`).join('\n'),
    ``,
    `## 3. Matriz completa de pruebas (${report.checks.length})`,
    `| Estado | Bloque | Prueba | Resultado |`,
    `| :--- | :--- | :--- | :--- |`,
    ...report.checks.map(
      (c) =>
        `| ${c.ok ? '✅' : '❌'} | ${c.category} | **${c.name}** | ${String(c.detail).replace(/\|/g, '/')} |`
    ),
    ``,
    `## 4. Capturas generadas (${report.screenshots.length})`,
    ...report.screenshots.map((s) => `- \`screenshots/${s.filename}\` — ${s.label}`),
  ];

  const md = mdLines.join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'QA_REPORT.md'), md, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'qa-report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log(md);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n', 'utf8');
  }
}

runAudit().catch((err) => {
  console.error('Error fatal en QA Bot:', err);
  process.exit(1);
});
