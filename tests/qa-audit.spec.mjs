import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

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
};

function addCheck(name, ok, detail = '') {
  report.checks.push({ name, ok, detail });
  if (!ok) report.bugs.push(`[FALLO] ${name}: ${detail}`);
}

function addWarning(msg) {
  report.warnings.push(msg);
}

async function dismissSplashIfPresent(page) {
  await page.waitForTimeout(1800);
  const enterBtn = page
    .locator('button:has-text("Entrar"), button:has-text("Empezar"), button:has-text("Ingresar"), button:has-text("Explorar"), button:has-text("Saltar")')
    .first();
  if (await enterBtn.isVisible().catch(() => false)) {
    await enterBtn.click().catch(() => {});
    await page.waitForTimeout(1200);
  }
  await page.waitForTimeout(2600);
}

async function inspectScreenHealth(page, screenLabel) {
  const health = await page.evaluate(() => {
    const brokenImgs = [];
    document.querySelectorAll('img').forEach((img) => {
      const style = window.getComputedStyle(img);
      const isVisible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        parseFloat(style.opacity || '1') > 0 &&
        img.getBoundingClientRect().width > 0;
      if (isVisible && (!img.complete || img.naturalWidth === 0)) {
        brokenImgs.push(img.getAttribute('src') || img.alt || 'img-sin-src');
      }
    });

    const overflowX = document.documentElement.scrollWidth - window.innerWidth;
    const themeAttr = document.documentElement.getAttribute('data-theme') || 'unknown';
    const textLen = (document.body.innerText || '').trim().length;

    return {
      brokenImgs,
      overflowX,
      themeAttr,
      textLen,
    };
  });

  if (health.textLen < 30) {
    addCheck(`Renderizado ${screenLabel}`, false, 'La pantalla parece vacía o en blanco.');
  } else {
    addCheck(`Renderizado ${screenLabel}`, true, `Tema: ${health.themeAttr}`);
  }

  if (health.brokenImgs.length > 0) {
    addCheck(
      `Imágenes rotas en ${screenLabel}`,
      false,
      `${health.brokenImgs.length} rota(s): ${health.brokenImgs.slice(0, 5).join(', ')}`
    );
  } else {
    addCheck(`Imágenes en ${screenLabel}`, true, 'Todas las imágenes visibles cargaron bien.');
  }

  if (health.overflowX > 4) {
    addWarning(`Desborde horizontal en ${screenLabel}: +${health.overflowX}px`);
  }
}

async function takeShot(page, filename, label) {
  const fullPath = path.join(SHOTS_DIR, filename);
  await page.screenshot({ path: fullPath, fullPage: false });
  report.screenshots.push({ filename, label });
}

