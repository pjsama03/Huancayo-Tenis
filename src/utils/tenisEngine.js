import { APP_CONFIG, getCategoryByPoints } from '../data/playersAndClubsData';

/* ==========================================================================
   1. PARÁMETROS OFICIALES DEL MOTOR ELO DE PROBABILIDADES FINITAS (TOTAL TENIS)
   Escala 0 a 5,000+ pts · Ancho 1,000 pts/categoría · Divisor D = 2,200 (74%)
   ========================================================================== */
export const ELO_CONFIG = {
  DIVISOR: 2200, // 1 / (1 + 10^(-1000/2200)) = 0.740 (74% entre categorías vecinas)
  K_CALIBRATION: 480, // Partidos 1 al 5 (calibración rápida)
  K_CONSOLIDATED: 300, // Jugadores consolidados (+5 partidos)
  CALIBRATION_MATCHES: 5,
  DEMOGRAPHIC_THRESHOLD: 150, // Auto-escalado demográfico si el circuito supera 150 activos
  SEVERE_CALIB_LOSS_MULT: 1.25, // Castigo 1.25x si pierde 0-6,0-6 o 0-6,1-6 en calibración
  STREAK_MIN_WINS: 3, // Racha activa desde 3 victorias consecutivas
  STREAK_MULTIPLIER: 1.25,
  STREAK_MAX_ELO_GAP: 800, // Antídoto caza-novatos: racha válida frente a rivales competitivos
  WEEKLY_REMATCH_MULT: [1.0, 0.75, 0.5], // 1º = 100%, 2º = 75%, 3º+ = 50% (reinicia cada lunes)
  WALKOVER_WIN_PCT: 0.55,
  WALKOVER_LOSS_PCT: 0.75,
  MIN_MATCHES_SEASON_TROPHY: 5, // Mínimo 5 partidos oficiales para premio físico #1
  MAX_RESCHEDULES_ORDINARY: 1, // Máximo 1 cambio ordinario por partido
  MIN_HOURS_ORDINARY_RESCHEDULE: 24, // Mínimo 24 horas de antelación
};

/* ==========================================================================
   2. REGLAMENTO OFICIAL DE MARCADOR (CANDADO ANTI 7-7 Y TIE-BREAKS SIN TECHO)
   - Set regular: 6-0..6-4, 7-5 o 7-6 (con Tie-Break a 7+ y diferencia >= 2)
   - 3er Set Super Tie-Break: a 10+ con diferencia >= 2 SIN LÍMITE SUPERIOR
   ========================================================================== */
export function isSetTieBreakClosed(tbA = 0, tbB = 0) {
  const a = Number(tbA) || 0;
  const b = Number(tbB) || 0;
  return Math.max(a, b) >= 7 && Math.abs(a - b) >= 2;
}

export function isSuperTieBreakClosed(stbA = 0, stbB = 0) {
  const a = Number(stbA) || 0;
  const b = Number(stbB) || 0;
  // Jamás cierra en 10-9 ni 11-10: exige llegar al menos a 10 Y tener diferencia >= 2 sin techo
  return Math.max(a, b) >= 10 && Math.abs(a - b) >= 2;
}

export function validateRegularSet(aRaw, bRaw, tbARaw = 0, tbBRaw = 0) {
  const a = Number(aRaw) || 0;
  const b = Number(bRaw) || 0;
  const tbA = Number(tbARaw) || 0;
  const tbB = Number(tbBRaw) || 0;

  if (a < 0 || b < 0 || tbA < 0 || tbB < 0) {
    return { valid: false, finished: false, winner: null, error: 'No se permiten valores negativos.' };
  }

  // Bloqueo estricto contra marcadores imposibles en tenis (7-7, 8-6, 9-7, etc.)
  if (a > 7 || b > 7 || (a === 7 && b === 7)) {
    return {
      valid: false,
      finished: false,
      winner: null,
      error: 'Marcador imposible: un set regular no puede superar 7-6 ni terminar 7-7.',
    };
  }

  const maxG = Math.max(a, b);
  const minG = Math.min(a, b);
  const diffG = maxG - minG;

  // Caso 1: 6-0, 6-1, 6-2, 6-3, 6-4
  if (maxG === 6 && minG <= 4) {
    return {
      valid: true,
      finished: true,
      needsTieBreak: false,
      winner: a > b ? 'A' : 'B',
      label: `${a}-${b}`,
      isTieBreakSet: false,
      gameDiff: diffG,
      tbDiff: 0,
    };
  }

  // Caso 2: 7-5
  if (maxG === 7 && minG === 5) {
    return {
      valid: true,
      finished: true,
      needsTieBreak: false,
      winner: a > b ? 'A' : 'B',
      label: `${a}-${b}`,
      isTieBreakSet: false,
      gameDiff: 2,
      tbDiff: 0,
    };
  }

  // Caso 3: 7-6 o 6-7 (Requiere Tie-Break válido a 7+ con diferencia >= 2 sin techo)
  if (maxG === 7 && minG === 6) {
    const winner = a > b ? 'A' : 'B';
    if (tbA === 0 && tbB === 0) {
      return {
        valid: false,
        finished: false,
        needsTieBreak: true,
        winner: null,
        error: 'En 7-6 debes registrar el marcador oficial del Tie-Break (a 7 pts, dif. de 2).',
      };
    }
    if (!isSetTieBreakClosed(tbA, tbB)) {
      return {
        valid: false,
        finished: false,
        needsTieBreak: true,
        winner: null,
        error: 'El Tie-Break debe llegar al menos a 7 puntos con diferencia mínima de 2 (ej. 7-5, 8-6, 18-16).',
      };
    }
    const tbWinner = tbA > tbB ? 'A' : 'B';
    if (tbWinner !== winner) {
      return {
        valid: false,
        finished: false,
        needsTieBreak: true,
        winner: null,
        error: 'El ganador del Tie-Break debe coincidir con quien ganó el set 7-6.',
      };
    }
    return {
      valid: true,
      finished: true,
      needsTieBreak: false,
      winner,
      label: `${a}-${b} (${tbA}-${tbB})`,
      isTieBreakSet: true,
      gameDiff: 1,
      tbDiff: Math.abs(tbA - tbB),
      tbA,
      tbB,
    };
  }

  // Caso 4: 7-0..7-4 (Imposible)
  if (maxG === 7 && minG <= 4) {
    return {
      valid: false,
      finished: false,
      winner: null,
      error: 'Un set no puede terminar 7-4 o menos; debió cerrarse en 6 games.',
    };
  }

  // Caso 5: 6-6 -> En juego, activa panel táctil de Tie-Break
  if (a === 6 && b === 6) {
    if (isSetTieBreakClosed(tbA, tbB)) {
      const winner = tbA > tbB ? 'A' : 'B';
      return {
        valid: true,
        finished: true,
        needsTieBreak: false,
        winner,
        label: `${winner === 'A' ? 7 : 6}-${winner === 'B' ? 7 : 6} (${tbA}-${tbB})`,
        isTieBreakSet: true,
        gameDiff: 1,
        tbDiff: Math.abs(tbA - tbB),
        tbA,
        tbB,
      };
    }
    return {
      valid: true,
      finished: false,
      needsTieBreak: true,
      winner: null,
      label: `6-6 (TB ${tbA}-${tbB})`,
      isTieBreakSet: true,
      gameDiff: 0,
      tbDiff: Math.abs(tbA - tbB),
    };
  }

  // En progreso válido (ej. 3-2, 5-5, 6-5)
  return {
    valid: true,
    finished: false,
    needsTieBreak: false,
    winner: null,
    label: `${a}-${b}`,
    isTieBreakSet: false,
    gameDiff: diffG,
    tbDiff: 0,
  };
}

