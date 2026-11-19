import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ASSETS,
  IconBadge,
  ModalPortal,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import {
  INITIAL_CLUBS,
  getCategoryByPoints,
  getClubById,
} from '../data/playersAndClubsData';

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (CAMBIA ARROBA, MARCOS O SPONSOR AQUÍ)
   --------------------------------------------------------------------------
   - Todos los pósteres se renderizan en 1080 × 1920 px reales (9:16 HD).
   - sponsorLine: déjalo vacío '' hasta cerrar auspicio real.
   ========================================================================== */
export const STORIES_EDITABLE_CONFIG = {
  brandName: 'TOTAL TENIS',
  brandHandle: '@TotalTenis.Oficial',
  cityLabel: 'HUANCAYO · CIRCUITO OFICIAL',
  sponsorLine: '', // Ej. 'PRESENTADO POR WILSON PERÚ'
  defaultHashtags: '#TotalTenis #TenisHuancayo #Arcilla',
  canvasWidth: 1080,
  canvasHeight: 1920,
  templates: {
    victory_dark: {
      id: 'victory_dark',
      label: 'Victoria Noche',
      frameSrc: '/assets/story-marco-victoria-oscuro.png',
      logoSrc: ASSETS.logoBlanco || '/assets/logo-matchpoint-blanco.png',
    },
    victory_light: {
      id: 'victory_light',
      label: 'Victoria Claro',
      frameSrc: '/assets/story-marco-victoria-claro.png',
      logoSrc: ASSETS.logoOscuro || '/assets/logo-matchpoint-oscuro.png',
    },
    duel: {
      id: 'duel',
      label: 'Duelo VS',
      frameSrc: '/assets/story-marco-duelo.png',
      logoSrc: ASSETS.logoBlanco || '/assets/logo-matchpoint-blanco.png',
    },
    roundup: {
      id: 'roundup',
      label: 'Resumen Jornada',
      bgSrc: '/assets/story-roundup-jornada.jpg',
      logoSrc: ASSETS.logoOscuro || '/assets/logo-matchpoint-oscuro.png',
    },
  },
};

const QUICK_TAGLINES = [
  'Gran batalla en arcilla',
  'Sumando puntos oficiales',
  'Nos vemos en la cancha',
  'Camino al Master Top 8',
];

/* ==========================================================================
   UTILIDADES SEGURAS DE CANVAS 2D (COMPATIBLE CON IPHONE IOS 14+ Y ANDROID)
   ========================================================================== */
