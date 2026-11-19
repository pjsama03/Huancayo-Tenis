import React, { useEffect, useState } from 'react';
import {
  IconBadge,
  ModalPortal,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (LOS 4 PASOS DE LA GUÍA INTERACTIVA)
   --------------------------------------------------------------------------
   - Cambia textos, tips o pestaña de destino aquí sin tocar diseño ni lógica.
   ========================================================================== */
export const TUTORIAL_STORAGE_KEY = 'tt_tutorial_seen_v1';

export const TUTORIAL_EDITABLE_STEPS = [
  {
    id: 'step-1',
    badge: 'PASO 1 DE 4 · CALIBRACIÓN 0/5',
    title: 'Tus primeros 5 partidos fijan tu nivel real',
    description:
      'Empiezas con un puntaje provisional según tus respuestas. En tus primeros 5 encuentros en cancha, cada game y cada tie-break que pelees calibran tu categoría exacta.',
    tip: 'Incluso si pierdes ante un rival duro, hacer games protege tu puntaje.',
    icon: 'chart',
    accent: '#00DC7D',
    targetTab: 'perfil',
    actionLabel: 'Ir a Mi Perfil',
  },
  {
    id: 'step-2',
    badge: 'PASO 2 DE 4 · RADAR DE RIVALES',
    title: 'Encuentra oponentes de tu mismo ritmo',
    description:
      'En Retos → Lanzar Reto filtramos automáticamente a jugadores dentro de tu rango competitivo (±1,200 pts). También puedes pactar partidos amistosos con cualquier amigo.',
    tip: 'Elige una de las 4 sedes oficiales o escribe cualquier cancha personalizada.',
    icon: 'challenge',
    accent: '#38BDF8',
    targetTab: 'retos',
    actionLabel: 'Explorar Rivales',
  },
  {
    id: 'step-3',
    badge: 'PASO 3 DE 4 · PRONÓSTICO Y MARCADOR',
    title: 'Ves los puntos en juego antes de entrar a cancha',
    description:
      'Antes de enviar un reto ves exactamente cuánto puedes ganar o cuidar. En cancha, nuestro marcador inteligente cuenta sets, tie-breaks a 7+ y super tie-break a 10+ sin errores.',
    tip: 'Solo los 2 jugadores del partido o un Juez en Cancha pueden editar el marcador.',
    icon: 'scoreboard',
    accent: '#F59E0B',
    targetTab: 'retos',
    actionLabel: 'Ver Cartelera',
  },
  {
    id: 'step-4',
    badge: 'PASO 4 DE 4 · GEMAS Y MASTER TOP 8',
    title: 'Suma Gemas, canjea y presume tus victorias',
    description:
      'Juega torneos, reporta el clima de tu club (+5 💎), canjea descuentos reales en el Pro Shop o con Coaches (20 💎 = S/ 1.00) y publica tus triunfos en Stories 9:16.',
    tip: 'Al cierre anual, los 8 primeros de la tabla juegan el Master Top 8 sin costo.',
    icon: 'trophy',
    accent: '#00DC7D',
    targetTab: 'torneos',
    actionLabel: 'Empezar a Jugar',
  },
];

/* ==========================================================================
   COMPONENTE PRINCIPAL: OnboardingTutorialModal (BLOQUE 24B DE 26)
   ========================================================================== */
export default function OnboardingTutorialModal({
  isOpen = false,
  onClose,
  onNavigateTab,
}) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (isOpen) setStepIdx(0);
  }, [isOpen]);

  const markSeenAndClose = (navigateToTab = null) => {
    try {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
    } catch (e) {
      // continuar si storage privado
    }
    triggerHaptic('success');
    if (navigateToTab && onNavigateTab) onNavigateTab(navigateToTab);
    if (onClose) onClose();
  };

  const current = TUTORIAL_EDITABLE_STEPS[stepIdx] || TUTORIAL_EDITABLE_STEPS[0];
  const isLast = stepIdx === TUTORIAL_EDITABLE_STEPS.length - 1;

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={() => markSeenAndClose(null)}
      title="Guía Rápida · TOTAL TENIS"
      subtitle="Todo lo que necesitas saber en 4 pasos (solo se muestra una vez)"
      icon={<IconBadge name={current.icon} variant="emerald" size={38} />}
      isTopLayer
    >
      <div className="tt-tut-root">
        {/* Barra de progreso en 4 segmentos */}
        <div className="tt-tut-progress">
          {TUTORIAL_EDITABLE_STEPS.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              aria-label={`Ir al paso ${idx + 1}`}
              className={`tt-tut-seg ${idx <= stepIdx ? 'is-lit' : ''}`}
              onClick={() => {
                triggerHaptic('light');
                setStepIdx(idx);
              }}
            />
          ))}
        </div>

        {/* Tarjeta Animada del Paso Actual */}
        <div key={current.id} className="tt-tut-stage">
          <div className="tt-tut-visual-box" style={{ borderColor: `${current.accent}66` }}>
            <div className="tt-tut-glow" style={{ background: `${current.accent}24` }} />
            <div className="tt-tut-big-badge" style={{ borderColor: current.accent }}>
              <TTIcon name={current.icon} size={34} style={{ color: current.accent }} />
            </div>
            <span className="tt-tut-step-pill" style={{ color: current.accent }}>
              {current.badge}
            </span>
          </div>

          <h3 className="tt-tut-title">{current.title}</h3>
          <p className="tt-tut-desc">{current.description}</p>

          <div className="tt-tut-tip">
            <TTIcon name="check" size={16} style={{ color: '#00DC7D', flexShrink: 0 }} />
            <span>{current.tip}</span>
          </div>
        </div>

        {/* Navegación Inferior Limpia */}
        <div className="tt-tut-footer">
          {stepIdx > 0 ? (
            <button
              type="button"
              className="tt-btn tt-btn-ghost tt-btn-sm"
              onClick={() => {
                triggerHaptic('light');
                setStepIdx((i) => Math.max(0, i - 1));
              }}
            >
              ‹ Anterior
            </button>
          ) : (
            <button
              type="button"
              className="tt-btn tt-btn-ghost tt-btn-sm"
              onClick={() => markSeenAndClose(null)}
            >
              Omitir
            </button>
          )}

          {!isLast ? (
            <button
              type="button"
              className="tt-btn tt-btn-primary tt-btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                triggerHaptic('light');
                setStepIdx((i) => Math.min(TUTORIAL_EDITABLE_STEPS.length - 1, i + 1));
              }}
            >
              Siguiente paso →
            </button>
          ) : (
            <button
              type="button"
              className="tt-btn tt-btn-primary tt-btn-sm"
              style={{ flex: 1 }}
              onClick={() => markSeenAndClose(current.targetTab)}
            >
              {current.actionLabel}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .tt-tut-root {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-tut-progress {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .tt-tut-seg {
          height: 6px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          transition: background-color 220ms ease;
        }
        .tt-tut-seg.is-lit {
          background: linear-gradient(90deg, #00DC7D 0%, #6EF2B5 100%);
        }
        .tt-tut-stage {
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: ttTutIn 260ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes ttTutIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .tt-tut-visual-box {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          padding: 24px 16px 18px;
          background: linear-gradient(135deg, #250942 0%, #140324 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.45);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .tt-tut-glow {
          position: absolute;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          filter: blur(28px);
          pointer-events: none;
        }
        .tt-tut-big-badge {
          position: relative;
          z-index: 2;
          width: 70px;
          height: 70px;
          border-radius: 22px;
          background: rgba(18, 3, 33, 0.85);
          border: 2px solid #00DC7D;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.4);
        }
        .tt-tut-step-pill {
          position: relative;
          z-index: 2;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.1em;
        }
        .tt-tut-title {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-size: 1.4rem;
          line-height: 1.06;
        }
        .tt-tut-desc {
          margin: 0;
          font-size: 0.82rem;
          line-height: 1.48;
          color: var(--tt-text-muted);
        }
        .tt-tut-tip {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 11px 12px;
          border-radius: 14px;
          background: rgba(0, 220, 125, 0.12);
          border: 1px solid rgba(0, 220, 125, 0.34);
          font-size: 0.76rem;
          font-weight: 700;
          line-height: 1.38;
        }
        .tt-tut-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 4px;
        }
      `}</style>
    </ModalPortal>
  );
}