export function validateSuperTieBreak(aRaw, bRaw) {
  const a = Number(aRaw) || 0;
  const b = Number(bRaw) || 0;

  if (a < 0 || b < 0) {
    return { valid: false, finished: false, winner: null, error: 'Puntaje negativo inválido.' };
  }

  // Si ya cumplió >= 10 y diferencia >= 2, está cerrado oficialmente (sin techo superior)
  if (isSuperTieBreakClosed(a, b)) {
    // Validar que no haya excedido absurdamente después de ya haber ganado con dif >= 2
    // (Ej. 12-5 es inválido porque debió cerrarse en 10-5; pero 12-10, 14-12, 42-40 SÍ son válidos)
    const maxP = Math.max(a, b);
    const minP = Math.min(a, b);
    if (maxP > 10 && maxP - minP > 2) {
      return {
        valid: false,
        finished: false,
        winner: null,
        error: `Un Super Tie-Break por encima de 10 solo cierra por diferencia exacta de 2 puntos (ej. ${minP + 2}-${minP}).`,
      };
    }
    return {
      valid: true,
      finished: true,
      winner: a > b ? 'A' : 'B',
      label: `[${a}-${b}]`,
      diff: maxP - minP,
      a,
      b,
    };
  }

  return {
    valid: true,
    finished: false,
    winner: null,
    label: `[${a}-${b}]`,
    diff: Math.abs(a - b),
    a,
    b,
  };
}

/* ==========================================================================
   3. MÁQUINA DE ESTADOS DEL MARCADOR EN VIVO (BOTONES +1 / -1 CON CANDADO)
   Evita 7-7, despliega Tie-Break en 6-6 y Super Tie-Break infinito en 1-1.
   ========================================================================== */
export function createEmptyLiveScore() {
  return {
    set1: { a: 0, b: 0, tbA: 0, tbB: 0, locked: false },
    set2: { a: 0, b: 0, tbA: 0, tbB: 0, locked: false },
    set3: { a: 0, b: 0, locked: false },
    currentSet: 1,
  };
}

export function canIncrementRegularGame(setObj, side) {
  if (!setObj || setObj.locked) return false;
  const a = Number(setObj.a) || 0;
  const b = Number(setObj.b) || 0;
  // Si el set ya está en 6-6 (Tie-Break) o ya terminó (6-0..6-4, 7-5, 7-6), bloquear +1 Game
  if (a === 6 && b === 6) return false;
  const check = validateRegularSet(a, b, setObj.tbA, setObj.tbB);
  if (check.finished) return false;

  const nextA = side === 'A' ? a + 1 : a;
  const nextB = side === 'B' ? b + 1 : b;
  // Prohibido 7-7 o subir a 7 cuando el rival tiene < 5
  if (nextA === 7 && nextB < 5) return false;
  if (nextB === 7 && nextA < 5) return false;
  if (nextA > 7 || nextB > 7 || (nextA === 7 && nextB === 7)) return false;
  return true;
}

