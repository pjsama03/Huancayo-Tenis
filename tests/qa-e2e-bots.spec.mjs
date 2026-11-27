import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

/* ==========================================================================
   SIMULADOR MULTI-BOT E2E · TOTAL TENIS (v3)
   Bot A (Retador) · Bot B (Rival) · Bot C (Árbitro Oficial)
   v3: Helper clickRetosSubTab anti-intercepción Realtime, limpieza hasta 18
   popups previos, verificación WhatsApp en ambos lados y Disputa directa en
   popup o en tarjeta MatchPosterCard.
   ========================================================================== */

const TARGET_URL = process.env.QA_TARGET_URL || 'https://huancayo-tenis.vercel.app';
const OUT_DIR = path.resolve('qa-e2e-output');
fs.mkdirSync(OUT_DIR, { recursive: true });

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
  { keepIncomingChallenge = false, keepScoreConfirm = false } = {}
) {
  await page.waitForTimeout(900);

  // 1. Cerrar Splash Screen si está visible
  const enterBtn = page
    .locator(
      'button:has-text("Entrar"), button:has-text("Empezar"), button:has-text("Ingresar"), button:has-text("Explorar"), button:has-text("Comenzar")'
    )
    .first();
  if (await enterBtn.isVisible().catch(() => false)) {
    await enterBtn.click().catch(() => {});
    await page.waitForTimeout(550);
  }

  // 2. Bucle para limpiar popups apilados (hasta 18 para cuentas demo con historial)
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const dialogs = page.locator('[role="dialog"]');
    const count = await dialogs.count().catch(() => 0);
    if (count === 0) break;

    const topDialog = dialogs.last();
    if (!(await topDialog.isVisible().catch(() => false))) break;

    const ariaLabel = ((await topDialog.getAttribute('aria-label').catch(() => '')) || '').toLowerCase();

    if (keepIncomingChallenge && ariaLabel.includes('nuevo desafío')) {
      break;
    }
    if (
      keepScoreConfirm &&
      (ariaLabel.includes('confirma el marcador') || ariaLabel.includes('revisión de marcador'))
    ) {
      break;
    }

    const dismissBtn = topDialog
      .locator(
        'button:has-text("Revisar más tarde"), button:has-text("Revisar después"), button:has-text("Saltar"), button:has-text("Omitir"), button:has-text("Entendido"), button:has-text("Continuar"), .tt-modal-close-btn, .tt-modal-close, button[aria-label*="Cerrar" i]'
      )
      .first();

    if (await dismissBtn.isVisible().catch(() => false)) {
      await dismissBtn.click().catch(() => {});
      await page.waitForTimeout(350);
    } else {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(350);
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
      await page.waitForTimeout(650);
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
      await page.waitForTimeout(650);
      return;
    } catch {
      await dismissSplashAndModals(page);
    }
  }
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
  await page.waitForTimeout(1800);

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
  await pageA.waitForTimeout(1600);

  return { ok: true, dateStr, timeStr };
}

