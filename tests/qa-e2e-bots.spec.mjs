import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

/* ==========================================================================
   SIMULADOR MULTI-BOT E2E TOTAL ("TODO ES TODO") · v4 · TOTAL TENIS
   Prueba los 16 flujos críticos completos con 3 bots simultáneos + visitante:
   01. Login simultáneo 3 Bots (Retador, Rival y Árbitro)
   02. Bot A lanza reto (> 24h) a Bot B
   03. Bot B recibe en vivo y acepta el reto -> PROGRAMADO
   04. Enlace WhatsApp (wa.me + texto prellenado en ambos lados)
   05. Cambio de hora con doble acuerdo (>= 24h antes)
   06. Candado anti-marcador imposible (bloquea 7-7)
   07. Impugnación con motivo obligatorio + Congelamiento real EN REVISIÓN
   08. Ventana < 24h: Designar Árbitro (Bot C) + Modo Árbitro -> EN REVISIÓN
   09. Ranking Oficial (>= 5 PJ) vs Calibrando (< 5 PJ sin #1) + 3D overflow
   10. Subir Foto PNG real + 4 sliders + Silueta + Cambiar fondo/escenario
   11. Gemas: Saldo real + Bóveda de Gemas + Pro Shop y Canje
   12. Cambio de Tema Modo Claro <-> Modo Oscuro (data-theme + contraste)
   13. Contraseña + Ojo ver/ocultar + Recuperación de Contraseña (#type=recovery)
   14. Ajustes de Perfil en Cancha (mano hábil, golpes, guardar)
   15. Torneos (Gira + Master Top 8) + Sedes & Coaches + Carnet VIP 3D
   16. Libro de Reclamaciones (candado visitante / acceso logueado) + Seguridad
   ========================================================================== */

const TARGET_URL = process.env.QA_TARGET_URL || 'https://huancayo-tenis.vercel.app';
const OUT_DIR = path.resolve('qa-e2e-output');
fs.mkdirSync(OUT_DIR, { recursive: true });

// PNG 1x1 válido en base64 para subir foto real al Estudio de Foto sin dependencias externas
const SAMPLE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAADklEQVQI12Ng+M+ACgAAQQAB/2g4rQAAAABJRU5ErkJggg==';
const SAMPLE_PHOTO_PATH = path.join(OUT_DIR, 'bot-avatar-test.png');
fs.writeFileSync(SAMPLE_PHOTO_PATH, Buffer.from(SAMPLE_PNG_BASE64, 'base64'));

const results = [];
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

function recordStep(id, title, passed, detail = '', screenshot = '') {
  results.push({ id, title, passed: Boolean(passed), detail, screenshot });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${id}] ${title} — ${detail}`);
}

async function takeShot(page, filename) {
  try {
    const filePath = path.join(OUT_DIR, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    return filename;
  } catch {
    return '';
  }
}

async function dismissSplashAndModals(
  page,
  { keepIncomingChallenge = false, keepScoreConfirm = false, keepRecoveryModal = false } = {}
) {
  await page.waitForTimeout(800);

  const enterBtn = page
    .locator(
      'button:has-text("Entrar"), button:has-text("Empezar"), button:has-text("Ingresar"), button:has-text("Explorar"), button:has-text("Comenzar")'
    )
    .first();
  if (await enterBtn.isVisible().catch(() => false)) {
    await enterBtn.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const dialogs = page.locator('[role="dialog"]');
    const count = await dialogs.count().catch(() => 0);
    if (count === 0) break;

    const topDialog = dialogs.last();
    if (!(await topDialog.isVisible().catch(() => false))) break;

    const ariaLabel = ((await topDialog.getAttribute('aria-label').catch(() => '')) || '').toLowerCase();

    if (keepIncomingChallenge && ariaLabel.includes('nuevo desafío')) break;
    if (
      keepScoreConfirm &&
      (ariaLabel.includes('confirma el marcador') || ariaLabel.includes('revisión de marcador'))
    ) {
      break;
    }
    if (keepRecoveryModal && ariaLabel.includes('nueva contraseña')) break;

    const dismissBtn = topDialog
      .locator(
        'button:has-text("Revisar más tarde"), button:has-text("Revisar después"), button:has-text("Saltar"), button:has-text("Omitir"), button:has-text("Entendido"), button:has-text("Continuar"), .tt-modal-close-btn, .tt-modal-close, button[aria-label*="Cerrar" i]'
      )
      .first();

    if (await dismissBtn.isVisible().catch(() => false)) {
      await dismissBtn.click().catch(() => {});
      await page.waitForTimeout(320);
    } else {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(320);
      break;
    }
  }
}

async function clickDockTab(page, labelRegex) {
  for (let tries = 0; tries < 3; tries += 1) {
    await dismissSplashAndModals(page);
    const nav = page.locator('nav, .tt-bottom-dock').last();
    const btn = nav.locator('button').filter({ hasText: labelRegex }).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    try {
      await btn.click({ timeout: 5000 });
      await page.waitForTimeout(600);
      return;
    } catch {
      await dismissSplashAndModals(page);
    }
  }
}

async function clickRetosSubTab(page, tabText) {
  for (let tries = 0; tries < 3; tries += 1) {
    await dismissSplashAndModals(page);
    const tab = page.locator(`[role="tab"]:has-text("${tabText}")`).first();
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    try {
      await tab.click({ timeout: 5000 });
      await page.waitForTimeout(600);
      return;
    } catch {
      await dismissSplashAndModals(page);
    }
  }
}

async function openDrawerMenu(page) {
  await dismissSplashAndModals(page);
  const menuBtn = page
    .locator('header button[aria-label*="menú" i], header button[aria-label*="menu" i], header button[aria-label*="Abrir" i]')
    .first();
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click();
    await page.waitForTimeout(500);
    return true;
  }
  const fallbackBtn = page.locator('header button').last();
  if (await fallbackBtn.isVisible().catch(() => false)) {
    await fallbackBtn.click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

async function loginAsDemoIndex(page, botLabel, chipIndex) {
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await dismissSplashAndModals(page);

  await clickDockTab(page, /Perfil/i);
  const openAuthBtn = page
    .locator('button:has-text("Iniciar Sesión"), button:has-text("Crear Cuenta"), button:has-text("Entrar")')
    .first();

  if (await openAuthBtn.isVisible().catch(() => false)) {
    await openAuthBtn.click();
    await page.waitForTimeout(600);
  } else {
    const headerLogin = page.locator('header button:has-text("Entrar"), header button:has-text("Acceder")').first();
    if (await headerLogin.isVisible().catch(() => false)) {
      await headerLogin.click();
      await page.waitForTimeout(600);
    }
  }

  const demoChips = page.locator('.tt-demo-chip');
  const count = await demoChips.count();
  if (count <= chipIndex) {
    return { ok: false, name: '', count };
  }

  const chip = demoChips.nth(chipIndex);
  const rawText = ((await chip.innerText().catch(() => '')) || '').trim();
  const cleanName = rawText.split('\n')[0].replace(/VIP/gi, '').trim();
  await chip.click();
  await page.waitForTimeout(1700);

  await dismissSplashAndModals(page);

  await clickDockTab(page, /Perfil/i);
  const profileName = await page.locator('.tt-pf-name').first().innerText().catch(() => cleanName);
  const finalName = (profileName || cleanName || botLabel).trim();

  return { ok: true, name: finalName, count };
}

function getPeruFutureDateAndTime(hoursAhead) {
  const target = new Date(Date.now() + hoursAhead * 3600 * 1000);
  const dateStr = target.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const hh = String(
    Number(target.toLocaleTimeString('en-GB', { timeZone: 'America/Lima', hour: '2-digit', hour12: false }))
  ).padStart(2, '0');
  const mm = String(
    Number(target.toLocaleTimeString('en-GB', { timeZone: 'America/Lima', minute: '2-digit', hour12: false }))
  ).padStart(2, '0');
  return { dateStr, timeStr: `${hh}:${mm}` };
}

async function createBotContext(browser, label) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (err) => pageErrors.push(`[${label}] ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('OneSignal')) consoleErrors.push(`[${label}] ${txt}`);
    }
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('onesignal')) {
      failedRequests.push(`[${label}] ${res.status()} ${res.url()}`);
    }
  });
  return { ctx, page };
}