export function evaluateMatchScore(liveScore) {
  const s = liveScore || createEmptyLiveScore();
  const r1 = validateRegularSet(s.set1?.a, s.set1?.b, s.set1?.tbA, s.set1?.tbB);
  const r2 = validateRegularSet(s.set2?.a, s.set2?.b, s.set2?.tbA, s.set2?.tbB);

  if (!r1.valid) {
    return { valid: false, finished: false, winnerSide: null, setsA: 0, setsB: 0, summary: '', error: `Set 1: ${r1.error}` };
  }
  if ((s.set2?.a > 0 || s.set2?.b > 0 || s.set2?.tbA > 0 || s.set2?.tbB > 0) && !r2.valid) {
    return { valid: false, finished: false, winnerSide: null, setsA: 0, setsB: 0, summary: '', error: `Set 2: ${r2.error}` };
  }

  let setsA = 0;
  let setsB = 0;
  const labels = [];

  if (r1.finished) {
    if (r1.winner === 'A') setsA += 1;
    else setsB += 1;
    labels.push(r1.label);
  } else if (s.set1?.a > 0 || s.set1?.b > 0) {
    labels.push(r1.label);
  }

  if (r2.finished) {
    if (r2.winner === 'A') setsA += 1;
    else setsB += 1;
    labels.push(r2.label);
  } else if (s.set2?.a > 0 || s.set2?.b > 0) {
    labels.push(r2.label);
  }

  // Victoria en 2 sets corridos (2-0)
  if (setsA === 2 || setsB === 2) {
    return {
      valid: true,
      finished: true,
      needsSuperTieBreak: false,
      winnerSide: setsA === 2 ? 'A' : 'B',
      setsA,
      setsB,
      summary: labels.join(', '),
      setDetails: { set1: r1, set2: r2, set3: null },
      error: null,
    };
  }

  // Empate 1-1 -> Activa 3er Set Super Tie-Break (a 10+ con dif. >= 2 sin techo)
  if (setsA === 1 && setsB === 1) {
    const r3 = validateSuperTieBreak(s.set3?.a, s.set3?.b);
    if (!r3.valid) {
      return { valid: false, finished: false, needsSuperTieBreak: true, winnerSide: null, setsA, setsB, summary: labels.join(', '), error: `3er Set: ${r3.error}` };
    }
    if (r3.finished) {
      if (r3.winner === 'A') setsA += 1;
      else setsB += 1;
      labels.push(r3.label);
      return {
        valid: true,
        finished: true,
        needsSuperTieBreak: true,
        winnerSide: r3.winner,
        setsA,
        setsB,
        summary: labels.join(', '),
        setDetails: { set1: r1, set2: r2, set3: r3 },
        error: null,
      };
    }
    if (s.set3?.a > 0 || s.set3?.b > 0) labels.push(r3.label);
    return {
      valid: true,
      finished: false,
      needsSuperTieBreak: true,
      winnerSide: null,
      setsA,
      setsB,
      summary: labels.join(', '),
      setDetails: { set1: r1, set2: r2, set3: r3 },
      error: null,
    };
  }

  return {
    valid: true,
    finished: false,
    needsSuperTieBreak: false,
    winnerSide: null,
    setsA,
    setsB,
    summary: labels.join(', ') || '0-0',
    setDetails: { set1: r1, set2: r2, set3: null },
    error: null,
  };
}

export function stepLiveScoreboard(prevScore, action) {
  const base = JSON.parse(JSON.stringify(prevScore || createEmptyLiveScore()));

  switch (action.type) {
    case 'RESET':
      return createEmptyLiveScore();

    case 'GAME_DELTA': {
      const { setKey, side, delta } = action; // setKey: 'set1' | 'set2'
      const target = base[setKey];
      if (!target || target.locked) return base;

      if (delta > 0 && !canIncrementRegularGame(target, side)) return base;
      const field = side === 'A' ? 'a' : 'b';
      target[field] = Math.max(0, (Number(target[field]) || 0) + delta);
      // Si bajaron de 6-6, limpiar tie-break parcial
      if (target.a < 6 || target.b < 6) {
        target.tbA = 0;
        target.tbB = 0;
      }
      // Si el set se cerró limpiamente (6-0..6-4 o 7-5), auto-confirmar y pasar al siguiente set
      const v = validateRegularSet(target.a, target.b, target.tbA, target.tbB);
      if (v.finished && !v.isTieBreakSet) {
        target.locked = true;
        if (setKey === 'set1') base.currentSet = 2;
        else if (setKey === 'set2') {
          const ev = evaluateMatchScore(base);
          if (ev.needsSuperTieBreak) base.currentSet = 3;
        }
      }
      return base;
    }

    case 'TB_DELTA': {
      const { setKey, side, delta } = action; // Tie-Break de set en 6-6 (a 7+, dif >= 2 sin techo)
      const target = base[setKey];
      if (!target || target.locked) return base;
      if (target.a !== 6 || target.b !== 6) return base;

      const field = side === 'A' ? 'tbA' : 'tbB';
      const nextVal = Math.max(0, (Number(target[field]) || 0) + delta);
      // Si ya estaba cerrado y quiere seguir sumando, bloquear; si resta (-1), permitir corrección
      if (delta > 0 && isSetTieBreakClosed(target.tbA, target.tbB)) return base;

      target[field] = nextVal;

      // Cierre automático cuando llega a >= 7 Y diferencia >= 2 (ej. 7-5, 8-6, 18-16)
      if (isSetTieBreakClosed(target.tbA, target.tbB)) {
        if (target.tbA > target.tbB) {
          target.a = 7;
          target.b = 6;
        } else {
          target.a = 6;
          target.b = 7;
        }
        target.locked = true;
        if (setKey === 'set1') base.currentSet = 2;
        else if (setKey === 'set2') {
          const ev = evaluateMatchScore(base);
          if (ev.needsSuperTieBreak) base.currentSet = 3;
        }
      }
      return base;
    }

    case 'STB_DELTA': {
      const { side, delta } = action; // Super Tie-Break 3er set (a 10+, dif >= 2 SIN TECHO)
      const target = base.set3;
      if (!target) return base;
      const evBefore = evaluateMatchScore(base);
      if (!evBefore.needsSuperTieBreak) return base;
      if (delta > 0 && target.locked) return base;

      const field = side === 'A' ? 'a' : 'b';
      const nextVal = Math.max(0, (Number(target[field]) || 0) + delta);
      target[field] = nextVal;

      // Solo se cierra automáticamente si >= 10 Y diferencia >= 2 (10-9 NO cierra; 12-10 SÍ cierra)
      if (isSuperTieBreakClosed(target.a, target.b)) {
        target.locked = true;
      } else {
        target.locked = false;
      }
      return base;
    }

    case 'UNLOCK_SET': {
      const { setKey } = action;
      if (base[setKey]) {
        base[setKey].locked = false;
        // Si desbloquea un set 7-6 o 6-7, devolver a 6-6 para poder corregir el último punto del Tie-Break
        if ((setKey === 'set1' || setKey === 'set2') && Math.max(base[setKey].a, base[setKey].b) === 7 && Math.min(base[setKey].a, base[setKey].b) === 6) {
          base[setKey].a = 6;
          base[setKey].b = 6;
        }
        base.currentSet = setKey === 'set1' ? 1 : setKey === 'set2' ? 2 : 3;
      }
      return base;
    }

    default:
      return base;
  }
}

