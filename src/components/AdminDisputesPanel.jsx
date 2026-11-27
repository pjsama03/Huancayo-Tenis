import React, { useMemo, useState } from 'react';
import { IconBadge, SmartImage, TTIcon, triggerHaptic } from './AppIcons';
import {
  buildLiveScoreFromDirectDraft,
  createDirectDraftFromScore,
  formatDynamicDateAndTime,
} from './RetosParts';
import {
  calculateOfficialMatchElo,
  createEmptyLiveScore,
  evaluateMatchScore,
} from '../utils/tenisEngine';
import { buildWhatsappLink, getEffectiveContactPhone } from '../utils/cloudService';
import { getCategoryByPoints } from '../data/playersAndClubsData';

/* ==========================================================================
   CENTRO DE DISPUTAS DEL ADMINISTRADOR (INVESTIGACIÓN HUMANA + 3 VEREDICTOS)
   - Muestra cada partido impugnado con su score propuesto y el motivo exacto.
   - Contacto en 1 toque por WhatsApp y Correo a AMBOS jugadores (respeta tutela -18).
   - 3 decisiones del Comité:
     1) Confirmar marcador propuesto
     2) Corregir marcador (sets o W.O.) y definir ganador con recálculo ELO real
     3) Desestimar y anular partido (o Reabrir como Programado)
   ========================================================================== */