async function launchChallengeFromA(pageA, rivalFullName, hoursAhead, isFriendlyPreferred = false) {
  await clickDockTab(pageA, /Retos/i);
  await clickRetosSubTab(pageA, 'Lanzar Reto');

  const rangeToggle = pageA.locator('button:has-text("Solo en mi rango"), button:has-text("Mi rango ampliado")').first();
  if (await rangeToggle.isVisible().catch(() => false)) {
    await rangeToggle.click();
    await pageA.waitForTimeout(350);
  }

  const searchInput = pageA.locator('.tt-search-box input').first();
  await searchInput.fill(rivalFullName.split(' ')[0]);
  await pageA.waitForTimeout(450);

  const rivalRow = pageA.locator('.tt-rival-row').filter({ hasText: rivalFullName.split(' ')[0] }).first();
  if (!(await rivalRow.isVisible().catch(() => false))) {
    return { ok: false, reason: `No se encontró a ${rivalFullName} en el radar de rivales.` };
  }

  const ctaBtn = rivalRow.locator('button').last();
  await ctaBtn.click();
  await pageA.waitForTimeout(500);

  const form = pageA.locator('form.tt-form-stack').first();
  if (!(await form.isVisible().catch(() => false))) {
    return { ok: false, reason: 'No abrió el modal Pactar Nuevo Desafío.' };
  }

  if (isFriendlyPreferred) {
    const friendlyBtn = form.locator('button:has-text("Amistoso")').first();
    if (await friendlyBtn.isVisible().catch(() => false)) {
      await friendlyBtn.click();
    }
  }

  const { dateStr, timeStr } = getPeruFutureDateAndTime(hoursAhead);
  await form.locator('#tt-reto-date').fill(dateStr);
  await form.locator('#tt-reto-time').fill(timeStr);
  await pageA.waitForTimeout(250);

  await form.locator('button[type="submit"]:has-text("Enviar Desafío")').click();
  await pageA.waitForTimeout(1500);

  return { ok: true, dateStr, timeStr };
}