/* ==========================================================================
   4. MOTOR ELO DE LAS 3 JAULAS FINITAS (100 % FIEL AL CUADERNO)
   - Escala 0–5,000+ · Divisor D = 2,200 (74% entre categorías vecinas)
   - K_calib = 480 (1-5 partidos) · K = 300 (consolidados) + auto-escalado >150
   - Jaula 1 (Sets 6-0..7-5), Jaula 2 (TB 6 difs 2..7), Jaula 3 (STB 9 difs 2..10)
   - Ganador cobra 70%–100% de su techo · Perdedor resta 38%–100% de su techo
   ========================================================================== */
export function getExpectedProbability(ratingA, ratingB) {
  const rA = Number(ratingA) || 0;
  const rB = Number(ratingB) || 0;
  return 1 / (1 + Math.pow(10, (rB - rA) / ELO_CONFIG.DIVISOR));
}

export function getAdaptiveK(player, totalActivePlayers = 130) {
  const played = (Number(player?.calibrationPlayed) ?? (Number(player?.wins || 0) + Number(player?.losses || 0)));
  const isCalibrating = played < ELO_CONFIG.CALIBRATION_MATCHES;
  const baseK = isCalibrating ? ELO_CONFIG.K_CALIBRATION : ELO_CONFIG.K_CONSOLIDATED;

  // Auto-ajuste demográfico suave si el circuito crece por encima de 150 jugadores activos
  if (totalActivePlayers > ELO_CONFIG.DEMOGRAPHIC_THRESHOLD) {
    const scaleFactor = Math.max(0.72, Math.sqrt(ELO_CONFIG.DEMOGRAPHIC_THRESHOLD / totalActivePlayers));
    return Math.round(baseK * scaleFactor);
  }
  return baseK;
}

export function getMondayStartOfWeek(refDate = new Date()) {
  const d = new Date(refDate);
  const day = d.getDay(); // 0=Dom, 1=Lun...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getWeeklyRematchMultiplier(challenges = [], playerAId, playerBId, refDate = new Date()) {
  const mondayTs = getMondayStartOfWeek(refDate);
  const matchesThisWeek = (challenges || []).filter((ch) => {
    if (ch.status !== 'FINISHED' || ch.mode === 'Amistoso') return false;
    const samePair =
      (ch.playerAId === playerAId && ch.playerBId === playerBId) ||
      (ch.playerAId === playerBId && ch.playerBId === playerAId);
    if (!samePair) return false;
    const ts = new Date(ch.finishedAt || ch.scheduledIso || 0).getTime();
    return ts >= mondayTs;
  }).length;

  if (matchesThisWeek === 0) return { multiplier: 1.0, matchIndexThisWeek: 1, label: '1er duelo semanal (100%)' };
  if (matchesThisWeek === 1) return { multiplier: 0.75, matchIndexThisWeek: 2, label: 'Revancha semanal (75%)' };
  return { multiplier: 0.5, matchIndexThisWeek: matchesThisWeek + 1, label: '3er+ duelo semanal (50%)' };
}

/**
 * Jaula 1 (set regular) + Jaula 2 (Tie-Break 6 diferencias finitas: 2 a 7)
 * Devuelve la contribución normalizada (0..1) de un set ganado por el vencedor del partido.
 */
function scoreSingleSetDominance(setEval) {
  if (!setEval || !setEval.finished) return { winShare: 0.38, lossShare: 0.34 };

  // Jaula 2: Tie-Break de set (7-6) -> 6 diferencias finitas (2, 3, 4, 5, 6, 7)
  // Cualquier alargue (8-6, 10-8, 18-16) cae en diff = 2 (máxima paridad)
  if (setEval.isTieBreakSet) {
    const finiteTbDiff = Math.min(7, Math.max(2, Number(setEval.tbDiff) || 2));
    // Mapeo lineal exacto para 1 set ganado en Tie-Break:
    // diff=2 -> 37.5% win / 29.0% loss; diff=7 (7-0) -> 39.0% win / 32.5% loss
    const t = (finiteTbDiff - 2) / 5; // 0..1
    return {
      winShare: 0.375 + t * 0.015,
      lossShare: 0.29 + t * 0.035,
    };
  }

  // Jaula 1: Set regular (6-0, 6-1, 6-2, 6-3, 6-4, 7-5)
  const diff = Number(setEval.gameDiff) || 2;
  const maxG = Math.max(Number(setEval.label?.split('-')[0]) || 6, Number(setEval.label?.split('-')[1]) || 0);
  if (maxG === 7) return { winShare: 0.39, lossShare: 0.34 }; // 7-5
  const regularTable = {
    6: { winShare: 0.5, lossShare: 0.5 }, // 6-0 -> 50% por set (6-0, 6-0 = 100%)
    5: { winShare: 0.48, lossShare: 0.47 }, // 6-1
    4: { winShare: 0.455, lossShare: 0.435 }, // 6-2
    3: { winShare: 0.425, lossShare: 0.395 }, // 6-3
    2: { winShare: 0.4, lossShare: 0.355 }, // 6-4
  };
  return regularTable[diff] || { winShare: 0.4, lossShare: 0.355 };
}