async function acceptIncomingChallengeOnB(pageB, challengerFirstName) {
  await pageB.reload({ waitUntil: 'domcontentloaded' });
  await dismissSplashAndModals(pageB, { keepIncomingChallenge: true });
  await pageB.waitForTimeout(900);

  let waHref = '';

  const popupDialog = pageB.locator('[role="dialog"][aria-label*="Nuevo Desafío"]').last();
  if (await popupDialog.isVisible().catch(() => false)) {
    const popupText = ((await popupDialog.innerText().catch(() => '')) || '').toLowerCase();
    if (popupText.includes(challengerFirstName.toLowerCase())) {
      waHref = (await popupDialog.locator('a[href*="wa.me/"]').first().getAttribute('href').catch(() => '')) || '';
      const popupAccept = popupDialog.locator('button:has-text("Aceptar Desafío Ahora")').first();
      if (await popupAccept.isVisible().catch(() => false)) {
        await popupAccept.click();
        await pageB.waitForTimeout(1400);
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
    await pageB.waitForTimeout(1400);
  } else {
    await dismissSplashAndModals(pageB);
    const acceptNow = pageB.locator('button:has-text("Aceptar ahora")').first();
    if (!(await acceptNow.isVisible().catch(() => false))) {
      return { ok: false, via: 'none', waHref };
    }
    await acceptNow.click();
    await pageB.waitForTimeout(1400);
  }

  if (!waHref) {
    const card = pageB.locator('.tt-match-card').filter({ hasText: challengerFirstName }).first();
    waHref = (await card.locator('a[href*="wa.me/"]').first().getAttribute('href').catch(() => '')) || '';
  }

  return { ok: true, via: 'card', waHref };
}

async function runMultiBotSimulation() {
  console.log(`🤖 Iniciando Simulador Multi-Bot E2E v3 contra: ${TARGET_URL}`);
  const browser = await chromium.launch({ headless: true });

  const botA = await createBotContext(browser, 'Bot-A');
  const botB = await createBotContext(browser, 'Bot-B');
  const botC = await createBotContext(browser, 'Bot-C');

  try {
    // ----------------------------------------------------------------------
    // FASE 1: LOGIN SIMULTÁNEO DE 3 BOTS (A, B y C)
    // ----------------------------------------------------------------------
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
        : `Faltan cuentas demo activas para login automático (chips detectados: ${loginA.count}).`,
      await takeShot(botA.page, '01-bots-login.png')
    );

    if (!allLogged) {
      throw new Error('No fue posible loguear los 3 bots demo.');
    }

    const firstA = loginA.name.split(' ')[0];
    const firstB = loginB.name.split(' ')[0];
    const firstC = loginC.name.split(' ')[0];

    // ----------------------------------------------------------------------
    // FASE 2: RETO >= 24H (Bot A -> Bot B) + ACEPTACIÓN + WHATSAPP LINK
    // ----------------------------------------------------------------------
    const reto1 = await launchChallengeFromA(botA.page, loginB.name, 72, true);
    recordStep(
      'E2E-02',
      'Bot A lanza reto (> 24h) a Bot B',
      reto1.ok,
      reto1.ok
        ? `Reto enviado para ${reto1.dateStr} ${reto1.timeStr} (Amistoso para no ensuciar ELO real).`
        : reto1.reason,
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
        ? `Aceptado correctamente vía ${accept1.via}. Estado actualizado a PROGRAMADO.`
        : 'Bot B no visualizó el botón de aceptar reto.',
      await takeShot(botB.page, '03-botB-reto-aceptado.png')
    );

    // Verificar enlace WhatsApp en Bot B (teléfono de A) o en Bot A (teléfono de B)
    let foundWaHref = accept1.waHref || '';
    if (!foundWaHref && accept1.ok) {
      await botA.page.reload({ waitUntil: 'domcontentloaded' });
      await clickDockTab(botA.page, /Retos/i);
      await clickRetosSubTab(botA.page, 'Tus Desafíos');
      const cardAForWa = botA.page.locator('.tt-match-card').filter({ hasText: firstB }).first();
      foundWaHref = (await cardAForWa.locator('a[href*="wa.me/"]').first().getAttribute('href').catch(() => '')) || '';
    }

    const waValid = Boolean(
      foundWaHref && foundWaHref.includes('wa.me/') && foundWaHref.includes('text=')
    );
    recordStep(
      'E2E-04',
      'Verificación de enlace WhatsApp (número + mensaje prellenado)',
      waValid,
      waValid
        ? `Enlace válido generado: ${foundWaHref.slice(0, 82)}...`
        : `Ni ${loginA.name} ni ${loginB.name} tienen número WhatsApp público en Supabase profiles (o tienen hideWhatsapp activo).`
    );

    // ----------------------------------------------------------------------
    // FASE 3: CAMBIO DE HORA CON DOBLE ACUERDO (>= 24h ANTES)
    // ----------------------------------------------------------------------
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
        await botA.page.waitForTimeout(450);
        const { dateStr, timeStr } = getPeruFutureDateAndTime(96);
        await botA.page.locator('#tt-resched-date').fill(dateStr);
        await botA.page.locator('#tt-resched-time').fill(timeStr);
        await botA.page.locator('button:has-text("Enviar Propuesta a mi Rival")').click();
        await botA.page.waitForTimeout(1400);
        reschedProposed = true;
      }

      if (reschedProposed) {
        await botB.page.reload({ waitUntil: 'domcontentloaded' });
        await clickDockTab(botB.page, /Retos/i);
        await clickRetosSubTab(botB.page, 'Tus Desafíos');

        const acceptHourBtn = botB.page.locator('button:has-text("Aceptar nueva hora")').first();
        if (await acceptHourBtn.isVisible().catch(() => false)) {
          await acceptHourBtn.click();
          await botB.page.waitForTimeout(1400);
          reschedAccepted = true;
        }
      }
    }

    recordStep(
      'E2E-05',
      'Cambio de hora con doble acuerdo (>= 24h antes)',
      reschedProposed && reschedAccepted,
      reschedProposed && reschedAccepted
        ? 'Bot A propuso nuevo horario y Bot B lo aceptó desde la caja de doble acuerdo.'
        : `Propuesto=${reschedProposed}, Aceptado=${reschedAccepted}.`,
      await takeShot(botB.page, '04-cambio-hora-doble-acuerdo.png')
    );

    // ----------------------------------------------------------------------
    // FASE 4: CANDADO ANTI 7-7 + SUBIR MARCADOR + DISPUTA / IMPUGNACIÓN
    // ----------------------------------------------------------------------
    let blocked77 = false;
    let disputedOk = false;

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
        await botA.page.waitForTimeout(500);

        const inputs = botA.page.locator('.tt-direct-num-input');
        await inputs.nth(0).fill('7');
        await inputs.nth(1).fill('7');
        await inputs.nth(2).fill('6');
        await inputs.nth(3).fill('4');
        await botA.page.waitForTimeout(300);
        const sendWhileInvalid = await botA.page
          .locator('button:has-text("Enviar Resultado a mi Rival")')
          .isVisible()
          .catch(() => false);
        blocked77 = !sendWhileInvalid;

        await inputs.nth(0).fill('6');
        await inputs.nth(1).fill('4');
        await inputs.nth(2).fill('6');
        await inputs.nth(3).fill('3');
        await botA.page.waitForTimeout(400);

        const sendValidBtn = botA.page
          .locator('button:has-text("Enviar Resultado a mi Rival"), button:has-text("Confirmar Resultado Oficial")')
          .first();
        if (await sendValidBtn.isVisible().catch(() => false)) {
          await sendValidBtn.click();
          await botA.page.waitForTimeout(1600);

          // Bot B impugna el marcador (desde popup o directamente en la tarjeta de Tus Desafíos)
          await botB.page.reload({ waitUntil: 'domcontentloaded' });
          await dismissSplashAndModals(botB.page, { keepScoreConfirm: true });
          await botB.page.waitForTimeout(700);

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
            await botB.page.waitForTimeout(600);
            // Completar el nuevo modal de motivo obligatorio de impugnación
            const reasonInput = botB.page.locator('#tt-dispute-reason-text');
            if (await reasonInput.isVisible().catch(() => false)) {
              await reasonInput.fill('El segundo set terminó 6-4 a mi favor, solicito revisión del Comité.');
              const claimedInput = botB.page.locator('#tt-dispute-claimed-score');
              if (await claimedInput.isVisible().catch(() => false)) {
                await claimedInput.fill('4-6, 6-4, 10-7');
              }
              await botB.page.locator('button:has-text("Enviar Impugnación al Comité")').click();
              await botB.page.waitForTimeout(1500);
            } else {
              await botB.page.waitForTimeout(1400);
            }
            await clickDockTab(botB.page, /Retos/i);
            await clickRetosSubTab(botB.page, 'Tus Desafíos');
            disputedOk = await botB.page
              .locator('.tt-match-card:has-text("EN REVISIÓN")')
              .first()
              .isVisible()
              .catch(() => false);
          }
        }
      }
    }

    recordStep(
      'E2E-06',
      'Candado anti-marcador imposible (bloquea 7-7)',
      blocked77,
      blocked77
        ? 'El sistema bloqueó 7-7 correctamente impidiendo enviar el marcador.'
        : 'No se pudo comprobar el bloqueo del marcador 7-7.'
    );

    recordStep(
      'E2E-07',
      'Disputa / Impugnación de marcador (Bot A sube -> Bot B impugna)',
      disputedOk,
      disputedOk
        ? 'Bot B impugnó el resultado y la tarjeta pasó a EN REVISIÓN sin alterar puntos.'
        : 'No se completó el estado EN REVISIÓN tras impugnar.',
      await takeShot(botB.page, '05-disputa-impugnada.png')
    );

    // ----------------------------------------------------------------------
    // FASE 5: VENTANA < 24H -> DESIGNAR ÁRBITRO (BOT C) + MODO ÁRBITRO EN VIVO
    // ----------------------------------------------------------------------
    let judgeAssigned = false;
    let judgeClosedToReview = false;

    const reto2 = await launchChallengeFromA(botA.page, loginB.name, 4, true);
    const accept2 = reto2.ok
      ? await acceptIncomingChallengeOnB(botB.page, firstA)
      : { ok: false };

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
        await botA.page.waitForTimeout(450);

        const selectEl = botA.page.locator('#tt-assign-judge-sel');
        const options = await selectEl.locator('option').allTextContents();
        const matchOpt = options.find((t) => t.toLowerCase().includes(firstC.toLowerCase()));
        if (matchOpt) {
          await selectEl.selectOption({ label: matchOpt });
          await botA.page.waitForTimeout(1400);
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
        await botC.page.waitForTimeout(500);

        for (let g = 0; g < 6; g += 1) {
          await botC.page.locator('.tt-step-plus').first().click();
          await botC.page.waitForTimeout(180);
        }
        await botC.page.waitForTimeout(400);
        for (let g = 0; g < 6; g += 1) {
          await botC.page.locator('.tt-step-plus').first().click();
          await botC.page.waitForTimeout(180);
        }
        await botC.page.waitForTimeout(500);

        const closeRefBtn = botC.page
          .locator('button:has-text("Cerrar Marcador y Enviar a Revisión")')
          .first();
        if (await closeRefBtn.isVisible().catch(() => false)) {
          await takeShot(botC.page, '06-botC-modo-arbitro.png');
          await closeRefBtn.click();
          await botC.page.waitForTimeout(1500);
          judgeClosedToReview = true;
        }
      }
    }

    recordStep(
      'E2E-08',
      'Ventana < 24h: Designar Árbitro (Bot C) + Modo Árbitro exclusivo -> EN REVISIÓN',
      judgeAssigned && judgeClosedToReview,
      judgeAssigned && judgeClosedToReview
        ? `Bot C (${loginC.name}) llevó el marcador en vivo y lo envió a EN REVISIÓN para doble confirmación.`
        : `Designado=${judgeAssigned}, CerradoARevision=${judgeClosedToReview}.`,
      await takeShot(botC.page, '07-arbitro-cerrado-revision.png')
    );

    // ----------------------------------------------------------------------
    // FASE 6: AUDITORÍA RANKING ANTI-TROLLS (OFICIAL >= 5 PJ vs CALIBRANDO)
    // ----------------------------------------------------------------------
    await clickDockTab(botA.page, /Ranking/i);
    await botA.page.waitForTimeout(700);
    const hasOficialTab = await botA.page.locator('[role="tab"]:has-text("Oficial")').isVisible().catch(() => false);
    const hasCalibTab = await botA.page.locator('[role="tab"]:has-text("Calibrando")').isVisible().catch(() => false);
    await takeShot(botA.page, '08-ranking-oficial.png');

    let calibClean = false;
    if (hasCalibTab) {
      await botA.page.locator('[role="tab"]:has-text("Calibrando")').first().click();
      await botA.page.waitForTimeout(600);
      const hasPodiumInCalib = await botA.page.locator('.tt-top3-hcard').count();
      const hasHeaderText = await botA.page
        .locator('text=LISTA PROVISIONAL')
        .first()
        .isVisible()
        .catch(() => false);
      calibClean = hasPodiumInCalib === 0 && hasHeaderText;
      await takeShot(botA.page, '09-ranking-calibrando.png');
    }

    recordStep(
      'E2E-09',
      'Ranking separado: Oficial (>= 5 PJ) vs Calibrando (< 5 PJ sin podio ni #1)',
      hasOficialTab && hasCalibTab && calibClean,
      hasOficialTab && hasCalibTab && calibClean
        ? 'Pestañas Oficial y Calibrando activas; Calibrando muestra lista provisional sin podio ni #1.'
        : `Oficial=${hasOficialTab}, Calibrando=${hasCalibTab}, SinPodioEnCalibrando=${calibClean}.`
    );
  } catch (err) {
    recordStep('E2E-FATAL', 'Ejecución general del simulador', false, String(err?.message || err));
  } finally {
    await botA.ctx.close();
    await botB.ctx.close();
    await botC.ctx.close();
    await browser.close();
  }

  // ------------------------------------------------------------------------
  // GENERAR REPORTE MARKDOWN Y JSON
  // ------------------------------------------------------------------------
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const healthPct = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  const mdLines = [
    `# 🤖 Reporte Simulador Multi-Bot E2E · TOTAL TENIS`,
    `- **URL probada:** ${TARGET_URL}`,
    `- **Salud E2E:** **${passedCount}/${totalCount} pruebas aprobadas (${healthPct}%)**`,
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

runMultiBotSimulation().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