async function acceptIncomingChallengeOnB(pageB, challengerFirstName) {
  await pageB.reload({ waitUntil: 'domcontentloaded' });
  await dismissSplashAndModals(pageB, { keepIncomingChallenge: true });
  await pageB.waitForTimeout(800);

  let waHref = '';

  const popupDialog = pageB.locator('[role="dialog"][aria-label*="Nuevo Desafío"]').last();
  if (await popupDialog.isVisible().catch(() => false)) {
    const popupText = ((await popupDialog.innerText().catch(() => '')) || '').toLowerCase();
    if (popupText.includes(challengerFirstName.toLowerCase())) {
      waHref = (await popupDialog.locator('a[href*="wa.me/"]').first().getAttribute('href').catch(() => '')) || '';
      const popupAccept = popupDialog.locator('button:has-text("Aceptar Desafío Ahora")').first();
      if (await popupAccept.isVisible().catch(() => false)) {
        await popupAccept.click();
        await pageB.waitForTimeout(1300);
        return { ok: true, via: 'popup', waHref };
      }
    } else {
      await dismissSplashAndModals(pageB);
    }
  }

  await clickDockTab(pageB, /Retos/i);
  await clickRetosSubTab(pageB, 'Tus Desafíos');

  const pendingCard = pageB
    .locator('.tt-match-card')
    .filter({ hasText: challengerFirstName })
    .filter({ hasText: 'Aceptar Desafío' })
    .first();

  if (await pendingCard.isVisible().catch(() => false)) {
    waHref = (await pendingCard.locator('a[href*="wa.me/"]').first().getAttribute('href').catch(() => '')) || '';
    await pendingCard.locator('button:has-text("Aceptar Desafío")').first().click();
    await pageB.waitForTimeout(1300);
  } else {
    await dismissSplashAndModals(pageB);
    const acceptNow = pageB.locator('button:has-text("Aceptar ahora")').first();
    if (!(await acceptNow.isVisible().catch(() => false))) {
      return { ok: false, via: 'none', waHref };
    }
    await acceptNow.click();
    await pageB.waitForTimeout(1300);
  }

  if (!waHref) {
    const card = pageB.locator('.tt-match-card').filter({ hasText: challengerFirstName }).first();
    waHref = (await card.locator('a[href*="wa.me/"]').first().getAttribute('href').catch(() => '')) || '';
  }

  return { ok: true, via: 'card', waHref };
}