function loadImageSafe(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    if (!String(src).startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCoverImage(ctx, img, x, y, w, h, focalY = 0.24) {
  if (!img || !img.width || !img.height) return;
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) * focalY;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawCircleAvatar(ctx, img, cx, cy, r, ringColor, ringWidth, initials = 'TT') {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#250942';
  ctx.fill();
  ctx.clip();

  if (img) {
    drawCoverImage(ctx, img, cx - r, cy - r, r * 2, r * 2, 0.2);
  } else {
    ctx.fillStyle = '#00DC7D';
    ctx.font = `900 ${Math.round(r * 0.72)}px "Antonio", "Outfit", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, cx, cy + 4);
  }
  ctx.restore();

  if (ringWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = ringWidth;
    ctx.strokeStyle = ringColor;
    ctx.stroke();
    ctx.restore();
  }
}

function getInitials(name = 'TT') {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase() || 'TT';
}

function fitTextSingleLine(ctx, text, maxWidth, baseSize, minSize, fontTemplate) {
  let size = baseSize;
  const str = String(text || '');
  while (size > minSize) {
    ctx.font = fontTemplate.replace('{size}', String(size));
    if (ctx.measureText(str).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function formatStoryDate(isoStr, fallback) {
  if (!isoStr) {
    return (
      fallback ||
      new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase()
    );
  }
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return fallback || 'TEMPORADA OFICIAL';
  return d
    .toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase();
}

/* ==========================================================================
   MOTOR DE RENDERIZADO 9:16 (1080 × 1920 PX) PARA LAS 4 PLANTILLAS
   ========================================================================== */
async function renderStoryCanvas({
  canvas,
  templateId,
  matchData,
  playerA,
  playerB,
  clubA,
  clubB,
  customBgPhoto,
  tagline,
  showEloDelta,
  recentRoundupMatches,
  playersMap,
}) {
  const ctx = canvas.getContext('2d');
  const W = STORIES_EDITABLE_CONFIG.canvasWidth;
  const H = STORIES_EDITABLE_CONFIG.canvasHeight;
  canvas.width = W;
  canvas.height = H;

  const tpl =
    STORIES_EDITABLE_CONFIG.templates[templateId] ||
    STORIES_EDITABLE_CONFIG.templates.victory_dark;

  const isLightVictory = templateId === 'victory_light';
  const isWinnerA = matchData?.winnerId ? matchData.winnerId === playerA?.id : true;
  const winner = isWinnerA ? playerA : playerB;
  const loser = isWinnerA ? playerB : playerA;
  const winnerClub = isWinnerA ? clubA : clubB;
  const winnerDelta = isWinnerA ? matchData?.eloDeltaA : matchData?.eloDeltaB;
  const scoreText = matchData?.scoreSummary || '6-4 · 6-3';
  const venueText = (matchData?.clubName || winnerClub?.name || 'CIRCUITO OFICIAL').toUpperCase();
  const dateText = formatStoryDate(matchData?.scheduledIso, matchData?.dateLabel);

  // Precarga paralela segura de todos los recursos visuales necesarios
  const [
    frameOrBgImg,
    logoImg,
    customPhotoImg,
    avatarAImg,
    avatarBImg,
    clubALogoImg,
    clubBLogoImg,
  ] = await Promise.all([
    loadImageSafe(tpl.frameSrc || tpl.bgSrc),
    loadImageSafe(tpl.logoSrc),
    loadImageSafe(customBgPhoto),
    loadImageSafe(playerA?.fullBodyPhoto || playerA?.avatar),
    loadImageSafe(playerB?.fullBodyPhoto || playerB?.avatar),
    loadImageSafe(clubA?.logo),
    loadImageSafe(clubB?.logo),
  ]);

  /* ------------------------------------------------------------------------
     PLANTILLA 1 y 2: VICTORIA NOCHE & VICTORIA EDITORIAL CLARO
     ------------------------------------------------------------------------ */
  if (templateId === 'victory_dark' || templateId === 'victory_light') {
    const bgMain = isLightVictory ? '#FAF9F5' : '#1E0734';
    const textMain = isLightVictory ? '#1E0734' : '#FAF9F5';
    const accent = isLightVictory ? '#C85A32' : '#00DC7D';
    const accentSoft = isLightVictory ? '#1E0734' : '#7CF5C0';

    // 1. Fondo base
    ctx.fillStyle = bgMain;
    ctx.fillRect(0, 0, W, H);

    // 2. Foto central de acción/celebración (rellena la ventana transparente del marco)
    const centerImg = customPhotoImg || (isWinnerA ? avatarAImg : avatarBImg);
    ctx.save();
    drawRoundedRectPath(ctx, 24, 270, W - 48, 1280, 26);
    ctx.clip();
    if (centerImg) {
      drawCoverImage(ctx, centerImg, 24, 270, W - 48, 1280, 0.2);
    } else {
      const grad = ctx.createLinearGradient(0, 270, W, 1550);
      grad.addColorStop(0, '#2B0B4C');
      grad.addColorStop(1, '#120321');
      ctx.fillStyle = grad;
      ctx.fillRect(24, 270, W - 48, 1280);
    }

    // Degradado protector inferior sobre la foto para contraste absoluto del titular
    const scrim = ctx.createLinearGradient(0, 820, 0, 1550);
    scrim.addColorStop(0, 'rgba(18, 3, 33, 0)');
    scrim.addColorStop(0.58, 'rgba(18, 3, 33, 0.72)');
    scrim.addColorStop(1, 'rgba(16, 3, 29, 0.96)');
    ctx.fillStyle = scrim;
    ctx.fillRect(24, 270, W - 48, 1280);
    ctx.restore();

    // 3. Superponer marco PNG oficial de Canva si existe; si no, marco editorial programático
    if (frameOrBgImg) {
      ctx.drawImage(frameOrBgImg, 0, 0, W, H);
    } else {
      // Cabecera superior editorial
      ctx.fillStyle = bgMain;
      ctx.fillRect(0, 0, W, 268);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 264, W, 6);

      // Pie inferior editorial
      ctx.fillStyle = bgMain;
      ctx.fillRect(0, 1546, W, H - 1546);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 1546, W, 6);

      // Bordes laterales finos
      ctx.fillStyle = bgMain;
      ctx.fillRect(0, 0, 20, H);
      ctx.fillRect(W - 20, 0, 20, H);

      // Logotipo o marca superior
      if (logoImg) {
        const lh = 104;
        const lw = Math.min(340, (logoImg.width / Math.max(1, logoImg.height)) * lh);
        ctx.drawImage(logoImg, (W - lw) / 2, 74, lw, lh);
      } else {
        ctx.fillStyle = textMain;
        ctx.font = 'italic 900 72px "Antonio", "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(STORIES_EDITABLE_CONFIG.brandName, W / 2, 128);
      }

      ctx.fillStyle = accent;
      ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(STORIES_EDITABLE_CONFIG.cityLabel, W / 2, 218);
    }

    // 4. Insignia superior sobre la foto (VICTORIA OFICIAL)
    ctx.save();
    drawRoundedRectPath(ctx, (W - 390) / 2, 316, 390, 62, 31);
    ctx.fillStyle = 'rgba(18, 3, 33, 0.84)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = accent;
    ctx.stroke();
    ctx.fillStyle = isLightVictory ? '#FAF9F5' : '#00DC7D';
    ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VICTORIA OFICIAL', W / 2, 348);
    ctx.restore();

    // 5. Bloque del Ganador sobre la zona baja de la foto
    const winnerName = (winner?.name || 'GANADOR OFICIAL').toUpperCase();
    const wFontSize = fitTextSingleLine(
      ctx,
      winnerName,
      W - 140,
      96,
      54,
      'italic 900 {size}px "Antonio", "Outfit", sans-serif'
    );
    ctx.font = `italic 900 ${wFontSize}px "Antonio", "Outfit", sans-serif`;
    ctx.fillStyle = '#FAF9F5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(winnerName, W / 2, 1235);

    // Subtítulo: Categoría + Club + Rival vencido
    const winnerCat = getCategoryByPoints(winner?.points).name.toUpperCase();
    const vsLine = loser?.name
      ? `VENCIÓ A ${loser.name.toUpperCase()}  ·  ${winnerCat}`
      : `${winnerCat}  ·  ${winnerClub?.shortName?.toUpperCase() || 'INDEPENDIENTE'}`;
    const subSize = fitTextSingleLine(
      ctx,
      vsLine,
      W - 140,
      30,
      20,
      '800 {size}px "Plus Jakarta Sans", sans-serif'
    );
    ctx.font = `800 ${subSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#7CF5C0';
    ctx.fillText(vsLine, W / 2, 1290);

    // Marcador gigante estilo transmisión oficial
    ctx.save();
    drawRoundedRectPath(ctx, 130, 1326, W - 260, 122, 26);
    ctx.fillStyle = 'rgba(18, 3, 33, 0.9)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00DC7D';
    ctx.stroke();

    const scSize = fitTextSingleLine(
      ctx,
      scoreText,
      W - 320,
      70,
      40,
      '900 {size}px "Antonio", "Outfit", sans-serif'
    );
    ctx.font = `900 ${scSize}px "Antonio", "Outfit", sans-serif`;
    ctx.fillStyle = '#00DC7D';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scoreText, W / 2, 1388);
    ctx.restore();

    // Frase personalizada del jugador
    if (tagline?.trim()) {
      ctx.fillStyle = 'rgba(250, 249, 245, 0.88)';
      ctx.font = 'italic 700 28px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`«${tagline.trim()}»`, W / 2, 1502);
    }

    // 6. Franja inferior limpia: PUNTOS SIN DOBLE "VS" (ej. 3,080 PTS   VS   4,320 PTS)
    const ptsA = `${Number(playerA?.points || 0).toLocaleString('es-PE')} PTS`;
    const ptsB = `${Number(playerB?.points || 0).toLocaleString('es-PE')} PTS`;
    const cleanPointsComparison = `${ptsA}    VS    ${ptsB}`;

    ctx.fillStyle = textMain;
    ctx.font = '900 42px "Antonio", "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanPointsComparison, W / 2, 1622);

    // Delta ELO opcional + Sede y Fecha
    const deltaChip =
      showEloDelta && typeof winnerDelta === 'number' && winnerDelta > 0
        ? `   ·   +${winnerDelta} PTS OFICIALES`
        : '';
    ctx.fillStyle = accentSoft;
    ctx.font = '800 25px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${venueText}  ·  ${dateText}${deltaChip}`, W / 2, 1694);

    // Handle oficial + Sponsor opcional
    ctx.fillStyle = isLightVictory ? 'rgba(30, 7, 52, 0.7)' : 'rgba(250, 249, 245, 0.72)';
    ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
    const footerLine = STORIES_EDITABLE_CONFIG.sponsorLine
      ? `${STORIES_EDITABLE_CONFIG.brandHandle}  ·  ${STORIES_EDITABLE_CONFIG.sponsorLine}`
      : STORIES_EDITABLE_CONFIG.brandHandle;
    ctx.fillText(footerLine, W / 2, 1814);

    return;
  }

  /* ------------------------------------------------------------------------
     PLANTILLA 3: ANUNCIO DUELO VS (DIVISIÓN DIAGONAL ARRIBA / ABAJO)
     ------------------------------------------------------------------------ */
  if (templateId === 'duel') {
    ctx.fillStyle = '#1E0734';
    ctx.fillRect(0, 0, W, H);

    // Mitad Superior: Jugador A
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 220);
    ctx.lineTo(W, 220);
    ctx.lineTo(W, 910);
    ctx.lineTo(0, 1020);
    ctx.closePath();
    ctx.clip();
    if (avatarAImg) {
      drawCoverImage(ctx, avatarAImg, 0, 220, W, 820, 0.18);
    } else {
      ctx.fillStyle = '#2A0B4B';
      ctx.fillRect(0, 220, W, 820);
    }
    const gA = ctx.createLinearGradient(0, 220, 0, 1020);
    gA.addColorStop(0, 'rgba(20, 4, 36, 0.55)');
    gA.addColorStop(1, 'rgba(20, 4, 36, 0.86)');
    ctx.fillStyle = gA;
    ctx.fillRect(0, 220, W, 820);
    ctx.restore();

    // Mitad Inferior: Jugador B
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 1020);
    ctx.lineTo(W, 910);
    ctx.lineTo(W, 1690);
    ctx.lineTo(0, 1690);
    ctx.closePath();
    ctx.clip();
    if (avatarBImg) {
      drawCoverImage(ctx, avatarBImg, 0, 910, W, 800, 0.18);
    } else {
      ctx.fillStyle = '#150427';
      ctx.fillRect(0, 910, W, 800);
    }
    const gB = ctx.createLinearGradient(0, 910, 0, 1690);
    gB.addColorStop(0, 'rgba(20, 4, 36, 0.65)');
    gB.addColorStop(1, 'rgba(16, 3, 29, 0.94)');
    ctx.fillStyle = gB;
    ctx.fillRect(0, 910, W, 800);
    ctx.restore();

    // Superponer PNG oficial de Canva si existe; si no, franja diagonal esmeralda + medallón VS
    if (frameOrBgImg) {
      ctx.drawImage(frameOrBgImg, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#1E0734';
      ctx.fillRect(0, 0, W, 220);
      ctx.fillRect(0, 1690, W, H - 1690);

      // Franja diagonal esmeralda
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 1020);
      ctx.lineTo(W, 910);
      ctx.lineWidth = 22;
      ctx.strokeStyle = '#00DC7D';
      ctx.stroke();
      ctx.restore();

      // Medallón central VS
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, 965, 84, 0, Math.PI * 2);
      ctx.fillStyle = '#1E0734';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#00DC7D';
      ctx.stroke();
      ctx.restore();
    }

    // Texto VS único en el medallón central
    ctx.fillStyle = '#00DC7D';
    ctx.font = 'italic 900 72px "Antonio", "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', W / 2, 968);

    // Cabecera superior
    ctx.fillStyle = '#00DC7D';
    ctx.font = '900 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('DUELO OFICIAL CONFIRMADO', W / 2, 86);
    ctx.fillStyle = '#FAF9F5';
    ctx.font = 'italic 900 58px "Antonio", "Outfit", sans-serif';
    ctx.fillText(STORIES_EDITABLE_CONFIG.brandName, W / 2, 154);

    // Bloque Identidad Jugador A (Arriba)
    drawCircleAvatar(ctx, avatarAImg, 175, 620, 96, '#00DC7D', 8, getInitials(playerA?.name));
    if (clubALogoImg) {
      drawCircleAvatar(ctx, clubALogoImg, 245, 692, 34, '#1E0734', 5, '');
    }
    ctx.textAlign = 'left';
    const nameASize = fitTextSingleLine(
      ctx,
      (playerA?.name || 'JUGADOR A').toUpperCase(),
      700,
      74,
      44,
      'italic 900 {size}px "Antonio", "Outfit", sans-serif'
    );
    ctx.font = `italic 900 ${nameASize}px "Antonio", "Outfit", sans-serif`;
    ctx.fillStyle = '#FAF9F5';
    ctx.fillText((playerA?.name || 'JUGADOR A').toUpperCase(), 304, 594);

    ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#00DC7D';
    ctx.fillText(
      `${getCategoryByPoints(playerA?.points).name.toUpperCase()}  ·  ${Number(
        playerA?.points || 0
      ).toLocaleString('es-PE')} PTS`,
      304,
      656
    );
    ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(250, 249, 245, 0.8)';
    ctx.fillText(clubA ? clubA.name : 'Jugador Independiente', 304, 704);

    // Bloque Identidad Jugador B (Abajo)
    drawCircleAvatar(ctx, avatarBImg, W - 175, 1340, 96, '#F59E0B', 8, getInitials(playerB?.name));
    if (clubBLogoImg) {
      drawCircleAvatar(ctx, clubBLogoImg, W - 245, 1412, 34, '#1E0734', 5, '');
    }
    ctx.textAlign = 'right';
    const nameBSize = fitTextSingleLine(
      ctx,
      (playerB?.name || 'JUGADOR B').toUpperCase(),
      700,
      74,
      44,
      'italic 900 {size}px "Antonio", "Outfit", sans-serif'
    );
    ctx.font = `italic 900 ${nameBSize}px "Antonio", "Outfit", sans-serif`;
    ctx.fillStyle = '#FAF9F5';
    ctx.fillText((playerB?.name || 'JUGADOR B').toUpperCase(), W - 304, 1314);

    ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FDE68A';
    ctx.fillText(
      `${getCategoryByPoints(playerB?.points).name.toUpperCase()}  ·  ${Number(
        playerB?.points || 0
      ).toLocaleString('es-PE')} PTS`,
      W - 304,
      1376
    );
    ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(250, 249, 245, 0.8)';
    ctx.fillText(clubB ? clubB.name : 'Jugador Independiente', W - 304, 1424);

    // Pie de Sede, Fecha y Handle
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00DC7D';
    ctx.font = '900 34px "Antonio", "Outfit", sans-serif';
    ctx.fillText(`${venueText}  ·  ${dateText}`, W / 2, 1762);

    ctx.fillStyle = 'rgba(250, 249, 245, 0.78)';
    ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      tagline?.trim()
        ? `${tagline.trim()}  ·  ${STORIES_EDITABLE_CONFIG.brandHandle}`
        : STORIES_EDITABLE_CONFIG.brandHandle,
      W / 2,
      1832
    );

    return;
  }

  /* ------------------------------------------------------------------------
     PLANTILLA 4: RESUMEN JORNADA (EDITORIAL MARFIL + HASTA 4 RESULTADOS)
     ------------------------------------------------------------------------ */
  ctx.fillStyle = '#FAF9F5';
  ctx.fillRect(0, 0, W, H);

  if (frameOrBgImg) {
    drawCoverImage(ctx, frameOrBgImg, 0, 0, W, H, 0.5);
    // Velo suave para que las tarjetas oscuras destaquen limpias
    ctx.fillStyle = 'rgba(250, 249, 245, 0.74)';
    ctx.fillRect(0, 0, W, H);
  } else {
    // Geometría minimalista de cancha en Verde Esmeralda
    ctx.strokeStyle = 'rgba(0, 220, 125, 0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(54, 54, W - 108, H - 108);
    ctx.beginPath();
    ctx.moveTo(54, H / 2);
    ctx.lineTo(W - 54, H / 2);
    ctx.stroke();
  }

  // Cabecera Resumen Jornada
  ctx.fillStyle = '#008A4E';
  ctx.font = '900 28px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(STORIES_EDITABLE_CONFIG.cityLabel, W / 2, 138);

  ctx.fillStyle = '#1E0734';
  ctx.font = 'italic 900 94px "Antonio", "Outfit", sans-serif';
  ctx.fillText('RESUMEN JORNADA', W / 2, 232);

  ctx.fillStyle = '#C85A32';
  ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(dateText, W / 2, 312);

  // Lista de hasta 4 resultados oficiales recientes
  const rowsToDraw = (recentRoundupMatches || []).slice(0, 4);
  const startY = 394;
  const cardH = 304;
  const gap = 28;

  if (rowsToDraw.length === 0) {
    drawRoundedRectPath(ctx, 84, 580, W - 168, 280, 32);
    ctx.fillStyle = '#1E0734';
    ctx.fill();
    ctx.fillStyle = '#FAF9F5';
    ctx.font = '800 38px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Jornada en curso · TOTAL TENIS', W / 2, 720);
  } else {
    rowsToDraw.forEach((m, idx) => {
      const y = startY + idx * (cardH + gap);
      const pA = playersMap[m.playerAId];
      const pB = playersMap[m.playerBId];
      const winA = m.winnerId === m.playerAId;
      const winB = m.winnerId === m.playerBId;

      ctx.save();
      drawRoundedRectPath(ctx, 74, y, W - 148, cardH, 30);
      ctx.fillStyle = '#1E0734';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 220, 125, 0.55)';
      ctx.stroke();

      // Barra superior de sede
      ctx.fillStyle = '#7CF5C0';
      ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText((m.clubName || 'SEDE OFICIAL').toUpperCase(), 116, y + 48);

      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(250, 249, 245, 0.72)';
      ctx.fillText(m.mode === 'Amistoso' ? 'AMISTOSO' : 'OFICIAL', W - 116, y + 48);

      // Línea divisoria
      ctx.fillStyle = 'rgba(250, 249, 245, 0.14)';
      ctx.fillRect(116, y + 74, W - 232, 2);

      // Fila Jugador A
      ctx.textAlign = 'left';
      ctx.fillStyle = winA ? '#00DC7D' : '#FAF9F5';
      ctx.font = `${winA ? '900' : '700'} 42px "Antonio", "Outfit", sans-serif`;
      ctx.fillText((pA?.name || 'JUGADOR A').toUpperCase(), 116, y + 142);

      ctx.textAlign = 'right';
      ctx.font = '900 44px "Antonio", "Outfit", sans-serif';
      ctx.fillText(
        `${m.liveScore?.set1?.a ?? 0}   ${m.liveScore?.set2?.a ?? 0}${winA ? '  ◀' : ''}`,
        W - 116,
        y + 142
      );

      // Fila Jugador B
      ctx.textAlign = 'left';
      ctx.fillStyle = winB ? '#00DC7D' : '#FAF9F5';
      ctx.font = `${winB ? '900' : '700'} 42px "Antonio", "Outfit", sans-serif`;
      ctx.fillText((pB?.name || 'JUGADOR B').toUpperCase(), 116, y + 224);

      ctx.textAlign = 'right';
      ctx.font = '900 44px "Antonio", "Outfit", sans-serif';
      ctx.fillText(
        `${m.liveScore?.set1?.b ?? 0}   ${m.liveScore?.set2?.b ?? 0}${winB ? '  ◀' : ''}`,
        W - 116,
        y + 224
      );

      ctx.restore();
    });
  }

  // Pie de página Resumen Jornada
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1E0734';
  ctx.font = 'italic 900 48px "Antonio", "Outfit", sans-serif';
  ctx.fillText(STORIES_EDITABLE_CONFIG.brandName, W / 2, 1764);

  ctx.fillStyle = '#008A4E';
  ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(STORIES_EDITABLE_CONFIG.brandHandle, W / 2, 1826);
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: StoriesStudioModal (BLOQUE 17 DE 26)
   ========================================================================== */