/**
 * Motor de las 3 Jaulas Finitas:
 * - Victoria 2-0: Ganador cobra 75%–100% de su techo; Perdedor resta 58%–100%
 * - Victoria 2-1 (Jaula 3 Super Tie-Break 9 difs finitas 2..10):
 *   Ganador cobra 70%–74% (+ hasta 1.5% por margen de games en sets 1-2);
 *   Perdedor resta 38%–50% (premiando dar pelea hasta el desempate).
 */
export function computeFiniteCagePercentages(matchEval) {
  if (!matchEval || !matchEval.finished) {
    return { winPct: 0.8, lossPct: 0.72, cageLabel: 'Estándar', isSevereBlowout: false };
  }

  const { set1, set2, set3 } = matchEval.setDetails;

  // Caso A: Victoria en 2 sets corridos (Jaula 1 y Jaula 2)
  if (!set3) {
    const s1 = scoreSingleSetDominance(set1);
    const s2 = scoreSingleSetDominance(set2);
    const winPct = Math.min(1.0, Math.max(0.75, Number((s1.winShare + s2.winShare).toFixed(4))));
    const lossPct = Math.min(1.0, Math.max(0.58, Number((s1.lossShare + s2.lossShare).toFixed(4))));

    // Detectar paliza severa en calibración (6-0, 6-0 o 6-0, 6-1)
    const loserGamesTotal =
      Math.min(Number(set1.label?.split('-')[0]) || 0, Number(set1.label?.split('-')[1]) || 0) +
      Math.min(Number(set2.label?.split('-')[0]) || 0, Number(set2.label?.split('-')[1]) || 0);
    const isSevereBlowout = !set1.isTieBreakSet && !set2.isTieBreakSet && loserGamesTotal <= 1;

    return {
      winPct,
      lossPct,
      cageLabel: set1.isTieBreakSet || set2.isTieBreakSet ? 'Jaula 2 · Victoria 2-0 con Tie-Break' : 'Jaula 1 · Victoria 2-0',
      isSevereBlowout,
    };
  }

  // Caso B: Empate 1-1 + Jaula 3 (Super Tie-Break a 10+ con diferencia >= 2 sin techo)
  // 9 diferencias finitas posibles: 2 (10-8, 12-10, 42-40...), 3 (10-7), ..., 10 (10-0)
  const finiteStbDiff = Math.min(10, Math.max(2, Number(set3.diff) || 2));
  const t = (finiteStbDiff - 2) / 8; // 0 (dif 2) -> 1 (dif 10)

  // Ajuste fino por margen de games en los 2 primeros sets (ej. 6-0, 6-7, [10-8])
  const winnerSide = matchEval.winnerSide;
  const gA1 = Number(set1.label?.split('-')[0]) || 0;
  const gB1 = Number(set1.label?.split('-')[1]) || 0;
  const gA2 = Number(set2.label?.split('-')[0]) || 0;
  const gB2 = Number(set2.label?.split('-')[1]) || 0;
  const winnerGamesNet = winnerSide === 'A' ? gA1 + gA2 - (gB1 + gB2) : gB1 + gB2 - (gA1 + gA2);
  const netGameBonus = winnerGamesNet > 0 ? Math.min(0.015, winnerGamesNet * 0.0025) : 0;

  const winPct = Number((0.7 + t * 0.04 + netGameBonus).toFixed(4)); // 70% a 74% (+1.5%)
  const lossPct = Number((0.38 + t * 0.12).toFixed(4)); // 38% (dif 2) a 50% (10-0)

  return {
    winPct,
    lossPct,
    cageLabel: `Jaula 3 · Super Tie-Break (Dif. ${finiteStbDiff} pts)`,
    isSevereBlowout: false,
  };
}

/**
 * Pronóstico Pre-Partido: muestra los techos máximos (6-0, 6-0) y rangos dinámicos
 * independientes para cada tenista antes de retar, sin promesas falsas fijas.
 */
export function getPreMatchForecast(playerA, playerB, challenges = [], totalActivePlayers = 130) {
  const pA = Number(playerA?.points) || 0;
  const pB = Number(playerB?.points) || 0;
  const expA = getExpectedProbability(pA, pB);
  const expB = 1 - expA;

  const kA = getAdaptiveK(playerA, totalActivePlayers);
  const kB = getAdaptiveK(playerB, totalActivePlayers);
  const rematch = getWeeklyRematchMultiplier(challenges, playerA?.id, playerB?.id);

  const ceilingWinA = Math.max(8, Math.round(kA * (1 - expA) * rematch.multiplier));
  const ceilingLossA = -Math.max(8, Math.round(kA * expA * rematch.multiplier));

  const ceilingWinB = Math.max(8, Math.round(kB * (1 - expB) * rematch.multiplier));
  const ceilingLossB = -Math.max(8, Math.round(kB * expB * rematch.multiplier));

  return {
    rematch,
    playerA: {
      maxWin: ceilingWinA,
      minWin: Math.round(ceilingWinA * 0.7),
      maxLoss: ceilingLossA,
      minLoss: Math.round(ceilingLossA * 0.38),
    },
    playerB: {
      maxWin: ceilingWinB,
      minWin: Math.round(ceilingWinB * 0.7),
      maxLoss: ceilingLossB,
      minLoss: Math.round(ceilingLossB * 0.38),
    },
  };
}