export default function AdminDisputesPanel({
  challenges = [],
  players = [],
  authByIdMap = {},
  onResolveDispute,
  onNotify,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(() => createDirectDraftFromScore(null));
  const [adminNote, setAdminNote] = useState('');
  const [busyId, setBusyId] = useState(null);

  const playersMap = useMemo(() => {
    const m = {};
    (players || []).forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [players]);

  const disputedList = useMemo(
    () =>
      (challenges || [])
        .filter((c) => c.status === 'DISPUTED')
        .sort(
          (a, b) =>
            new Date(b.disputeInfo?.disputedAt || b.createdAt || 0).getTime() -
            new Date(a.disputeInfo?.disputedAt || a.createdAt || 0).getTime()
        ),
    [challenges]
  );

  const pendingConfirmList = useMemo(
    () => (challenges || []).filter((c) => c.status === 'SCORE_PROPOSED'),
    [challenges]
  );

  const resolveEmail = (player) => {
    if (!player) return '';
    if (player.isTutelado && player.tutorId) {
      const tutor = playersMap[player.tutorId];
      if (tutor) return resolveEmail(tutor);
    }
    const fromAuth = player.authId ? authByIdMap[player.authId]?.email : '';
    return fromAuth || player.email || '';
  };

  const buildContactMessage = ({ targetPlayer, rivalPlayer, ch, role }) => {
    const { dateText, timeText } = formatDynamicDateAndTime(
      ch.scheduledIso,
      ch.dateLabel,
      ch.timeLabel
    );
    const reasonCat = ch.disputeInfo?.reasonCategory || 'Observación de marcador';
    const reasonTxt = ch.disputeInfo?.reasonText || ch.disputeNote || 'Discrepancia en el resultado';
    const claimed = ch.disputeInfo?.claimedScore
      ? `\nMarcador reclamado: ${ch.disputeInfo.claimedScore}`
      : '';

    const greeting = targetPlayer?.isTutelado
      ? `Hola ${targetPlayer.tutorName || 'Padre/Madre'} (tutor de ${targetPlayer.name})`
      : `Hola ${targetPlayer?.name?.split(' ')[0] || 'jugador'}`;

    if (role === 'disputer') {
      return `${greeting}, te escribe el Comité Administrador de TOTAL TENIS 🎾.\n\nRecibimos tu impugnación del partido contra ${rivalPlayer?.name || 'tu rival'} (${ch.clubName} · ${dateText} ${timeText}) con marcador registrado ${ch.scoreSummary || '—'}.\nMotivo registrado: [${reasonCat}] ${reasonTxt}${claimed}\n\n¿Puedes confirmarnos algún detalle adicional para emitir el fallo oficial?`;
    }

    return `${greeting}, te escribe el Comité Administrador de TOTAL TENIS 🎾.\n\nTe informamos que el partido contra ${rivalPlayer?.name || 'tu rival'} (${ch.clubName} · ${dateText} ${timeText}) con marcador ${ch.scoreSummary || '—'} fue IMPUGNADO y está en revisión.\nMotivo indicado por tu rival: [${reasonCat}] ${reasonTxt}${claimed}\n\nPor favor respóndenos con tu versión del marcador para validar y cerrar el resultado oficial.`;
  };

  const handleCopyText = async (text) => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(text);
      if (onNotify) onNotify('Mensaje oficial copiado al portapapeles.', 'success');
    } catch {
      if (onNotify) onNotify('No se pudo copiar automáticamente.', 'info');
    }
  };

  const openCorrectionEditor = (ch) => {
    triggerHaptic('light');
    if (editingId === ch.id) {
      setEditingId(null);
      return;
    }
    setEditingId(ch.id);
    setDraft(createDirectDraftFromScore(ch.liveScore));
    setAdminNote(ch.adminResolutionNote || '');
  };

  const runAction = async (chId, action, payload = {}) => {
    if (!onResolveDispute || busyId) return;
    setBusyId(chId);
    try {
      await onResolveDispute(chId, action, payload);
      setEditingId(null);
      setAdminNote('');
    } finally {
      setBusyId(null);
    }
  };

  const builtDraft = useMemo(() => buildLiveScoreFromDirectDraft(draft), [draft]);

  const renderPlayerContactRow = (player, rival, ch, roleTag) => {
    if (!player) return null;
    const phone = getEffectiveContactPhone(player, players);
    const email = resolveEmail(player);
    const msg = buildContactMessage({
      targetPlayer: player,
      rivalPlayer: rival,
      ch,
      role: roleTag === 'IMPUGNÓ' ? 'disputer' : 'uploader',
    });
    const waUrl = phone ? buildWhatsappLink(phone, msg) : '';
    const mailtoUrl = email
      ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
          `[TOTAL TENIS] Revisión de partido impugnado (${ch.scoreSummary || 'Marcador'})`
        )}&body=${encodeURIComponent(msg)}`
      : '';

    return (
      <div key={player.id} className="tt-adp-contact-row">
        <div className="tt-adp-contact-id">
          <SmartImage
            src={player.avatar}
            alt={player.name}
            initials={player.name}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: 'center top',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '0.8rem' }}>{player.name}</strong>
              <span
                className={`tt-adp-role-chip ${roleTag === 'IMPUGNÓ' ? 'is-warn' : 'is-info'}`}
              >
                {roleTag}
              </span>
            </div>
            <small style={{ display: 'block', fontSize: '0.68rem', opacity: 0.76 }}>
              {phone ? `📱 ${phone}` : '⚠️ Sin WhatsApp'} · {email || 'Sin correo'}
            </small>
          </div>
        </div>

        <div className="tt-adp-contact-btns">
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tt-adp-mini-btn is-wa"
              onClick={() => triggerHaptic('light')}
            >
              <TTIcon name="whatsapp" size={14} /> WhatsApp
            </a>
          ) : (
            <span className="tt-adp-missing-pill">Sin WA</span>
          )}

          {mailtoUrl ? (
            <a
              href={mailtoUrl}
              className="tt-adp-mini-btn is-mail"
              onClick={() => triggerHaptic('light')}
            >
              ✉ Correo
            </a>
          ) : (
            <span className="tt-adp-missing-pill">Sin correo</span>
          )}

          <button
            type="button"
            className="tt-adp-mini-btn"
            onClick={() => handleCopyText(msg)}
          >
            Copiar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="tt-adp-wrap">
      <div className="tt-adp-summary">
        <IconBadge name="shield" variant="gold" size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>Centro de Disputas y Validación Humana</strong>
          <small>
            {disputedList.length} impugnado{disputedList.length === 1 ? '' : 's'} en revisión ·{' '}
            {pendingConfirmList.length} esperando firma del rival
          </small>
        </div>
      </div>

      {disputedList.length === 0 ? (
        <div className="tt-adp-empty">
          <strong>✅ Cero disputas activas</strong>
          <p>
            Cuando un jugador impugne un marcador, el partido se congelará automáticamente y
            aparecerá aquí con su motivo exacto, botones de WhatsApp/Correo para ambos jugadores y
            herramientas para confirmar, corregir o anular el resultado.
          </p>
        </div>
      ) : (
        <div className="tt-adp-list">
          {disputedList.map((ch) => {
            const pA = playersMap[ch.playerAId];
            const pB = playersMap[ch.playerBId];
            const { dateText, timeText } = formatDynamicDateAndTime(
              ch.scheduledIso,
              ch.dateLabel,
              ch.timeLabel
            );
            const disputerId = ch.disputeInfo?.disputedById || '';
            const proposerId = ch.proposedBy || ch.disputeInfo?.proposedById || '';
            const roleA =
              disputerId === pA?.id
                ? 'IMPUGNÓ'
                : proposerId === pA?.id
                ? 'SUBIÓ SCORE'
                : 'JUGADOR A';
            const roleB =
              disputerId === pB?.id
                ? 'IMPUGNÓ'
                : proposerId === pB?.id
                ? 'SUBIÓ SCORE'
                : 'JUGADOR B';

            const isEditing = editingId === ch.id;
            const draftEval = isEditing ? evaluateMatchScore(builtDraft.liveScore) : null;
            const draftPreviewElo =
              isEditing && draftEval?.finished && ch.mode !== 'Amistoso' && pA && pB
                ? calculateOfficialMatchElo({
                    playerA: pA,
                    playerB: pB,
                    liveScore: builtDraft.liveScore,
                    challenges,
                    totalActivePlayers: Math.max(players.length, 130),
                  })
                : null;

            return (
              <article key={ch.id} className="tt-adp-card">
                <div className="tt-adp-card-top">
                  <span className="tt-adp-status-badge">⚖️ IMPUGNADO · EN REVISIÓN</span>
                  <span className="tt-adp-mode-tag">
                    {ch.mode === 'Amistoso' ? 'Amistoso' : 'Oficial · Por puntos'}
                  </span>
                </div>

                <div className="tt-adp-match-head">
                  <strong>
                    {pA?.name || 'Jugador A'} vs. {pB?.name || 'Jugador B'}
                  </strong>
                  <span>
                    {ch.clubName} · {dateText} · {timeText}
                  </span>
                  <div className="tt-adp-score-strip">
                    <span>Marcador propuesto:</span>
                    <b>{ch.scoreSummary || 'Sin marcador'}</b>
                    {proposerId && playersMap[proposerId] && (
                      <small>(por {playersMap[proposerId].name})</small>
                    )}
                  </div>
                </div>

                {/* MOTIVO EXACTO DE LA IMPUGNACIÓN */}
                <div className="tt-adp-reason-box">
                  <span className="tt-adp-kicker">
                    MOTIVO DE LA IMPUGNACIÓN
                    {ch.disputeInfo?.disputedByName ? ` · ${ch.disputeInfo.disputedByName}` : ''}
                  </span>
                  <strong>{ch.disputeInfo?.reasonCategory || 'Resultado observado'}</strong>
                  <p>{ch.disputeInfo?.reasonText || ch.disputeNote || 'Sin detalle adicional.'}</p>
                  {ch.disputeInfo?.claimedScore && (
                    <small className="tt-adp-claimed">
                      Marcador que sostiene el impugnante: <b>{ch.disputeInfo.claimedScore}</b>
                    </small>
                  )}
                </div>

                {/* INVESTIGACIÓN HUMANA: WHATSAPP + CORREO A AMBOS JUGADORES */}
                <div className="tt-adp-contacts-block">
                  <span className="tt-adp-kicker">
                    PASO 1 · CONSULTAR A AMBOS JUGADORES (WHATSAPP + CORREO)
                  </span>
                  {renderPlayerContactRow(pA, pB, ch, roleA)}
                  {renderPlayerContactRow(pB, pA, ch, roleB)}
                </div>

                {/* FALLO DEL ADMINISTRADOR (3 DECISIONES) */}
                <div className="tt-adp-verdict-block">
                  <span className="tt-adp-kicker">PASO 2 · FALLO DEL ADMINISTRADOR</span>

                  <div className="tt-adp-verdict-btns">
                    <button
                      type="button"
                      className="tt-adp-btn is-emerald"
                      disabled={busyId === ch.id}
                      onClick={() => runAction(ch.id, 'CONFIRM', { adminNote })}
                    >
                      ✓ Confirmar ({ch.scoreSummary || 'Propuesto'})
                    </button>

                    <button
                      type="button"
                      className="tt-adp-btn is-gold"
                      disabled={busyId === ch.id}
                      onClick={() => openCorrectionEditor(ch)}
                    >
                      ✎ {isEditing ? 'Cerrar editor' : 'Corregir marcador / Ganador'}
                    </button>

                    <button
                      type="button"
                      className="tt-adp-btn is-danger"
                      disabled={busyId === ch.id}
                      onClick={() => runAction(ch.id, 'DISMISS', { adminNote })}
                    >
                      ✕ Desestimar y Anular
                    </button>

                    <button
                      type="button"
                      className="tt-adp-btn"
                      disabled={busyId === ch.id}
                      onClick={() => runAction(ch.id, 'REOPEN', { adminNote })}
                    >
                      ↺ Reabrir como Programado
                    </button>
                  </div>

                  {/* EDITOR INLINE DE CORRECCIÓN DE MARCADOR O WALKOVER */}
                  {isEditing && (
                    <div className="tt-adp-editor">
                      <div className="tt-adp-editor-grid">
                        <div className="tt-adp-set-col">
                          <small>SET 1 ({pA?.name?.split(' ')[0]} – {pB?.name?.split(' ')[0]})</small>
                          <div className="tt-adp-pair">
                            <input
                              type="number"
                              min={0}
                              max={7}
                              placeholder="6"
                              value={draft.s1a}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, s1a: e.target.value.slice(0, 1) }))
                              }
                            />
                            <span>–</span>
                            <input
                              type="number"
                              min={0}
                              max={7}
                              placeholder="4"
                              value={draft.s1b}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, s1b: e.target.value.slice(0, 1) }))
                              }
                            />
                          </div>
                        </div>

                        <div className="tt-adp-set-col">
                          <small>SET 2 ({pA?.name?.split(' ')[0]} – {pB?.name?.split(' ')[0]})</small>
                          <div className="tt-adp-pair">
                            <input
                              type="number"
                              min={0}
                              max={7}
                              placeholder="6"
                              value={draft.s2a}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, s2a: e.target.value.slice(0, 1) }))
                              }
                            />
                            <span>–</span>
                            <input
                              type="number"
                              min={0}
                              max={7}
                              placeholder="3"
                              value={draft.s2b}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, s2b: e.target.value.slice(0, 1) }))
                              }
                            />
                          </div>
                        </div>

                        {builtDraft.needsStb && (
                          <div className="tt-adp-set-col">
                            <small>SUPER TIE-BREAK (a 10+)</small>
                            <div className="tt-adp-pair">
                              <input
                                type="number"
                                min={0}
                                max={30}
                                placeholder="10"
                                value={draft.s3a}
                                onChange={(e) =>
                                  setDraft((d) => ({ ...d, s3a: e.target.value.slice(0, 2) }))
                                }
                              />
                              <span>–</span>
                              <input
                                type="number"
                                min={0}
                                max={30}
                                placeholder="8"
                                value={draft.s3b}
                                onChange={(e) =>
                                  setDraft((d) => ({ ...d, s3b: e.target.value.slice(0, 2) }))
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <input
                        type="text"
                        className="tt-adp-note-input"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Nota opcional del Comité (ej. Validado por WhatsApp con ambos jugadores)"
                      />

                      {draftEval?.finished ? (
                        <div className="tt-adp-preview">
                          <span>
                            Nuevo resultado oficial: <b>{draftEval.summary}</b> · Gana{' '}
                            <b>{draftEval.winnerSide === 'A' ? pA?.name : pB?.name}</b>
                          </span>
                          {draftPreviewElo?.ok && (
                            <small>
                              ELO: {pA?.name?.split(' ')[0]} ({draftPreviewElo.deltaA >= 0 ? '+' : ''}
                              {draftPreviewElo.deltaA}) · {pB?.name?.split(' ')[0]} (
                              {draftPreviewElo.deltaB >= 0 ? '+' : ''}
                              {draftPreviewElo.deltaB})
                            </small>
                          )}
                          <button
                            type="button"
                            className="tt-adp-btn is-emerald"
                            style={{ width: '100%', marginTop: 6 }}
                            disabled={busyId === ch.id}
                            onClick={() =>
                              runAction(ch.id, 'CORRECT', {
                                liveScore: builtDraft.liveScore,
                                isWalkover: false,
                                adminNote,
                              })
                            }
                          >
                            Aplicar Marcador Corregido y Cerrar Partido
                          </button>
                        </div>
                      ) : (
                        <small style={{ opacity: 0.78, fontSize: '0.71rem' }}>
                          Ingresa un marcador válido (ej. 6-4, 6-3) o asigna victoria por Walkover:
                        </small>
                      )}

                      <div className="tt-adp-wo-row">
                        <button
                          type="button"
                          className="tt-adp-mini-btn"
                          disabled={busyId === ch.id}
                          onClick={() =>
                            runAction(ch.id, 'CORRECT', {
                              liveScore: createEmptyLiveScore(),
                              isWalkover: true,
                              walkoverWinnerSide: 'A',
                              adminNote: adminNote || `Victoria por W.O. otorgada a ${pA?.name}`,
                            })
                          }
                        >
                          Dar victoria W.O. a {pA?.name?.split(' ')[0]}
                        </button>
                        <button
                          type="button"
                          className="tt-adp-mini-btn"
                          disabled={busyId === ch.id}
                          onClick={() =>
                            runAction(ch.id, 'CORRECT', {
                              liveScore: createEmptyLiveScore(),
                              isWalkover: true,
                              walkoverWinnerSide: 'B',
                              adminNote: adminNote || `Victoria por W.O. otorgada a ${pB?.name}`,
                            })
                          }
                        >
                          Dar victoria W.O. a {pB?.name?.split(' ')[0]}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pendingConfirmList.length > 0 && (
        <div className="tt-adp-pending-box">
          <span className="tt-adp-kicker">
            PENDIENTES DE CONFIRMACIÓN RIVAL ({pendingConfirmList.length})
          </span>
          {pendingConfirmList.map((ch) => {
            const pA = playersMap[ch.playerAId];
            const pB = playersMap[ch.playerBId];
            return (
              <div key={ch.id} className="tt-adp-pending-row">
                <div style={{ minWidth: 0 }}>
                  <strong>
                    {pA?.name || 'A'} vs. {pB?.name || 'B'}
                  </strong>
                  <small>
                    {ch.scoreSummary || '—'} · {ch.clubName} ·{' '}
                    {getCategoryByPoints(pA?.points).name}
                  </small>
                </div>
                <button
                  type="button"
                  className="tt-adp-mini-btn is-wa"
                  disabled={busyId === ch.id}
                  onClick={() => runAction(ch.id, 'CONFIRM')}
                >
                  Validar ahora
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .tt-adp-wrap { display: flex; flex-direction: column; gap: 12px; }
        .tt-adp-summary {
          display: flex; align-items: center; gap: 11px; padding: 12px 13px; border-radius: 16px;
          background: var(--tt-surface-2); border: 1px solid rgba(229, 193, 108, 0.42);
        }
        .tt-adp-summary strong { display: block; font-size: 0.9rem; }
        .tt-adp-summary small { display: block; font-size: 0.72rem; color: var(--tt-text-muted); margin-top: 2px; }
        .tt-adp-empty {
          padding: 18px 14px; border-radius: 16px; text-align: center;
          background: var(--tt-surface-2); border: 1px dashed var(--tt-border-medium);
        }
        .tt-adp-empty strong { display: block; font-size: 0.9rem; color: var(--tt-emerald-text); }
        .tt-adp-empty p { margin: 6px 0 0; font-size: 0.76rem; color: var(--tt-text-muted); line-height: 1.45; }
        .tt-adp-list { display: flex; flex-direction: column; gap: 14px; }
        .tt-adp-card {
          padding: 14px; border-radius: 19px;
          background: var(--tt-surface); border: 1.5px solid rgba(248, 113, 113, 0.52);
          display: flex; flex-direction: column; gap: 12px;
        }
        .tt-adp-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
        .tt-adp-status-badge {
          padding: 4px 10px; border-radius: 999px;
          background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(248, 113, 113, 0.55);
          color: #FCA5A5; font-size: 0.63rem; font-weight: 900; letter-spacing: 0.05em;
        }
        html[data-theme='light'] .tt-adp-status-badge { background: #FEE2E2; color: #B91C1C; }
        .tt-adp-mode-tag { font-size: 0.68rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-adp-match-head strong { display: block; font-size: 0.95rem; }
        .tt-adp-match-head > span { display: block; font-size: 0.73rem; color: var(--tt-text-muted); margin-top: 2px; }
        .tt-adp-score-strip {
          margin-top: 7px; padding: 8px 10px; border-radius: 11px;
          background: var(--tt-surface-2); display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
          font-size: 0.76rem;
        }
        .tt-adp-score-strip b { color: #00DC7D; font-size: 0.88rem; }
        html[data-theme='light'] .tt-adp-score-strip b { color: #007A44; }
        .tt-adp-kicker {
          display: block; font-size: 0.59rem; font-weight: 900; letter-spacing: 0.08em;
          color: #E5C16C; text-transform: uppercase; margin-bottom: 4px;
        }
        html[data-theme='light'] .tt-adp-kicker { color: #8A5D10; }
        .tt-adp-reason-box {
          padding: 11px 12px; border-radius: 14px;
          background: rgba(239, 68, 68, 0.11); border: 1px solid rgba(248, 113, 113, 0.4);
        }
        .tt-adp-reason-box strong { display: block; font-size: 0.82rem; }
        .tt-adp-reason-box p { margin: 4px 0 0; font-size: 0.76rem; line-height: 1.42; }
        .tt-adp-claimed { display: block; margin-top: 6px; font-size: 0.72rem; color: #7DD3FC; }
        html[data-theme='light'] .tt-adp-claimed { color: #0369A1; }
        .tt-adp-contacts-block, .tt-adp-verdict-block { display: flex; flex-direction: column; gap: 8px; }
        .tt-adp-contact-row {
          padding: 9px 10px; border-radius: 13px; background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
        }
        .tt-adp-contact-id { display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1; }
        .tt-adp-role-chip {
          padding: 1px 6px; border-radius: 6px; font-size: 0.56rem; font-weight: 900;
        }
        .tt-adp-role-chip.is-warn { background: rgba(239, 68, 68, 0.22); color: #FCA5A5; }
        .tt-adp-role-chip.is-info { background: rgba(56, 189, 248, 0.2); color: #7DD3FC; }
        html[data-theme='light'] .tt-adp-role-chip.is-warn { background: #FEE2E2; color: #B91C1C; }
        html[data-theme='light'] .tt-adp-role-chip.is-info { background: #E0F2FE; color: #0369A1; }
        .tt-adp-contact-btns { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .tt-adp-mini-btn {
          min-height: 32px; padding: 0 10px; border-radius: 9px;
          background: var(--tt-surface); border: 1px solid var(--tt-border-medium);
          color: var(--tt-text); font-size: 0.7rem; font-weight: 800; text-decoration: none;
          display: inline-flex; align-items: center; gap: 5px; cursor: pointer;
        }
        .tt-adp-mini-btn.is-wa {
          background: rgba(37, 211, 102, 0.18); border-color: rgba(37, 211, 102, 0.48); color: #4ADE80;
        }
        html[data-theme='light'] .tt-adp-mini-btn.is-wa { background: #E7FBF0; color: #15803D; }
        .tt-adp-mini-btn.is-mail {
          background: rgba(56, 189, 248, 0.16); border-color: rgba(56, 189, 248, 0.45); color: #7DD3FC;
        }
        html[data-theme='light'] .tt-adp-mini-btn.is-mail { background: #E8F6FE; color: #0369A1; }
        .tt-adp-missing-pill { font-size: 0.64rem; font-weight: 800; opacity: 0.6; padding: 0 6px; }
        .tt-adp-verdict-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .tt-adp-btn {
          min-height: 39px; padding: 0 11px; border-radius: 12px;
          background: var(--tt-surface-2); border: 1px solid var(--tt-border-medium);
          color: var(--tt-text); font-size: 0.73rem; font-weight: 900; cursor: pointer;
        }
        .tt-adp-btn.is-emerald { background: linear-gradient(180deg, #22F397 0%, #00B866 100%); color: #0D0219; border-color: transparent; }
        .tt-adp-btn.is-gold { background: linear-gradient(180deg, #FAE9B6 0%, #D4A33D 100%); color: #1A1002; border-color: transparent; }
        .tt-adp-btn.is-danger { background: rgba(239, 68, 68, 0.2); border-color: rgba(248, 113, 113, 0.55); color: #FCA5A5; }
        html[data-theme='light'] .tt-adp-btn.is-danger { background: #FEE2E2; color: #B91C1C; }
        .tt-adp-editor {
          margin-top: 4px; padding: 12px; border-radius: 14px;
          background: var(--tt-surface-2); border: 1px solid rgba(229, 193, 108, 0.45);
          display: flex; flex-direction: column; gap: 9px;
        }
        .tt-adp-editor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; }
        .tt-adp-set-col small { display: block; font-size: 0.63rem; font-weight: 800; color: var(--tt-text-muted); margin-bottom: 4px; }
        .tt-adp-pair { display: flex; align-items: center; gap: 6px; }
        .tt-adp-pair input {
          width: 48px; height: 38px; border-radius: 9px; text-align: center;
          background: var(--tt-surface); border: 1.5px solid var(--tt-border-medium);
          color: var(--tt-text); font-weight: 900; font-size: 1rem;
        }
        .tt-adp-note-input {
          width: 100%; min-height: 38px; padding: 0 11px; border-radius: 10px;
          background: var(--tt-surface); border: 1px solid var(--tt-border-medium);
          color: var(--tt-text); font-size: 0.76rem;
        }
        .tt-adp-preview {
          padding: 9px 10px; border-radius: 11px;
          background: rgba(0, 220, 125, 0.12); border: 1px solid rgba(0, 220, 125, 0.4);
          font-size: 0.75rem; display: flex; flex-direction: column; gap: 3px;
        }
        .tt-adp-wo-row { display: flex; gap: 7px; flex-wrap: wrap; }
        .tt-adp-pending-box {
          padding: 12px; border-radius: 15px; background: var(--tt-surface-2);
          border: 1px solid var(--tt-border); display: flex; flex-direction: column; gap: 8px;
        }
        .tt-adp-pending-row {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding-top: 7px; border-top: 1px solid var(--tt-border);
        }
        .tt-adp-pending-row strong { display: block; font-size: 0.79rem; }
        .tt-adp-pending-row small { display: block; font-size: 0.68rem; color: var(--tt-text-muted); }
      `}</style>
    </div>
  );
}