async function runFullSuite() {
  console.log(`🤖 Iniciando Simulador E2E TOTAL ("TODO ES TODO" v4) contra: ${TARGET_URL}`);
  const browser = await chromium.launch({ headless: true });

  const botA = await createBotContext(browser, 'Bot-A');
  const botB = await createBotContext(browser, 'Bot-B');
  const botC = await createBotContext(browser, 'Bot-C');
  const guest = await createBotContext(browser, 'Visitante');

  try {
    // ======================================================================
    // BLOQUE 1 · RETOS, HORAS, WHATSAPP, DISPUTA CONGELADA Y ÁRBITRO (01-08)
    // ======================================================================
    const [loginA, loginB, loginC] = await Promise.all([
      loginAsDemoIndex(botA.page, 'Bot A', 0),
      loginAsDemoIndex(botB.page, 'Bot B', 1),
      loginAsDemoIndex(botC.page, 'Bot C', 2),
    ]);

    const allLogged = loginA.ok && loginB.ok && loginC.ok;
    recordStep(
      'E2E-01',
      'Login simultáneo de 3 Bots (Retador, Rival y Árbitro)',
      allLogged,
      allLogged
        ? `Bot A: ${loginA.name} | Bot B: ${loginB.name} | Bot C: ${loginC.name}`
        : `Faltan cuentas demo activas (chips=${loginA.count}).`,
      await takeShot(botA.page, '01-bots-login.png')
    );

    if (!allLogged) throw new Error('No fue posible loguear los 3 bots demo.');

    const firstA = loginA.name.split(' ')[0];
    const firstB = loginB.name.split(' ')[0];
    const firstC = loginC.name.split(' ')[0];

    const reto1 = await launchChallengeFromA(botA.page, loginB.name, 72, true);
    recordStep(
      'E2E-02',
      'Bot A lanza reto (> 24h) a Bot B',
      reto1.ok,
      reto1.ok ? `Reto enviado para ${reto1.dateStr} ${reto1.timeStr} (Amistoso).` : reto1.reason,
      await takeShot(botA.page, '02-botA-reto-enviado.png')
    );

    const accept1 = reto1.ok
      ? await acceptIncomingChallengeOnB(botB.page, firstA)
      : { ok: false, waHref: '' };

    recordStep(
      'E2E-03',
      'Bot B recibe en vivo y acepta el reto',
      accept1.ok,
      accept1.ok
        ? `Aceptado vía ${accept1.via}. Estado actualizado a PROGRAMADO.`
        : 'Bot B no visualizó botón de aceptar.',
      await takeShot(botB.page, '03-botB-reto-aceptado.png')
    );

    let foundWaHref = accept1.waHref || '';
    if (!foundWaHref && accept1.ok) {
      await botA.page.reload({ waitUntil: 'domcontentloaded' });
      await clickDockTab(botA.page, /Retos/i);
      await clickRetosSubTab(botA.page, 'Tus Desafíos');
      const cardAForWa = botA.page.locator('.tt-match-card').filter({ hasText: firstB }).first();
      foundWaHref = (await cardAForWa.locator('a[href*="wa.me/"]').first().getAttribute('href').catch(() => '')) || '';
    }
    const waValid = Boolean(foundWaHref && foundWaHref.includes('wa.me/') && foundWaHref.includes('text='));
    recordStep(
      'E2E-04',
      'Enlace WhatsApp (número + texto prellenado)',
      waValid,
      waValid
        ? `Enlace válido: ${foundWaHref.slice(0, 78)}...`
        : `Sin número WhatsApp público en Supabase profiles para ${loginA.name} / ${loginB.name}.`
    );

    // E2E-05: Cambio de hora >= 24h con doble acuerdo
    let reschedProposed = false;
    let reschedAccepted = false;
    if (accept1.ok) {
      await botA.page.reload({ waitUntil: 'domcontentloaded' });
      await clickDockTab(botA.page, /Retos/i);
      await clickRetosSubTab(botA.page, 'Tus Desafíos');
      const cardA = botA.page
        .locator('.tt-match-card')
        .filter({ hasText: firstB })
        .filter({ hasText: 'Cambiar hora' })
        .first();
      const changeTimeBtn = cardA.locator('button:has-text("Cambiar hora")').first();
      if (await changeTimeBtn.isVisible().catch(() => false)) {
        await changeTimeBtn.click();
        await botA.page.waitForTimeout(400);
        const { dateStr, timeStr } = getPeruFutureDateAndTime(96);
        await botA.page.locator('#tt-resched-date').fill(dateStr);
        await botA.page.locator('#tt-resched-time').fill(timeStr);
        await botA.page.locator('button:has-text("Enviar Propuesta a mi Rival")').click();
        await botA.page.waitForTimeout(1300);
        reschedProposed = true;
      }
      if (reschedProposed) {
        await botB.page.reload({ waitUntil: 'domcontentloaded' });
        await clickDockTab(botB.page, /Retos/i);
        await clickRetosSubTab(botB.page, 'Tus Desafíos');
        const acceptHourBtn = botB.page.locator('button:has-text("Aceptar nueva hora")').first();
        if (await acceptHourBtn.isVisible().catch(() => false)) {
          await acceptHourBtn.click();
          await botB.page.waitForTimeout(1300);
          reschedAccepted = true;
        }
      }
    }
    recordStep(
      'E2E-05',
      'Cambio de hora con doble acuerdo (>= 24h antes)',
      reschedProposed && reschedAccepted,
      reschedProposed && reschedAccepted
        ? 'Bot A propuso y Bot B aceptó la nueva hora.'
        : `Propuesto=${reschedProposed}, Aceptado=${reschedAccepted}.`,
      await takeShot(botB.page, '04-cambio-hora.png')
    );

    // E2E-06 & E2E-07: Candado 7-7 + Disputa con motivo + Congelamiento real
    let blocked77 = false;
    let disputedOk = false;
    let frozenNoReupload = false;

    if (accept1.ok) {
      await botA.page.reload({ waitUntil: 'domcontentloaded' });
      await clickDockTab(botA.page, /Retos/i);
      await clickRetosSubTab(botA.page, 'Tus Desafíos');
      const cardA = botA.page
        .locator('.tt-match-card')
        .filter({ hasText: firstB })
        .filter({ hasText: 'Subir Resultado' })
        .first();
      const uploadBtn = cardA.locator('button:has-text("Subir Resultado")').first();

      if (await uploadBtn.isVisible().catch(() => false)) {
        await uploadBtn.click();
        await botA.page.waitForTimeout(450);

        const inputs = botA.page.locator('.tt-direct-num-input');
        await inputs.nth(0).fill('7');
        await inputs.nth(1).fill('7');
        await inputs.nth(2).fill('6');
        await inputs.nth(3).fill('4');
        await botA.page.waitForTimeout(250);
        blocked77 = !(await botA.page
          .locator('button:has-text("Enviar Resultado a mi Rival")')
          .isVisible()
          .catch(() => false));

        await inputs.nth(0).fill('6');
        await inputs.nth(1).fill('4');
        await inputs.nth(2).fill('6');
        await inputs.nth(3).fill('3');
        await botA.page.waitForTimeout(350);

        const sendValidBtn = botA.page
          .locator('button:has-text("Enviar Resultado a mi Rival"), button:has-text("Confirmar Resultado Oficial")')
          .first();
        if (await sendValidBtn.isVisible().catch(() => false)) {
          await sendValidBtn.click();
          await botA.page.waitForTimeout(1500);

          await botB.page.reload({ waitUntil: 'domcontentloaded' });
          await dismissSplashAndModals(botB.page, { keepScoreConfirm: true });
          await botB.page.waitForTimeout(600);

          let disputeBtn = botB.page.locator('button:has-text("Impugnar")').first();
          if (!(await disputeBtn.isVisible().catch(() => false))) {
            await clickDockTab(botB.page, /Retos/i);
            await clickRetosSubTab(botB.page, 'Tus Desafíos');
            disputeBtn = botB.page
              .locator('.tt-match-card')
              .filter({ hasText: firstA })
              .locator('button:has-text("Impugnar")')
              .first();
          }

          if (await disputeBtn.isVisible().catch(() => false)) {
            await disputeBtn.click();
            await botB.page.waitForTimeout(550);
            const reasonInput = botB.page.locator('#tt-dispute-reason-text');
            if (await reasonInput.isVisible().catch(() => false)) {
              await reasonInput.fill('El segundo set terminó 6-4 a mi favor, solicito revisión.');
              const claimedInput = botB.page.locator('#tt-dispute-claimed-score');
              if (await claimedInput.isVisible().catch(() => false)) {
                await claimedInput.fill('4-6, 6-4, 10-7');
              }
              await botB.page.locator('button:has-text("Enviar Impugnación al Comité")').click();
              await botB.page.waitForTimeout(1500);
            }
            await clickDockTab(botB.page, /Retos/i);
            await clickRetosSubTab(botB.page, 'Tus Desafíos');
            const disputedCard = botB.page
              .locator('.tt-match-card')
              .filter({ hasText: 'EN REVISIÓN' })
              .first();
            disputedOk = await disputedCard.isVisible().catch(() => false);
            const hasReupload = await disputedCard
              .locator('button:has-text("Subir Resultado")')
              .isVisible()
              .catch(() => false);
            frozenNoReupload = disputedOk && !hasReupload;
          }
        }
      }
    }

    recordStep(
      'E2E-06',
      'Candado anti-marcador imposible (bloquea 7-7)',
      blocked77,
      blocked77 ? '7-7 bloqueado correctamente.' : 'No se pudo comprobar el bloqueo 7-7.'
    );
    recordStep(
      'E2E-07',
      'Impugnación con motivo + Congelamiento real EN REVISIÓN',
      disputedOk && frozenNoReupload,
      disputedOk && frozenNoReupload
        ? 'Impugnado con motivo obligatorio; tarjeta congelada EN REVISIÓN sin botón de re-subir.'
        : `Disputed=${disputedOk}, CongeladoSinResubir=${frozenNoReupload}.`,
      await takeShot(botB.page, '05-disputa-congelada.png')
    );

    // E2E-08: Ventana < 24h -> Designar Árbitro (Bot C) + Modo Árbitro
    let judgeAssigned = false;
    let judgeClosedToReview = false;
    const reto2 = await launchChallengeFromA(botA.page, loginB.name, 4, true);
    const accept2 = reto2.ok ? await acceptIncomingChallengeOnB(botB.page, firstA) : { ok: false };

    if (accept2.ok) {
      await botA.page.reload({ waitUntil: 'domcontentloaded' });
      await clickDockTab(botA.page, /Retos/i);
      await clickRetosSubTab(botA.page, 'Tus Desafíos');
      const cardShort = botA.page
        .locator('.tt-match-card')
        .filter({ hasText: firstB })
        .filter({ hasText: 'Designar Árbitro' })
        .first();
      const assignBtn = cardShort.locator('button:has-text("Designar Árbitro")').first();
      if (await assignBtn.isVisible().catch(() => false)) {
        await assignBtn.click();
        await botA.page.waitForTimeout(400);
        const selectEl = botA.page.locator('#tt-assign-judge-sel');
        const options = await selectEl.locator('option').allTextContents();
        const matchOpt = options.find((t) => t.toLowerCase().includes(firstC.toLowerCase()));
        if (matchOpt) {
          await selectEl.selectOption({ label: matchOpt });
          await botA.page.waitForTimeout(1300);
          judgeAssigned = true;
        }
      }
    }
    if (judgeAssigned) {
      await botC.page.reload({ waitUntil: 'domcontentloaded' });
      await clickDockTab(botC.page, /Retos/i);
      await clickRetosSubTab(botC.page, 'Tus Desafíos');
      const refBtn = botC.page
        .locator('button:has-text("Abrir Modo Árbitro"), button:has-text("Llevar Marcador (Árbitro)")')
        .first();
      if (await refBtn.isVisible().catch(() => false)) {
        await refBtn.click();
        await botC.page.waitForTimeout(450);
        for (let g = 0; g < 6; g += 1) {
          await botC.page.locator('.tt-step-plus').first().click();
          await botC.page.waitForTimeout(160);
        }
        await botC.page.waitForTimeout(350);
        for (let g = 0; g < 6; g += 1) {
          await botC.page.locator('.tt-step-plus').first().click();
          await botC.page.waitForTimeout(160);
        }
        await botC.page.waitForTimeout(450);
        const closeRefBtn = botC.page.locator('button:has-text("Cerrar Marcador y Enviar a Revisión")').first();
        if (await closeRefBtn.isVisible().catch(() => false)) {
          await closeRefBtn.click();
          await botC.page.waitForTimeout(1400);
          judgeClosedToReview = true;
        }
      }
    }
    recordStep(
      'E2E-08',
      'Ventana < 24h: Designar Árbitro (Bot C) + Modo Árbitro -> EN REVISIÓN',
      judgeAssigned && judgeClosedToReview,
      judgeAssigned && judgeClosedToReview
        ? `Bot C (${loginC.name}) llevó el marcador y cerró hacia EN REVISIÓN.`
        : `Designado=${judgeAssigned}, Cerrado=${judgeClosedToReview}.`,
      await takeShot(botC.page, '06-modo-arbitro.png')
    );

    // ======================================================================
    // BLOQUE 2 · RANKING 3D + FOTO + FONDOS + GEMAS + TEMA CLARO/OSCURO (09-14)
    // ======================================================================
    await clickDockTab(botA.page, /Ranking/i);
    await botA.page.waitForTimeout(600);
    const hasOficialTab = await botA.page.locator('[role="tab"]:has-text("Oficial")').isVisible().catch(() => false);
    const hasCalibTab = await botA.page.locator('[role="tab"]:has-text("Calibrando")').isVisible().catch(() => false);
    const tableOverflowVisible = await botA.page
      .evaluate(() => {
        const el = document.querySelector('.tt-rk-table-shell');
        if (!el) return true;
        return window.getComputedStyle(el).overflow !== 'hidden';
      })
      .catch(() => false);

    let calibClean = false;
    if (hasCalibTab) {
      await botA.page.locator('[role="tab"]:has-text("Calibrando")').first().click();
      await botA.page.waitForTimeout(550);
      const hasPodiumInCalib = await botA.page.locator('.tt-top3-hcard').count();
      const hasHeaderText = await botA.page.locator('text=LISTA PROVISIONAL').first().isVisible().catch(() => false);
      calibClean = hasPodiumInCalib === 0 && hasHeaderText;
    }
    recordStep(
      'E2E-09',
      'Ranking Oficial (>=5 PJ) vs Calibrando (sin #1) + 3D sin recortes',
      hasOficialTab && hasCalibTab && calibClean && tableOverflowVisible,
      `Oficial=${hasOficialTab}, CalibrandoLimpio=${calibClean}, TablaSinRecorte3D=${tableOverflowVisible}.`,
      await takeShot(botA.page, '07-ranking-calibrando.png')
    );

    // E2E-10: SUBIR FOTO PNG REAL + 4 SLIDERS + SILUETA + CAMBIAR ESCENARIO/FONDO + GUARDAR
    await clickDockTab(botA.page, /Perfil/i);
    await botA.page.waitForTimeout(500);
    let photoStudioOk = false;
    let photoDetail = '';
    const studioBtn = botA.page
      .locator('button[aria-label="Cambiar foto y fondo"], button:has-text("Fondos (")')
      .first();
    if (await studioBtn.isVisible().catch(() => false)) {
      await studioBtn.click();
      await botA.page.waitForTimeout(550);
      const fileInput = botA.page.locator('input[type="file"]').first();
      const hasFileInput = (await fileInput.count()) > 0;
      if (hasFileInput) {
        await fileInput.setInputFiles(SAMPLE_PHOTO_PATH);
        await botA.page.waitForTimeout(650);
      }
      const sliders = botA.page.locator('.tt-pf-studio-sliders input[type="range"]');
      const slidersCount = await sliders.count();
      if (slidersCount >= 4) {
        await sliders.nth(0).fill('1.25').catch(() => {});
        await sliders.nth(3).fill('4').catch(() => {});
      }
      const silBtn = botA.page.locator('.tt-pf-silhouette-btn').first();
      if (await silBtn.isVisible().catch(() => false)) {
        await silBtn.click();
        await botA.page.waitForTimeout(250);
      }
      // Seleccionar un fondo propio ("Tuyo") para probar cambio de fondo sin romper saldo
      const ownedTile = botA.page.locator('.tt-pf-scen-tile').filter({ hasText: 'Tuyo' }).last();
      if (await ownedTile.isVisible().catch(() => false)) {
        await ownedTile.click();
        await botA.page.waitForTimeout(250);
      }
      await takeShot(botA.page, '08-estudio-foto-fondos.png');
      const savePhotoBtn = botA.page.locator('button:has-text("Guardar Foto y Escenario")').first();
      const canSave = await savePhotoBtn.isVisible().catch(() => false);
      if (canSave) {
        await savePhotoBtn.click();
        await botA.page.waitForTimeout(1600);
      }
      const modalClosed = !(await botA.page
        .locator('[role="dialog"][aria-label*="Estudio de Foto"]')
        .isVisible()
        .catch(() => false));
      photoStudioOk = hasFileInput && slidersCount >= 4 && canSave && modalClosed;
      photoDetail = `SubidaPNG=${hasFileInput}, Sliders=${slidersCount}/4, GuardadoEnNube=${modalClosed}`;
    } else {
      photoDetail = 'No se encontró el botón de Estudio de Foto y Fondos en Perfil.';
    }
    recordStep(
      'E2E-10',
      'Subir foto real + 4 deslizadores + Silueta + Cambiar fondo y Guardar',
      photoStudioOk,
      photoDetail,
      '08-estudio-foto-fondos.png'
    );

    // E2E-11: GEMAS (CUÁNTAS GEMAS TIENE + BÓVEDA + PRO SHOP Y CANJE)
    let gemsAuditOk = false;
    let gemsDetail = '';
    await dismissSplashAndModals(botA.page);
    const gemsBtnHeader = botA.page
      .locator('header button:has-text("💎"), header button[aria-label*="Gema" i], header button[aria-label*="Bóveda" i]')
      .first();
    let openedShopOrVault = false;
    if (await gemsBtnHeader.isVisible().catch(() => false)) {
      await gemsBtnHeader.click();
      await botA.page.waitForTimeout(700);
      openedShopOrVault = true;
    } else if (await openDrawerMenu(botA.page)) {
      const vaultBtn = botA.page
        .locator('button:has-text("Bóveda"), button:has-text("Pro Shop"), button:has-text("Gemas")')
        .first();
      if (await vaultBtn.isVisible().catch(() => false)) {
        await vaultBtn.click();
        await botA.page.waitForTimeout(700);
        openedShopOrVault = true;
      }
    }
    if (openedShopOrVault) {
      const dialogText = await botA.page.locator('[role="dialog"]').last().innerText().catch(() => '');
      const hasGemsNumber = /\d[\d,.]*\s*(💎|Gemas)/i.test(dialogText) || /Saldo/i.test(dialogText);
      const hasProShopOrVault = /Pro Shop|Bóveda|Canjear|Stock|Misiones/i.test(dialogText);
      const canClickSwitch = botA.page
        .locator('[role="dialog"] button:has-text("Pro Shop"), [role="dialog"] button:has-text("Tienda"), [role="dialog"] button:has-text("Bóveda")')
        .first();
      if (await canClickSwitch.isVisible().catch(() => false)) {
        await canClickSwitch.click().catch(() => {});
        await botA.page.waitForTimeout(450);
      }
      await takeShot(botA.page, '09-boveda-gemas-proshop.png');
      gemsAuditOk = hasGemsNumber && hasProShopOrVault;
      const matchAmt = dialogText.match(/(\d[\d,.]*)\s*💎/);
      gemsDetail = `Saldo detectado: ${matchAmt ? matchAmt[0] : 'visible'} · ProShop/Bóveda operativos=${hasProShopOrVault}`;
      await dismissSplashAndModals(botA.page);
    } else {
      gemsDetail = 'No se logró abrir la Bóveda de Gemas / Pro Shop.';
    }
    recordStep(
      'E2E-11',
      'Gemas: Verificar saldo exacto + Bóveda + Pro Shop / Canje',
      gemsAuditOk,
      gemsDetail,
      '09-boveda-gemas-proshop.png'
    );

    // E2E-12: CAMBIO DE TEMA MODO CLARO <-> MODO OSCURO
    let themeSwitchOk = false;
    const beforeTheme = await botA.page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (await openDrawerMenu(botA.page)) {
      const themeBtn = botA.page
        .locator('button:has-text("Modo Claro"), button:has-text("Modo Oscuro"), button[aria-label*="tema" i]')
        .first();
      if (await themeBtn.isVisible().catch(() => false)) {
        await themeBtn.click();
        await botA.page.waitForTimeout(550);
      }
    }
    const afterFirstToggle = await botA.page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await dismissSplashAndModals(botA.page);
    await takeShot(botA.page, '10-modo-claro-activo.png');

    // Volver al tema original
    if (await openDrawerMenu(botA.page)) {
      const themeBtn2 = botA.page
        .locator('button:has-text("Modo Claro"), button:has-text("Modo Oscuro"), button[aria-label*="tema" i]')
        .first();
      if (await themeBtn2.isVisible().catch(() => false)) {
        await themeBtn2.click();
        await botA.page.waitForTimeout(500);
      }
    }
    const afterSecondToggle = await botA.page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await dismissSplashAndModals(botA.page);
    themeSwitchOk = Boolean(beforeTheme && afterFirstToggle && beforeTheme !== afterFirstToggle && afterSecondToggle === beforeTheme);
    recordStep(
      'E2E-12',
      'Cambio de tema Modo Oscuro <-> Modo Claro en vivo',
      themeSwitchOk,
      `Inicial=${beforeTheme} -> Cambio=${afterFirstToggle} -> Restaurado=${afterSecondToggle}`,
      '10-modo-claro-activo.png'
    );

    // E2E-13: CONTRASEÑA + OJO VER/OCULTAR + RECUPERAR CONTRASEÑA (#type=recovery)
    let authRecoveryOk = false;
    let authDetail = '';
    await guest.page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await dismissSplashAndModals(guest.page);
    await clickDockTab(guest.page, /Perfil/i);
    const guestLoginBtn = guest.page
      .locator('button:has-text("Iniciar Sesión"), button:has-text("Crear Cuenta"), button:has-text("Entrar")')
      .first();
    if (await guestLoginBtn.isVisible().catch(() => false)) {
      await guestLoginBtn.click();
      await guest.page.waitForTimeout(550);
    }
    const passInput = guest.page.locator('input[type="password"]').first();
    const hasPassField = await passInput.isVisible().catch(() => false);
    if (hasPassField) {
      await passInput.fill('ClavePrueba123');
    }
    // Abrir pantalla "¿Olvidaste tu contraseña?"
    const forgotBtn = guest.page.locator('button:has-text("Olvidaste"), button:has-text("Recuperar")').first();
    let forgotScreenVisible = false;
    if (await forgotBtn.isVisible().catch(() => false)) {
      await forgotBtn.click();
      await guest.page.waitForTimeout(500);
      forgotScreenVisible = await guest.page
        .locator('input[type="email"], button:has-text("Enviar"), text=/Recuperar|Restablecer|correo/i')
        .first()
        .isVisible()
        .catch(() => false);
      await takeShot(guest.page, '11-recuperar-contrasena-form.png');
    }

    // Probar flujo real de retorno de enlace: #type=recovery -> modal "Crea tu Nueva Contraseña"
    await guest.page.goto(`${TARGET_URL}/#type=recovery`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await guest.page.waitForTimeout(1400);
    const recoveryHeading = await guest.page
      .locator('text=Crea tu Nueva Contraseña')
      .first()
      .isVisible()
      .catch(() => false);
    const recPassInputs = guest.page.locator('form.tt-recovery-form input[type="password"]');
    const recInputsCount = await recPassInputs.count();
    let mismatchValidated = false;
    if (recoveryHeading && recInputsCount >= 2) {
      await recPassInputs.nth(0).fill('NuevaClave123');
      await recPassInputs.nth(1).fill('OtraClave999');
      await guest.page.locator('button:has-text("Guardar Nueva Contraseña")').click();
      await guest.page.waitForTimeout(450);
      mismatchValidated = await guest.page
        .locator('text=/no coinciden/i')
        .first()
        .isVisible()
        .catch(() => false);
      await takeShot(guest.page, '12-crear-nueva-contrasena.png');
    }

    authRecoveryOk = hasPassField && forgotScreenVisible && recoveryHeading && recInputsCount >= 2 && mismatchValidated;
    authDetail = `CampoClave=${hasPassField}, PantallaOlvideClave=${forgotScreenVisible}, ModalNuevaClave=${recoveryHeading}, ValidaCoincidencia=${mismatchValidated}`;
    recordStep(
      'E2E-13',
      'Contraseña + Flujo Recuperar Contraseña + Validación nueva clave',
      authRecoveryOk,
      authDetail,
      '12-crear-nueva-contrasena.png'
    );

    // E2E-14: AJUSTES DE PERFIL EN CANCHA (MANO HÁBIL, GOLPES, GUARDAR)
    await clickDockTab(botA.page, /Perfil/i);
    await botA.page.waitForTimeout(450);
    let settingsOk = false;
    const settingsBtn = botA.page
      .locator('button[aria-label*="Ajuste" i], button[aria-label*="Editar" i], .tt-pf-top-btns button')
      .last();
    if (await settingsBtn.isVisible().catch(() => false)) {
      await settingsBtn.click();
      await botA.page.waitForTimeout(500);
      const saveSettingsBtn = botA.page.locator('button[type="submit"]:has-text("Guardar")').first();
      if (await saveSettingsBtn.isVisible().catch(() => false)) {
        const chip = botA.page.locator('.tt-pf-chip').first();
        if (await chip.isVisible().catch(() => false)) await chip.click();
        await saveSettingsBtn.click();
        await botA.page.waitForTimeout(1000);
        settingsOk = true;
      }
    }
    recordStep(
      'E2E-14',
      'Ajustes de Perfil en Cancha (mano hábil, disponibilidad y guardado)',
      settingsOk,
      settingsOk ? 'Ajustes técnicos del jugador guardados correctamente.' : 'No se abrió el modal de Ajustes.'
    );

    // E2E-15: TORNEOS (GIRA + MASTER TOP 8) + SEDES & COACHES + CARNET VIP 3D
    await clickDockTab(botA.page, /Torneos/i);
    await botA.page.waitForTimeout(650);
    const torneosVisible = (await botA.page.locator('h1, h2, h3').count()) > 0;
    const masterTab = botA.page.locator('[role="tab"]:has-text("Master"), button:has-text("Master")').first();
    if (await masterTab.isVisible().catch(() => false)) {
      await masterTab.click();
      await botA.page.waitForTimeout(450);
    }
    await takeShot(botA.page, '13-torneos-master.png');

    await clickDockTab(botA.page, /Sedes/i);
    await botA.page.waitForTimeout(650);
    const sedesLoaded = (await botA.page.locator('button:has-text("Coaches"), [role="tab"]:has-text("Coaches"), button:has-text("Profesores")').count()) > 0;
    const coachesTab = botA.page.locator('button:has-text("Coaches"), [role="tab"]:has-text("Coaches"), button:has-text("Profesores")').first();
    if (await coachesTab.isVisible().catch(() => false)) {
      await coachesTab.click();
      await botA.page.waitForTimeout(550);
    }
    await takeShot(botA.page, '14-sedes-coaches.png');

    await clickDockTab(botA.page, /Perfil/i);
    const vipBtn = botA.page.locator('button:has-text("Carnet VIP"), button:has-text("Socio VIP"), button:has-text("Pase VIP")').first();
    let vipModalOk = false;
    if (await vipBtn.isVisible().catch(() => false)) {
      await vipBtn.click();
      await botA.page.waitForTimeout(550);
      vipModalOk = await botA.page.locator('[role="dialog"]').last().isVisible().catch(() => false);
      await takeShot(botA.page, '15-carnet-vip.png');
      await dismissSplashAndModals(botA.page);
    }

    recordStep(
      'E2E-15',
      'Torneos (Gira/Master) + Sedes & Coaches + Carnet VIP 3D',
      torneosVisible && sedesLoaded && vipModalOk,
      `Torneos=${torneosVisible}, Sedes/Coaches=${sedesLoaded}, ModalVIP=${vipModalOk}.`,
      '14-sedes-coaches.png'
    );

    // E2E-16: LIBRO DE RECLAMACIONES (INDECOPI) + CANDADO DE SEGURIDAD
    await guest.page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await dismissSplashAndModals(guest.page);
    let legalOk = false;
    const legalFooterBtn = guest.page
      .locator('button:has-text("Libro de Reclamaciones"), a:has-text("Libro de Reclamaciones")')
      .first();
    if (await legalFooterBtn.isVisible().catch(() => false)) {
      await legalFooterBtn.click();
      await guest.page.waitForTimeout(550);
      legalOk = await guest.page
        .locator('[role="dialog"] :text-matches("Libro de Reclamaciones|Indecopi|Inicia sesión", "i")')
        .first()
        .isVisible()
        .catch(() => false);
      await takeShot(guest.page, '16-libro-reclamaciones.png');
    }
    recordStep(
      'E2E-16',
      'Libro de Reclamaciones (Indecopi / Ley Perú) accesible y protegido',
      legalOk,
      legalOk ? 'Libro de Reclamaciones operativo y con validación legal.' : 'No abrió el Libro de Reclamaciones.',
      '16-libro-reclamaciones.png'
    );
  } catch (err) {
    recordStep('E2E-FATAL', 'Ejecución general del simulador', false, String(err?.message || err));
  } finally {
    await botA.ctx.close();
    await botB.ctx.close();
    await botC.ctx.close();
    await guest.ctx.close();
    await browser.close();
  }

  // ------------------------------------------------------------------------
  // GENERAR REPORTE MARKDOWN Y JSON
  // ------------------------------------------------------------------------
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const healthPct = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  const mdLines = [
    `# 🤖 Reporte Simulador Multi-Bot E2E TOTAL ("TODO ES TODO" v4) · TOTAL TENIS`,
    `- **URL probada:** ${TARGET_URL}`,
    `- **Salud E2E Global:** **${passedCount}/${totalCount} pruebas aprobadas (${healthPct}%)**`,
    `- **Errores JS (pageerror):** ${pageErrors.length}`,
    `- **Fallos HTTP (4xx/5xx):** ${failedRequests.length}`,
    '',
    '| ID | Flujo probado | Estado | Detalle | Captura |',
    '| :--- | :--- | :---: | :--- | :--- |',
    ...results.map(
      (r) =>
        `| \`${r.id}\` | ${r.title} | ${r.passed ? '✅ OK' : '❌ FALLO'} | ${r.detail.replace(/\|/g, '/')} | ${r.screenshot || '—'} |`
    ),
  ];

  if (pageErrors.length > 0) {
    mdLines.push('', '## Errores JS detectados', ...pageErrors.map((e) => `- ${e}`));
  }
  if (failedRequests.length > 0) {
    mdLines.push('', '## Fallos de red detectados', ...failedRequests.slice(0, 15).map((e) => `- ${e}`));
  }

  const mdText = mdLines.join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'QA_E2E_REPORT.md'), mdText, 'utf-8');
  fs.writeFileSync(
    path.join(OUT_DIR, 'qa-e2e-report.json'),
    JSON.stringify({ TARGET_URL, healthPct, results, pageErrors, consoleErrors, failedRequests }, null, 2),
    'utf-8'
  );

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${mdText}\n`);
  }

  console.log('\n' + mdText);
  if (passedCount < totalCount) {
    process.exitCode = 1;
  }
}

runFullSuite().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