/**
 * Cálculo Oficial de Puntos ELO al cerrar un partido (incluye calibración 1.25x,
 * racha x1.25 anti-caza-novatos, revancha semanal y Walkover).
 */
export function calculateOfficialMatchElo({
  playerA,
  playerB,
  liveScore,
  challenges = [],
  totalActivePlayers = 130,
  isWalkover = false,
  walkoverWinnerSide = null,
}) {
  const rA = Number(playerA?.points) || 0;
  const rB = Number(playerB?.points) || 0;
  const forecast = getPreMatchForecast(playerA, playerB, challenges, totalActivePlayers);

  let winnerSide = walkoverWinnerSide;
  let winPct = ELO_CONFIG.WALKOVER_WIN_PCT;
  let lossPct = ELO_CONFIG.WALKOVER_LOSS_PCT;
  let cageLabel = 'Walkover (Inasistencia)';
  let isSevereBlowout = false;
  let summary = 'W.O.';

  if (!isWalkover) {
    const scoreEval = evaluateMatchScore(liveScore);
    if (!scoreEval.valid || !scoreEval.finished) {
      return { ok: false, error: scoreEval.error || 'El partido aún no tiene un ganador válido.' };
    }
    winnerSide = scoreEval.winnerSide;
    summary = scoreEval.summary;
    const cage = computeFiniteCagePercentages(scoreEval);
    winPct = cage.winPct;
    lossPct = cage.lossPct;
    cageLabel = cage.cageLabel;
    isSevereBlowout = cage.isSevereBlowout;
  }

  const gap = Math.abs(rA - rB);
  const aIsCalib = (Number(playerA?.calibrationPlayed) || 0) < ELO_CONFIG.CALIBRATION_MATCHES;
  const bIsCalib = (Number(playerB?.calibrationPlayed) || 0) < ELO_CONFIG.CALIBRATION_MATCHES;

  let deltaA = 0;
  let deltaB = 0;
  let streakBonusApplied = false;

  if (winnerSide === 'A') {
    const streakMult =
      (Number(playerA?.streak) || 0) >= ELO_CONFIG.STREAK_MIN_WINS - 1 && gap <= ELO_CONFIG.STREAK_MAX_ELO_GAP
        ? ELO_CONFIG.STREAK_MULTIPLIER
        : 1.0;
    streakBonusApplied = streakMult > 1;
    const severeMultB = bIsCalib && isSevereBlowout ? ELO_CONFIG.SEVERE_CALIB_LOSS_MULT : 1.0;

    deltaA = Math.max(6, Math.round(forecast.playerA.maxWin * winPct * streakMult));
    deltaB = -Math.max(4, Math.round(Math.abs(forecast.playerB.maxLoss) * lossPct * severeMultB));
  } else {
    const streakMult =
      (Number(playerB?.streak) || 0) >= ELO_CONFIG.STREAK_MIN_WINS - 1 && gap <= ELO_CONFIG.STREAK_MAX_ELO_GAP
        ? ELO_CONFIG.STREAK_MULTIPLIER
        : 1.0;
    streakBonusApplied = streakMult > 1;
    const severeMultA = aIsCalib && isSevereBlowout ? ELO_CONFIG.SEVERE_CALIB_LOSS_MULT : 1.0;

    deltaB = Math.max(6, Math.round(forecast.playerB.maxWin * winPct * streakMult));
    deltaA = -Math.max(4, Math.round(Math.abs(forecast.playerA.maxLoss) * lossPct * severeMultA));
  }

  const newPointsA = Math.max(0, rA + deltaA);
  const newPointsB = Math.max(0, rB + deltaB);
  const oldCatA = getCategoryByPoints(rA);
  const newCatA = getCategoryByPoints(newPointsA);
  const oldCatB = getCategoryByPoints(rB);
  const newCatB = getCategoryByPoints(newPointsB);

  return {
    ok: true,
    winnerSide,
    summary,
    cageLabel,
    streakBonusApplied,
    rematchLabel: forecast.rematch.label,
    deltaA,
    deltaB,
    newPointsA,
    newPointsB,
    promotedA: newCatA.min > oldCatA.min,
    promotedB: newCatB.min > oldCatB.min,
    newCategoryA: newCatA,
    newCategoryB: newCatB,
  };
}

/* ==========================================================================
   5. TABLA ESTÁTICA INAMOVIBLE DE 4 TEMPORADAS (CARRERA AL TORNEO DE MAESTROS)
   PROHIBIDO tocar o resetear el Ranking ELO: solo se exporta y congela a 00:00.
   ========================================================================== */
export function exportSeasonSnapshot(seasonSnapshots, players = [], seasonNumber) {
  const frozenScores = {};
  (players || []).forEach((p) => {
    frozenScores[p.id] = Number(p.points) || 0;
  });

  const nextSeasons = (seasonSnapshots?.seasons || []).map((s) => {
    if (s.number !== seasonNumber) return s;
    return {
      ...s,
      locked: true,
      exportedAt: new Date().toISOString(),
      scores: frozenScores,
    };
  });

  const nextCurrent = Math.min(4, Number(seasonNumber) + 1);
  return {
    ...seasonSnapshots,
    currentSeason: nextCurrent,
    seasons: nextSeasons,
  };
}