export default function StoriesStudioModal({
  isOpen = false,
  onClose,
  initialPayload = null, // { challenge, playerA, playerB, presetMode }
  currentUser = null,
  players = [],
  clubs = INITIAL_CLUBS,
  challenges = [],
  theme = 'dark',
  onNotify,
}) {
  const canvasRef = useRef(null);
  const photoInputRef = useRef(null);

  const [templateId, setTemplateId] = useState('victory_dark');
  const [selectedMatchId, setSelectedMatchId] = useState('INITIAL');
  const [customBgPhoto, setCustomBgPhoto] = useState('');
  const [tagline, setTagline] = useState(QUICK_TAGLINES[0]);
  const [showEloDelta, setShowEloDelta] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Mapa rápido de jugadores
  const playersMap = useMemo(() => {
    const map = {};
    (players || []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [players]);

  // Partidos disponibles (prioriza partidos finalizados del usuario actual)
  const finishedChallenges = useMemo(
    () => (challenges || []).filter((c) => c.status === 'FINISHED'),
    [challenges]
  );

  const selectableMatches = useMemo(() => {
    const mine = currentUser?.id
      ? finishedChallenges.filter(
          (c) => c.playerAId === currentUser.id || c.playerBId === currentUser.id
        )
      : [];
    const others = finishedChallenges.filter((c) => !mine.some((m) => m.id === c.id));
    return [...mine, ...others].slice(0, 8);
  }, [finishedChallenges, currentUser?.id]);

  // Sincronizar preset al abrir
  useEffect(() => {
    if (!isOpen) return;
    if (initialPayload?.presetMode === 'duel') {
      setTemplateId('duel');
    } else if (initialPayload?.presetMode === 'roundup') {
      setTemplateId('roundup');
    } else {
      setTemplateId(theme === 'light' ? 'victory_light' : 'victory_dark');
    }
    setSelectedMatchId(initialPayload?.challenge?.id || selectableMatches[0]?.id || 'INITIAL');
    setCustomBgPhoto('');
  }, [isOpen, initialPayload, theme, selectableMatches]);

  // Resolver partido y protagonistas activos
  const resolvedData = useMemo(() => {
    const foundById = (challenges || []).find((c) => c.id === selectedMatchId);
    const activeMatch =
      foundById ||
      initialPayload?.challenge ||
      selectableMatches[0] || {
        id: 'demo-story',
        clubName: clubs?.[0]?.name || 'Country Club Los Huancas',
        scoreSummary: '6-4 · 6-3',
        winnerId: currentUser?.id || players?.[0]?.id,
        eloDeltaA: 36,
        eloDeltaB: -22,
        scheduledIso: new Date().toISOString(),
      };

    const pA =
      playersMap[activeMatch.playerAId] ||
      initialPayload?.playerA ||
      currentUser ||
      players?.[0] ||
      null;
    const pB =
      playersMap[activeMatch.playerBId] ||
      initialPayload?.playerB ||
      players?.find((p) => p.id !== pA?.id) ||
      null;

    return {
      match: activeMatch,
      playerA: pA,
      playerB: pB,
      clubA: getClubById(clubs, pA?.clubId),
      clubB: getClubById(clubs, pB?.clubId),
    };
  }, [
    challenges,
    selectedMatchId,
    initialPayload,
    selectableMatches,
    clubs,
    currentUser,
    players,
    playersMap,
  ]);

  // Renderizar lienzo 1080 × 1920 en vivo con protección contra race conditions
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    let cancelled = false;

    setIsRendering(true);
    renderStoryCanvas({
      canvas: canvasRef.current,
      templateId,
      matchData: resolvedData.match,
      playerA: resolvedData.playerA,
      playerB: resolvedData.playerB,
      clubA: resolvedData.clubA,
      clubB: resolvedData.clubB,
      customBgPhoto,
      tagline,
      showEloDelta,
      recentRoundupMatches: finishedChallenges,
      playersMap,
    }).finally(() => {
      if (!cancelled) setIsRendering(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    templateId,
    resolvedData,
    customBgPhoto,
    tagline,
    showEloDelta,
    finishedChallenges,
    playersMap,
  ]);

  /* ------------------------------------------------------------------------
     ACCIONES: SUBIR FOTO EN CANCHA, COMPARTIR NATIVO Y DESCARGAR PNG HD
     ------------------------------------------------------------------------ */
  const handlePickCustomPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomBgPhoto(String(reader.result || ''));
      triggerHaptic('success');
      if (onNotify) onNotify('Foto aplicada dentro del marco 9:16.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const getCanvasPngBlob = () =>
    new Promise((resolve) => {
      if (!canvasRef.current) {
        resolve(null);
        return;
      }
      canvasRef.current.toBlob((blob) => resolve(blob), 'image/png', 1);
    });

  const handleDownloadPng = async () => {
    triggerHaptic('success');
    const blob = await getCanvasPngBlob();
    if (!blob) {
      if (onNotify) onNotify('No pudimos exportar la imagen en este momento.', 'warning');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TotalTenis-Story-${templateId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onNotify) onNotify('Póster 9:16 HD guardado en tu dispositivo.', 'success');
  };

  const handleNativeShare = async () => {
    setIsSharing(true);
    triggerHaptic('medium');
    try {
      const blob = await getCanvasPngBlob();
      if (!blob) throw new Error('Sin imagen');

      const file = new File([blob], `TotalTenis-Story-${templateId}.png`, {
        type: 'image/png',
      });

      const shareText = `${STORIES_EDITABLE_CONFIG.brandName} · ${
        resolvedData.match?.scoreSummary || 'Circuito Oficial'
      } ${STORIES_EDITABLE_CONFIG.defaultHashtags}`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'TOTAL TENIS · Story Oficial',
          text: shareText,
          files: [file],
        });
        if (onNotify) onNotify('Listo para publicar en tus Stories.', 'success');
      } else {
        await handleDownloadPng();
        if (onNotify) {
          onNotify('Tu navegador descargó el PNG HD para subirlo directo a Instagram o WhatsApp.', 'info');
        }
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        await handleDownloadPng();
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyCaption = async () => {
    triggerHaptic('light');
    const caption = `🎾 ${resolvedData.playerA?.name || 'Partido'} vs. ${
      resolvedData.playerB?.name || 'Rival'
    } (${resolvedData.match?.scoreSummary || 'Oficial'}) en ${
      resolvedData.match?.clubName || 'cancha'
    }. ${STORIES_EDITABLE_CONFIG.brandHandle} ${STORIES_EDITABLE_CONFIG.defaultHashtags}`;
    try {
      await navigator.clipboard.writeText(caption);
      if (onNotify) onNotify('Texto y hashtags copiados para tu historia.', 'success');
    } catch (e) {
      if (onNotify) onNotify(caption, 'info');
    }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Publica tus victorias en Stories"
      subtitle="Crea tarjetas 9:16 HD listas para Instagram, WhatsApp y Facebook"
      icon={<IconBadge name="stories" variant="emerald" size={38} />}
      isWide
      isTopLayer
    >
      <div className={`tt-st-root ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
        {/* Selector de 4 Plantillas (Cero siglas externas -> "Resumen Jornada") */}
        <div className="tt-st-templates-bar" role="tablist" aria-label="Plantillas de Stories">
          {Object.values(STORIES_EDITABLE_CONFIG.templates).map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              role="tab"
              aria-selected={templateId === tpl.id}
              className={`tt-st-tpl-pill ${templateId === tpl.id ? 'is-active' : ''}`}
              onClick={() => {
                triggerHaptic('light');
                setTemplateId(tpl.id);
              }}
            >
              {tpl.label}
            </button>
          ))}
        </div>

        {/* Layout 2 columnas en tablet/desktop · Apilado ergonómico en móvil */}
        <div className="tt-st-workspace">
          {/* Izquierda: Previsualización real 9:16 del Canvas 1080 × 1920 */}
          <div className="tt-st-preview-col">
            <div className="tt-st-phone-frame">
              <canvas
                ref={canvasRef}
                className="tt-st-canvas"
                aria-label="Vista previa de historia 9:16 TOTAL TENIS"
              />
              {isRendering && (
                <div className="tt-st-rendering-pill">Actualizando HD...</div>
              )}
            </div>
            <span className="tt-st-res-caption">Formato nativo 1080 × 1920 px (9:16)</span>
          </div>

          {/* Derecha: Controles táctiles de personalización y exportación */}
          <div className="tt-st-controls-col">
            {/* Selector de partido reciente (solo en Victoria / Duelo) */}
            {templateId !== 'roundup' && selectableMatches.length > 0 && (
              <div className="tt-st-field">
                <label htmlFor="tt-st-match-sel">Partido a publicar</label>
                <select
                  id="tt-st-match-sel"
                  className="tt-st-select"
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                >
                  {selectableMatches.map((m) => {
                    const pA = playersMap[m.playerAId]?.name || 'Jugador A';
                    const pB = playersMap[m.playerBId]?.name || 'Jugador B';
                    return (
                      <option key={m.id} value={m.id}>
                        {pA} vs. {pB} ({m.scoreSummary || 'Oficial'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Subir foto propia en cancha para el marco Victoria */}
            {(templateId === 'victory_dark' || templateId === 'victory_light') && (
              <div className="tt-st-field">
                <label>Foto de fondo dentro del marco</label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePickCustomPhoto}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="tt-btn tt-btn-secondary tt-btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <TTIcon name="camera" size={16} />
                    {customBgPhoto ? 'Cambiar foto de cancha' : 'Subir mi foto en cancha'}
                  </button>
                  {customBgPhoto && (
                    <button
                      type="button"
                      className="tt-btn tt-btn-ghost tt-btn-sm"
                      onClick={() => setCustomBgPhoto('')}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Frase breve en el póster */}
            {templateId !== 'roundup' && (
              <div className="tt-st-field">
                <label htmlFor="tt-st-tagline">Frase destacada (opcional)</label>
                <input
                  id="tt-st-tagline"
                  type="text"
                  maxLength={46}
                  className="tt-st-input"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ej. Gran partido en arcilla..."
                />
                <div className="tt-st-quick-tags">
                  {QUICK_TAGLINES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={`tt-st-tag-chip ${tagline === q ? 'is-on' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setTagline(q);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interruptor de puntos ganados */}
            {(templateId === 'victory_dark' || templateId === 'victory_light') && (
              <div className="tt-st-toggle-row">
                <div>
                  <strong>Mostrar puntos ganados</strong>
                  <small>Incluye el incremento oficial en la franja inferior.</small>
                </div>
                <button
                  type="button"
                  className={`tt-st-switch ${showEloDelta ? 'is-on' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setShowEloDelta((v) => !v);
                  }}
                >
                  {showEloDelta ? 'Sí' : 'No'}
                </button>
              </div>
            )}

            {/* Botones de Acción Principal */}
            <div className="tt-st-actions-stack">
              <button
                type="button"
                className="tt-btn tt-btn-primary"
                style={{ width: '100%' }}
                disabled={isSharing}
                onClick={handleNativeShare}
              >
                <TTIcon name="stories" size={18} />
                {isSharing ? 'Preparando Story...' : 'Compartir en Stories (IG / WA / FB)'}
              </button>

              <div className="tt-st-secondary-row">
                <button
                  type="button"
                  className="tt-btn tt-btn-secondary tt-btn-sm"
                  style={{ flex: 1 }}
                  onClick={handleDownloadPng}
                >
                  Descargar PNG HD
                </button>
                <button
                  type="button"
                  className="tt-btn tt-btn-ghost tt-btn-sm"
                  onClick={handleCopyCaption}
                >
                  Copiar texto
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ESTILOS ENCAPSULADOS DEL ESTUDIO DE STORIES 9:16
          ==================================================================== */}
      <style>{`
        .tt-st-root {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-st-templates-bar {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          padding: 5px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        @media (min-width: 560px) {
          .tt-st-templates-bar {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .tt-st-tpl-pill {
          min-height: 38px;
          padding: 0 8px;
          border-radius: 11px;
          font-size: 0.74rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          white-space: nowrap;
        }
        .tt-st-tpl-pill.is-active {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-st-root.is-dark .tt-st-tpl-pill.is-active {
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
        }

        .tt-st-workspace {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 720px) {
          .tt-st-workspace {
            grid-template-columns: 270px 1fr;
            align-items: start;
          }
        }

        .tt-st-preview-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .tt-st-phone-frame {
          position: relative;
          width: 100%;
          max-width: 264px;
          aspect-ratio: 9 / 16;
          border-radius: 22px;
          overflow: hidden;
          background: #140324;
          border: 2px solid rgba(0, 220, 125, 0.42);
          box-shadow: 0 18px 36px rgba(8, 1, 18, 0.42);
        }
        .tt-st-canvas {
          width: 100%;
          height: 100%;
          display: block;
        }
        .tt-st-rendering-pill {
          position: absolute;
          left: 50%;
          bottom: 12px;
          transform: translateX(-50%);
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(18, 3, 33, 0.86);
          color: #00DC7D;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .tt-st-res-caption {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }

        .tt-st-controls-col {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .tt-st-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-st-field label {
          font-size: 0.74rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-st-select,
        .tt-st-input {
          width: 100%;
          min-height: 44px;
          padding: 0 12px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.84rem;
          font-weight: 600;
        }
        .tt-st-quick-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 2px;
        }
        .tt-st-tag-chip {
          padding: 5px 10px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
          font-size: 0.68rem;
          font-weight: 700;
        }
        .tt-st-tag-chip.is-on {
          border-color: #00DC7D;
          background: rgba(0, 220, 125, 0.14);
          color: #00DC7D;
        }
        .tt-st-root.is-light .tt-st-tag-chip.is-on {
          background: #1E0734;
          border-color: #1E0734;
          color: #00DC7D;
        }
        .tt-st-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-st-toggle-row strong {
          display: block;
          font-size: 0.8rem;
        }
        .tt-st-toggle-row small {
          display: block;
          font-size: 0.69rem;
          color: var(--tt-text-muted);
        }
        .tt-st-switch {
          min-width: 54px;
          min-height: 34px;
          border-radius: 999px;
          background: var(--tt-surface);
          border: 1.5px solid var(--tt-border);
          color: var(--tt-text-muted);
          font-size: 0.74rem;
          font-weight: 900;
        }
        .tt-st-switch.is-on {
          background: #00DC7D;
          border-color: #00DC7D;
          color: #120321;
        }
        .tt-st-actions-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 4px;
        }
        .tt-st-secondary-row {
          display: flex;
          gap: 8px;
        }
      `}</style>
    </ModalPortal>
  );
}