async function clickDockTab(page, labelRegex) {
  const dockBtn = page
    .locator('nav button, .tt-dock button, [role="tablist"] button')
    .filter({ hasText: labelRegex })
    .first();
  if (await dockBtn.isVisible().catch(() => false)) {
    await dockBtn.click().catch(() => {});
    await page.waitForTimeout(900);
    return true;
  }
  return false;
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true });

  // ========================================================================
  // 1. AUDITORÍA MÓVIL IPHONE (390x844) · MODO OSCURO + SEGURIDAD VISITANTE
  // ========================================================================
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  });

  const page = await mobileCtx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('OneSignal') && !txt.includes('favicon')) {
        consoleErrors.push(txt);
      }
    }
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('onesignal') && !res.url().includes('favicon')) {
      failedRequests.push(`${res.status()} ${res.url()}`);
    }
  });

  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await dismissSplashIfPresent(page);

  const tabs = [
    { key: 'retos', regex: /Retos/i, file: '01-iphone-dark-retos.png' },
    { key: 'ranking', regex: /Ranking/i, file: '02-iphone-dark-ranking.png' },
    { key: 'torneos', regex: /Torneos/i, file: '03-iphone-dark-torneos.png' },
    { key: 'sedes', regex: /Sedes|Clubes/i, file: '04-iphone-dark-sedes.png' },
    { key: 'perfil', regex: /Perfil/i, file: '05-iphone-dark-perfil.png' },
  ];

  for (const t of tabs) {
    await clickDockTab(page, t.regex);
    await inspectScreenHealth(page, `iPhone Oscuro · ${t.key.toUpperCase()}`);
    await takeShot(page, t.file, `iPhone Oscuro - ${t.key.toUpperCase()}`);
  }

  // Verificar Modal de Torneos ("Llaves y Premios" · botones 3D Cuadro / Octavos)
  await clickDockTab(page, /Torneos/i);
  const tourneyBtn = page
    .locator('button:has-text("Llaves y Premios"), button:has-text("Ver Cuadro"), button:has-text("Cuadro")')
    .first();
  if (await tourneyBtn.isVisible().catch(() => false)) {
    await tourneyBtn.click().catch(() => {});
    await page.waitForTimeout(900);
    await takeShot(page, '06-iphone-dark-torneo-modal.png', 'iPhone Oscuro - Modal Cuadro Torneo (3D)');
    const closeModal = page.locator('.tt-modal-close, button[aria-label*="Cerrar"]').first();
    if (await closeModal.isVisible().catch(() => false)) {
      await closeModal.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  // PRUEBA DE SEGURIDAD 1: Libro de Reclamaciones SIN iniciar sesión
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
    await page.waitForTimeout(900);
    await takeShot(page, '07-iphone-seguridad-libro-visitante.png', 'Seguridad Visitante - Libro de Reclamaciones');

    const hasAuthGate = await page
      .locator('text=Inicia sesión para registrar una reclamación')
      .isVisible()
      .catch(() => false);
    const hasOpenForm = await page.locator('#tt-lr-detail').isVisible().catch(() => false);

    if (hasAuthGate && !hasOpenForm) {
      addCheck(
        'Seguridad: Libro de Reclamaciones bloqueado a visitantes',
        true,
        'Pide iniciar sesión correctamente.'
      );
    } else {
      addCheck(
        'Seguridad: Libro de Reclamaciones bloqueado a visitantes',
        false,
        'El formulario sigue abierto sin estar logueado.'
      );
    }

    const closeBtn = page.locator('.tt-modal-close, button[aria-label*="Cerrar"]').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  } else {
    addWarning('No se encontró el botón de Libro de Reclamaciones en el pie de página.');
  }

  // PRUEBA DE SEGURIDAD 2 + UX: Registro ("Género" vs "Rama") y Recuperación (buscando DENTRO del modal)
  await clickDockTab(page, /Perfil/i);
  const authBtn = page
    .locator('button:has-text("Iniciar Sesión"), button:has-text("Entrar"), button:has-text("Crear Cuenta")')
    .first();
  if (await authBtn.isVisible().catch(() => false)) {
    await authBtn.click().catch(() => {});
    await page.waitForTimeout(900);
    const authSheet = page.locator('.tt-auth-sheet-container');
    await takeShot(page, '08-iphone-auth-login.png', 'Portal de Acceso - Iniciar Sesión');

    // Probar pestaña Recuperación dentro del modal
    const forgotBtn = authSheet.locator('button:has-text("Olvidaste")').first();
    if (await forgotBtn.isVisible().catch(() => false)) {
      await forgotBtn.click().catch(() => {});
      await page.waitForTimeout(700);
      await takeShot(page, '09-iphone-auth-recuperacion.png', 'Portal de Acceso - Recuperación');
      const backBtn = authSheet.locator('.tt-auth-back-link, button:has-text("Atrás")').first();
      if (await backBtn.isVisible().catch(() => false)) {
        await backBtn.click().catch(() => {});
        await page.waitForTimeout(500);
      }
    }

    // Probar Registro DENTRO del modal y verificar etiqueta "Género" vs "Rama"
    const regBtn = authSheet.locator('button:has-text("Regístrate"), button:has-text("Crear cuenta gratis")').first();
    if (await regBtn.isVisible().catch(() => false)) {
      await regBtn.click().catch(() => {});
      await page.waitForTimeout(800);
      await takeShot(page, '10-iphone-auth-registro.png', 'Portal de Acceso - Registro');

      const bodyText = await authSheet.innerText().catch(() => '');
      const hasRama = /\bRama\b/i.test(bodyText);
      const hasGenero = /G[eé]nero/i.test(bodyText);
      if (hasGenero && !hasRama) {
        addCheck('Etiqueta Género en Registro', true, 'Muestra "Género" (Masculino / Femenino, sin "Rama").');
      } else {
        addCheck(
          'Etiqueta Género en Registro',
          false,
          `No se detectó "Género" limpio (hasGenero=${hasGenero}, hasRama=${hasRama}).`
        );
      }
    }

    const closeAuth = authSheet.locator('.tt-auth-close-x').first();
    if (await closeAuth.isVisible().catch(() => false)) {
      await closeAuth.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  // PRUEBA DE MODO CLARO EN IPHONE (abriendo menú lateral ☰ si hace falta)
  let switchedToLight = false;
  const menuBtn = page.locator('header button').first();
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click().catch(() => {});
    await page.waitForTimeout(600);
    const drawerThemeBtn = page
      .locator('button:has-text("Modo Claro"), button:has-text("Tema Claro"), button:has-text("Claro"), button[aria-label*="tema" i]')
      .first();
    if (await drawerThemeBtn.isVisible().catch(() => false)) {
      await drawerThemeBtn.click().catch(() => {});
      await page.waitForTimeout(700);
      switchedToLight = true;
    }
    const closeDrawer = page.locator('button[aria-label*="Cerrar" i], .tt-drawer-close').first();
    if (await closeDrawer.isVisible().catch(() => false)) {
      await closeDrawer.click().catch(() => {});
      await page.waitForTimeout(500);
    } else {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
    }
  }

  if (switchedToLight) {
    for (const t of tabs.slice(0, 4)) {
      await clickDockTab(page, t.regex);
      await inspectScreenHealth(page, `iPhone Claro · ${t.key.toUpperCase()}`);
      await takeShot(
        page,
        `11-iphone-light-${t.key}.png`,
        `iPhone Modo Claro - ${t.key.toUpperCase()}`
      );
    }
  } else {
    addWarning('No se pudo activar Modo Claro automáticamente desde el menú lateral.');
  }

  addCheck(
    'Consola limpia (sin errores JS en móvil)',
    consoleErrors.length === 0 && pageErrors.length === 0,
    consoleErrors.length + pageErrors.length === 0
      ? '0 errores en consola.'
      : [...pageErrors, ...consoleErrors].slice(0, 5).join(' | ')
  );

  if (failedRequests.length > 0) {
    addWarning(`Peticiones HTTP fallidas (4xx/5xx): ${failedRequests.slice(0, 6).join(' | ')}`);
  }

  await mobileCtx.close();

  // ========================================================================
  // 2. AUDITORÍA ESCRITORIO (1366x860)
  // ========================================================================
  const desktopCtx = await browser.newContext({
    viewport: { width: 1366, height: 860 },
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  });
  const dPage = await desktopCtx.newPage();
  await dPage.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await dismissSplashIfPresent(dPage);
  await inspectScreenHealth(dPage, 'Desktop · RETOS');
  await takeShot(dPage, '12-desktop-dark-retos.png', 'Desktop - Retos');
  await clickDockTab(dPage, /Torneos/i);
  await takeShot(dPage, '13-desktop-dark-torneos.png', 'Desktop - Torneos');
  await desktopCtx.close();

  await browser.close();

  // ========================================================================
  // 3. GENERAR REPORTE MARKDOWN
  // ========================================================================
  const passed = report.checks.filter((c) => c.ok).length;
  const failed = report.checks.filter((c) => !c.ok).length;

  const md = [
    `# Reporte QA Automatizado · TOTAL TENIS`,
    `- **URL auditada:** ${report.url}`,
    `- **Fecha:** ${report.timestamp}`,
    `- **Resultado:** ${passed} aprobadas · ${failed} con fallo · ${report.warnings.length} advertencias`,
    ``,
    `## Fallos detectados (${failed})`,
    failed === 0
      ? `✅ Ningún fallo crítico detectado.`
      : report.bugs.map((b) => `- ❌ ${b}`).join('\n'),
    ``,
    `## Advertencias (${report.warnings.length})`,
    report.warnings.length === 0
      ? `Sin advertencias.`
      : report.warnings.map((w) => `- ⚠️ ${w}`).join('\n'),
    ``,
    `## Detalle de pruebas (${report.checks.length})`,
    ...report.checks.map((c) => `- ${c.ok ? '✅' : '❌'} **${c.name}** — ${c.detail}`),
    ``,
    `## Capturas generadas (${report.screenshots.length})`,
    ...report.screenshots.map((s) => `- \`screenshots/${s.filename}\` — ${s.label}`),
  ].join('\n');

  fs.writeFileSync(path.join(OUT_DIR, 'QA_REPORT.md'), md, 'utf8');
  console.log(md);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n', 'utf8');
  }
}

runAudit().catch((err) => {
  console.error('Error fatal en QA Bot:', err);
  process.exit(1);
});