export function checkAutoMidnightExport(seasonSnapshots, players = [], nowDate = new Date()) {
  if (!seasonSnapshots?.seasons?.length) return { updated: false, snapshots: seasonSnapshots };
  const year = seasonSnapshots.year || nowDate.getFullYear();
  const deadlines = {
    1: new Date(`${year}-04-01T00:00:00-05:00`),
    2: new Date(`${year}-07-01T00:00:00-05:00`),
    3: new Date(`${year}-10-01T00:00:00-05:00`),
    4: new Date(`${year + 1}-01-01T00:00:00-05:00`),
  };

  let working = seasonSnapshots;
  let updated = false;

  working.seasons.forEach((s) => {
    if (!s.locked && deadlines[s.number] && nowDate >= deadlines[s.number]) {
      working = exportSeasonSnapshot(working, players, s.number);
      updated = true;
    }
  });

  return { updated, snapshots: working };
}

export function computeMasterTop8Race(seasonSnapshots, players = [], divisionFilter = 'ALL', categoryFilter = 'ALL') {
  const seasons = seasonSnapshots?.seasons || [];
  const rows = (players || [])
    .filter((p) => {
      if (divisionFilter !== 'ALL' && p.division !== divisionFilter) return false;
      if (categoryFilter !== 'ALL' && getCategoryByPoints(p.points).id !== categoryFilter) return false;
      return true;
    })
    .map((p) => {
      const seasonValues = seasons.map((s) => {
        if (s.locked) return Number(s.scores?.[p.id]) || 0;
        // Para la temporada en curso (aún abierta), se muestra su proyección actual sin alterar las pasadas
        return s.number === seasonSnapshots.currentSeason ? Number(p.points) || 0 : 0;
      });
      const totalAnnual = seasonValues.reduce((acc, v) => acc + v, 0);
      return {
        player: p,
        seasonValues,
        totalAnnual,
        category: getCategoryByPoints(p.points),
      };
    })
    .sort((a, b) => b.totalAnnual - a.totalAnnual);

  return rows.map((row, idx) => ({
    ...row,
    raceRank: idx + 1,
    qualifiesMasterTop8: idx < 8,
  }));
}

/* ==========================================================================
   6. PERMISOS ESTRICTOS POR JUGADOR, JUEZ EN CANCHA Y REGLA 24 HORAS
   ========================================================================== */
export function getMatchPermissions(challenge, currentUser, isAdmin = false) {
  if (!challenge) {
    return {
      isParticipant: false,
      isJudge: false,
      canEditScore: false,
      canAssignJudge: false,
      canConfirmOfficial: false,
      canReschedule: false,
      rescheduleMode: 'HIDDEN',
      hoursUntilMatch: 0,
    };
  }

  const uid = currentUser?.id || null;
  const isPlayerA = Boolean(uid && challenge.playerAId === uid);
  const isPlayerB = Boolean(uid && challenge.playerBId === uid);
  const isParticipant = isPlayerA || isPlayerB;
  const isJudge = Boolean(uid && challenge.judgeId && challenge.judgeId === uid);

  const isInPlay = challenge.status === 'IN_PLAY';
  const isFinished = challenge.status === 'FINISHED';
  const scheduledTs = new Date(challenge.scheduledIso || Date.now()).getTime();
  const hoursUntilMatch = Number(((scheduledTs - Date.now()) / (1000 * 60 * 60)).toFixed(1));
  const usedReschedules = Number(challenge.rescheduleCount) || 0;

  let rescheduleMode = 'HIDDEN';
  if (!isFinished && !isInPlay && (isParticipant || isAdmin)) {
    if (usedReschedules < ELO_CONFIG.MAX_RESCHEDULES_ORDINARY && hoursUntilMatch >= ELO_CONFIG.MIN_HOURS_ORDINARY_RESCHEDULE) {
      rescheduleMode = 'ORDINARY_ALLOWED';
    } else {
      rescheduleMode = 'CLIMATE_OR_EMERGENCY_ONLY';
    }
  }

  return {
    isPlayerA,
    isPlayerB,
    isParticipant,
    isJudge,
    // Solo los 2 protagonistas o el Juez asignado por ellos (o Admin) editan el marcador
    canEditScore: !isFinished && (isParticipant || isJudge || isAdmin),
    canConfirmOfficial: !isFinished && (isParticipant || isAdmin),
    canAssignJudge: !isFinished && (isParticipant || isAdmin),
    canReschedule: rescheduleMode !== 'HIDDEN',
    rescheduleMode,
    hoursUntilMatch,
    roleLabel: isAdmin
      ? 'Administrador'
      : isParticipant
      ? 'Jugador del partido'
      : isJudge
      ? 'Juez en Cancha designado'
      : 'En vivo · Solo lectura',
  };
}

/* ==========================================================================
   7. CLIMA REAL EN SEDE (OPEN-METEO $0) Y NOTICIERO REAL ATP / WTA EN VIVO ($0)
   Regla Rectora #5: Jamás mostrar noticias falsas ni fotos viejas si no hay red.
   ========================================================================== */
export async function fetchLiveClubWeather(lat = -12.0651, lng = -75.2049) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&hourly=uv_index,precipitation_probability&timezone=America%2FLima&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API unavailable');
    const data = await res.json();
    const cur = data?.current || {};
    const hourIdx = Math.min(23, new Date().getHours());
    const uv = Math.round(data?.hourly?.uv_index?.[hourIdx] ?? 6);
    const rainChance = Math.round(data?.hourly?.precipitation_probability?.[hourIdx] ?? 10);
    const precip = Number(cur.precipitation) || 0;
    const wCode = Number(cur.weather_code) || 0;

    let conditionKey = 'seco';
    let status = 'Óptimo para jugar';
    if (precip >= 1.5 || wCode >= 61) {
      conditionKey = 'lluvia';
      status = 'Lluvia · Revisar arcilla';
    } else if (precip > 0 || wCode >= 51 || rainChance >= 55) {
      conditionKey = 'llovizna';
      status = 'Llovizna / Riesgo lluvia';
    } else if ((Number(cur.relative_humidity_2m) || 0) >= 75) {
      conditionKey = 'humedad';
      status = 'Humedad alta · Bote pesado';
    }

    return {
      ok: true,
      tempC: Math.round(cur.temperature_2m ?? 18),
      humidity: Math.round(cur.relative_humidity_2m ?? 50),
      windKmh: Math.round(cur.wind_speed_10m ?? 10),
      uvIndex: uv,
      rainChance,
      conditionKey,
      status,
      updatedAt: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch (e) {
    return { ok: false };
  }
}

export async function fetchLiveRealTennisNews() {
  const feeds = [
    {
      source: 'ESPN Tenis · ATP & WTA',
      rssUrl: 'https://www.espn.com/espn/rss/tennis/news',
    },
    {
      source: 'ATP Tour Oficial',
      rssUrl: 'https://www.atptour.com/en/media/rss-feed/xml-feed',
    },
  ];

  for (let i = 0; i < feeds.length; i += 1) {
    const feed = feeds[i];
    try {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.rssUrl)}`;
      const res = await fetch(apiUrl);
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.status === 'ok' && Array.isArray(json.items) && json.items.length > 0) {
        const cleaned = json.items
          .filter((item) => item.title && item.link)
          .slice(0, 6)
          .map((item, idx) => {
            const imgFromContent = (item.description || '').match(/<img[^>]+src="([^"]+)"/i)?.[1];
            const thumbnail = item.thumbnail || item.enclosure?.link || imgFromContent || null;
            const plainSummary = (item.description || '')
              .replace(/<[^>]*>?/gm, '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 155);
            return {
              id: `live-news-${idx}-${item.pubDate || idx}`,
              source: feed.source,
              title: item.title.trim(),
              summary: plainSummary ? `${plainSummary}...` : 'Cobertura oficial del circuito profesional.',
              link: item.link,
              image: thumbnail,
              pubDate: item.pubDate
                ? new Date(item.pubDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
                : 'En vivo',
            };
          });

        if (cleaned.length > 0) {
          return { ok: true, items: cleaned, fetchedAt: new Date().toISOString() };
        }
      }
    } catch (e) {
      // Intenta con la siguiente fuente real
    }
  }

  // Regla Rectora #5: NUNCA devolver noticias inventadas ni fotos viejas si no hay señal
  return {
    ok: false,
    items: [],
    offlineMessage:
      'No se pudo conectar con los feeds oficiales de ATP Tour y WTA Tour en este momento. Pulsa Actualizar cuando tengas señal.',
  };
}

/* ==========================================================================
   8. EXPORTADOR HISTÓRICO A EXCEL / CSV (HASTA 10,000 JUGADORES) + CAPTCHA
   ========================================================================== */
export function exportPlayersToExcelCsv(players = [], seasonSnapshots = null, filename = 'TOTAL-TENIS-Respaldo-Historico.csv') {
  const headers = [
    'ID_Credencial',
    'Nombre_Completo',
    'Division',
    'Categoria_Actual',
    'Club_Sede',
    'Puntos_ELO_Actual',
    'Victorias',
    'Derrotas',
    'Efectividad_%',
    'Racha',
    'Plan_Membresia',
    'Saldo_Gemas',
    'Temp_1_Congelada',
    'Temp_2_Congelada',
    'Temp_3_Congelada',
    'Temp_4_Congelada',
    'Suma_Anual_Master',
    'WhatsApp',
    'Correo',
  ];

  const seasons = seasonSnapshots?.seasons || [];
  const escapeCsv = (val) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = (players || []).slice(0, APP_CONFIG.maxPlayersCapacity).map((p) => {
    const cat = getCategoryByPoints(p.points);
    const totalGames = (Number(p.wins) || 0) + (Number(p.losses) || 0);
    const winPct = totalGames > 0 ? Math.round(((Number(p.wins) || 0) / totalGames) * 100) : 0;
    const t1 = Number(seasons[0]?.scores?.[p.id]) || 0;
    const t2 = Number(seasons[1]?.scores?.[p.id]) || 0;
    const t3 = Number(seasons[2]?.scores?.[p.id]) || 0;
    const t4 = Number(seasons[3]?.scores?.[p.id]) || 0;

    return [
      p.credentialId || '',
      p.name || '',
      p.division || 'Varones',
      cat.name,
      p.clubName || 'Independiente',
      Number(p.points) || 0,
      Number(p.wins) || 0,
      Number(p.losses) || 0,
      `${winPct}%`,
      Number(p.streak) || 0,
      p.isVip ? 'Socio VIP' : 'Estándar',
      Number(p.gems) || 0,
      t1,
      t2,
      t3,
      t4,
      t1 + t2 + t3 + t4,
      p.whatsapp || '',
      p.email || '',
    ].map(escapeCsv).join(',');
  });

  // BOM UTF-8 (\uFEFF) para que Microsoft Excel lea tildes y ñ sin errores
  const csvContent = `\uFEFF${headers.join(',')}\n${rows.join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Captcha Matemático Numérico Nativo (0 KB de librerías externas en GitHub)
 */
export function generateMathCaptcha() {
  const a = Math.floor(Math.random() * 14) + 5; // 5..18
  const b = Math.floor(Math.random() * 9) + 2; // 2..10
  return {
    question: `¿Cuánto es ${a} + ${b}?`,
    answer: String(a + b),
  };
}

export function buildWhatsAppLink(phone, message) {
  const cleanPhone = String(phone || APP_CONFIG.supportWhatsApp).replace(/\D/g, '');
  const fullPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message || '')}`;
}
