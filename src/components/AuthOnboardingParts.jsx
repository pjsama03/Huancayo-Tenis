import React, { useState } from 'react';
import { triggerHaptic } from './AppIcons';
import { normalizePeruPhone } from '../utils/cloudService';

/* ==========================================================================
   4 TARJETAS RÁPIDAS DE CALIBRACIÓN (100 % LITERALES DE TU ARCHIVO ORIGINAL)
   ========================================================================== */
export const CALIBRATION_FLASHCARDS = [
  {
    id: 'fc-contact',
    stepLabel: 'TARJETA 1 DE 4',
    kicker: 'TU CONTACTO CON LA RAQUETA',
    question: '¿Qué tan seguido has jugado tenis antes?',
    helper: 'Esto solo sirve para sugerirte rivales de tu mismo ritmo desde el primer día.',
    scene: 'net',
    options: [
      {
        level: 1,
        score: 0,
        badge: 'NIVEL CERO',
        title: 'Empiezo totalmente de cero',
        desc: 'Nunca he jugado tenis o recién voy a tomar mis primeras clases.',
        reassurance: '¡Bienvenido! Te ubicaremos con jugadores nuevos para que disfrutes desde el día 1.',
      },
      {
        level: 2,
        score: 1,
        badge: 'PRIMEROS PELOTEOS',
        title: 'He jugado muy pocas veces',
        desc: 'Sé agarrar la raqueta y pasar algunas pelotas suaves por encima de la red.',
        reassurance: 'Perfecto: ya rompiste el hielo y pronto ganarás consistencia en cancha.',
      },
      {
        level: 3,
        score: 2,
        badge: 'RITMO FRECUENTE',
        title: 'Juego seguido con amigos o clases',
        desc: 'Logro mantener intercambios largos de un lado al otro de la cancha.',
        reassurance: '¡Excelente base! Tendrás partidos muy parejos desde la primera semana.',
      },
      {
        level: 4,
        score: 3,
        badge: 'EXPERIENCIA',
        title: 'Juego hace años y compito',
        desc: 'Tengo buen ritmo, controlo los golpes y juego partidos exigentes seguido.',
        reassurance: 'Gran nivel: tus primeros 5 partidos de prueba afinarán tu puesto arriba.',
      },
    ],
  },
  {
    id: 'fc-serve',
    stepLabel: 'TARJETA 2 DE 4',
    kicker: 'EMPEZAR EL PUNTO (EL SAQUE)',
    question: 'Cuando te toca sacar para iniciar el punto, ¿cómo lo haces?',
    helper: 'Piensa en tu saque real durante un set o un peloteo formal.',
    scene: 'serve',
    options: [
      {
        level: 1,
        score: 0,
        badge: 'NIVEL CERO',
        title: 'Todavía no sé sacar',
        desc: 'Prefiero soltarla suave desde abajo o aún estoy aprendiendo el movimiento.',
        reassurance: 'Sin problema: en la categoría inicial muchos empiezan sacando suave.',
      },
      {
        level: 2,
        score: 1,
        badge: 'SAQUE SEGURO',
        title: 'La paso suave por arriba para que entre',
        desc: 'No busco fuerza todavía; mi meta es meterla en el cuadro sin fallar.',
        reassurance: 'Muy inteligente: asegurar la bola en juego te hará ganar muchos puntos.',
      },
      {
        level: 3,
        score: 2,
        badge: 'SAQUE FIRME',
        title: 'Tengo un saque cómodo y casi no fallo',
        desc: 'El primero va con buena velocidad y tengo un segundo saque seguro.',
        reassurance: '¡Sólido! Un segundo saque confiable marca diferencia en partidos reales.',
      },
      {
        level: 4,
        score: 3,
        badge: 'SAQUE DE ATAQUE',
        title: 'Saco fuerte buscando esquinas o efecto',
        desc: 'Dirijo la pelota con potencia o efecto (slice/kick) para empezar atacando.',
        reassurance: 'Armamento pesado: te mediremos contra rivales que puedan devolver ese ritmo.',
      },
    ],
  },
  {
    id: 'fc-movement',
    stepLabel: 'TARJETA 3 DE 4',
    kicker: 'PELOTEANDO EN MOVIMIENTO',
    question: 'Si la pelota viene a los costados y te hace correr, ¿qué pasa?',
    helper: 'Imagina un intercambio real donde tu rival te mueve de esquina a esquina.',
    scene: 'rally',
    options: [
      {
        level: 1,
        score: 0,
        badge: 'NIVEL CERO',
        title: 'Recién aprendo a calcular el bote',
        desc: 'A veces me cuesta llegar a tiempo o calcular dónde va a picar la pelota.',
        reassurance: 'Totalmente normal al inicio; el ojo se entrena rapidísimo jugando.',
      },
      {
        level: 2,
        score: 1,
        badge: 'DEVOLUCIÓN BÁSICA',
        title: 'Llego y la devuelvo al centro como puedo',
        desc: 'Pongo la raqueta para cruzarla de vuelta, aunque sin mucha dirección.',
        reassurance: '¡Buen reflejo! Pasar una pelota más que el rival siempre suma.',
      },
      {
        level: 3,
        score: 2,
        badge: 'AGUANTE EN CANCHA',
        title: 'Llego bien y sostengo el intercambio',
        desc: 'Corro a las esquinas, devuelvo alto o cruzado y cambio de dirección.',
        reassurance: 'Consistencia de club: ya juegas puntos completos con estrategia.',
      },
      {
        level: 4,
        score: 3,
        badge: 'CONTRAATAQUE',
        title: 'Llego cómodo y respondo atacando',
        desc: 'Incluso en carrera puedo responder profundo y buscar el espacio libre.',
        reassurance: 'Ritmo competitivo alto: listo para medirse en la parte alta del circuito.',
      },
    ],
  },
  {
    id: 'fc-control',
    stepLabel: 'TARJETA 4 DE 4',
    kicker: 'CONTROL DE GOLPES Y PARTIDOS',
    question: 'En un partido real, ¿cómo controlas la dirección, efectos y presión?',
    helper: 'Última tarjeta: con esto armamos tu categoría inicial lista para jugar.',
    scene: 'trophy',
    options: [
      {
        level: 1,
        score: 0,
        badge: 'NIVEL CERO',
        title: 'Recién empiezo y estoy aprendiendo el juego',
        desc: 'Aún no juego sets completos; quiero aprender reglas y sumar mis primeros partidos.',
        reassurance: '¡Perfecto! La app te acompaña en tus primeros 5 partidos sin presión.',
      },
      {
        level: 2,
        score: 1,
        badge: 'GOLPE BÁSICO',
        title: 'Paso la pelota plana y juego sets ocasionales',
        desc: 'Busco meter la bola dentro de la cancha; aún no uso mucho efecto ni estrategia.',
        reassurance: 'Ideal para arrancar tus 5 partidos de prueba con rivales parejos.',
      },
      {
        level: 3,
        score: 2,
        badge: 'EFECTO Y DIRECCIÓN',
        title: 'Uso topspin o slice y juego sets seguido',
        desc: 'Dirijo cruzado o paralelo, juego partidos de club y manejo bien el marcador.',
        reassurance: '¡Tienes ritmo real de partido! Te sentirás como en casa en nuestra cartelera.',
      },
      {
        level: 4,
        score: 3,
        badge: 'NIVEL TORNEO',
        title: 'Compito en cuadros con estrategia y efectos',
        desc: 'Controlo altura, profundidad, cambio de ritmo y manejo la presión en tie-breaks.',
        reassurance: 'Perfil competitivo confirmado: arrancas listo para desafiar a los líderes.',
      },
    ],
  },
];

export function computeCalibrationSeed(answersMap, maxSeedPoints = 3350) {
  const totalScore = CALIBRATION_FLASHCARDS.reduce((acc, card) => {
    const picked = answersMap[card.id];
    return acc + (picked ? Number(picked.score) || 0 : 0);
  }, 0);

  if (totalScore <= 2) {
    return {
      points: 300,
      headline: 'Ritmo Inicial · Bienvenida sin presión',
      summary: 'Arrancas en la base ideal para disfrutar tus primeros peloteos y partidos en cancha.',
    };
  }
  if (totalScore <= 5) {
    return {
      points: 850,
      headline: 'Ritmo En Progreso · Base Firme',
      summary: 'Ya pasas la bola con soltura y estás listo para disputar partidos con rivales de tu mismo paso.',
    };
  }
  if (totalScore <= 8) {
    return {
      points: 1450,
      headline: 'Ritmo Consolidado de Club',
      summary: 'Mantienes peloteos largos y juegas sets completos. Tus primeros 5 partidos de prueba afinarán tu puesto oficial.',
    };
  }
  if (totalScore <= 10) {
    return {
      points: 2200,
      headline: 'Ritmo Competitivo de Cancha',
      summary: 'Buen control de golpes y ritmo real de partido. Estás en zona competitiva para escalar rápido.',
    };
  }
  return {
    points: Math.min(3100, maxSeedPoints),
    headline: 'Ritmo Avanzado · Desafío de Altura',
    summary: 'Arrancas en el tope provisional del cuestionario. Tus 5 partidos de prueba validarán tu entrada a la zona alta.',
  };
}

/* ==========================================================================
   ILUSTRACIÓN SVG DE MINI-CANCHA POR TARJETA (100 % INTACTA)
   ========================================================================== */
export function FlashCardCourtIllustration({ scene = 'net', selectedLevel = 0 }) {
  const accent = selectedLevel >= 3 ? '#00DC7D' : selectedLevel === 2 ? '#38BDF8' : '#E5C16C';

  return (
    <div className="tt-fc-svg-stage" aria-hidden="true">
      <svg viewBox="0 0 280 96" fill="none" className="tt-fc-svg">
        <rect x="4" y="6" width="272" height="84" rx="16" fill="#18052B" stroke="rgba(250,249,245,0.14)" strokeWidth="1.5" />
        <rect x="24" y="18" width="232" height="60" rx="6" stroke="rgba(250,249,245,0.22)" strokeWidth="1.5" />
        <line x1="140" y1="14" x2="140" y2="82" stroke="#FAF9F5" strokeWidth="2.5" strokeDasharray="4 3" />
        <line x1="78" y1="18" x2="78" y2="78" stroke="rgba(250,249,245,0.16)" strokeWidth="1.2" />
        <line x1="202" y1="18" x2="202" y2="78" stroke="rgba(250,249,245,0.16)" strokeWidth="1.2" />
        <line x1="78" y1="48" x2="202" y2="48" stroke="rgba(250,249,245,0.16)" strokeWidth="1.2" />

        {scene === 'net' && (
          <>
            <path d="M44 64 Q 140 12 232 54" stroke={accent} strokeWidth="3" strokeDasharray="6 4" strokeLinecap="round" />
            <circle cx="44" cy="64" r="6" fill="#FAF9F5" />
            <circle cx="232" cy="54" r="7" fill={accent} className="tt-fc-ball-pulse" />
          </>
        )}

        {scene === 'serve' && (
          <>
            <path d="M28 68 Q 108 14 176 34" stroke={accent} strokeWidth="3.2" strokeLinecap="round" />
            <rect x="140" y="18" width="62" height="30" fill="rgba(0,220,125,0.16)" stroke="#00DC7D" strokeWidth="1.5" />
            <circle cx="28" cy="68" r="5.5" fill="#FAF9F5" />
            <circle cx="176" cy="34" r="7" fill={accent} className="tt-fc-ball-pulse" />
          </>
        )}

        {scene === 'rally' && (
          <>
            <path d="M42 28 L 236 66 L 46 68 L 234 28" stroke={accent} strokeWidth="2.6" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="234" cy="28" r="7" fill={accent} className="tt-fc-ball-pulse" />
            <circle cx="46" cy="68" r="5" fill="#FAF9F5" />
          </>
        )}

        {scene === 'trophy' && (
          <>
            <path d="M38 66 Q 138 14 238 30" stroke="#00DC7D" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M38 30 Q 138 72 238 62" stroke="#E5C16C" strokeWidth="2.4" strokeDasharray="5 4" strokeLinecap="round" />
            <circle cx="238" cy="30" r="6.5" fill="#00DC7D" className="tt-fc-ball-pulse" />
            <circle cx="238" cy="62" r="5.5" fill="#E5C16C" />
          </>
        )}
      </svg>
    </div>
  );
}

/* ==========================================================================
   VISTA EMANCIPACIÓN +18 (CONSERVA 100 % DE PUNTOS, CATEGORÍA E HISTORIAL)
   Usa exactamente las mismas clases de diseño de AuthAndOnboardingModal.jsx
   ========================================================================== */
export function ClaimEmancipationView({
  isSubmitting = false,
  onSubmitClaim,
  onValidationError,
  onOpenLegal,
  onBackToLogin,
}) {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappOk, setWhatsappOk] = useState(false);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [legalOk, setLegalOk] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const digits = whatsapp.replace(/\D/g, '');

    if (cleanCode.length < 6) {
      triggerHaptic('warning');
      if (onValidationError) onValidationError('Ingresa el código de transferencia generado por tu padre/madre (ej. TT-LIB-4K9M).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      triggerHaptic('warning');
      if (onValidationError) onValidationError('Ingresa tu nuevo correo electrónico válido.');
      return;
    }
    if (digits.length < 9 || !whatsappOk) {
      triggerHaptic('warning');
      if (onValidationError) onValidationError('Ingresa y confirma tu WhatsApp propio (9 dígitos).');
      return;
    }
    if (password.length < 6) {
      triggerHaptic('warning');
      if (onValidationError) onValidationError('Crea una contraseña de al menos 6 caracteres.');
      return;
    }
    if (!legalOk) {
      triggerHaptic('warning');
      if (onValidationError) onValidationError('Acepta los Términos y Política de Privacidad para continuar.');
      return;
    }

    if (onSubmitClaim) {
      onSubmitClaim({
        code: cleanCode,
        email: cleanEmail,
        whatsapp: normalizePeruPhone(whatsapp),
        password,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="tt-auth-form">
      <span className="tt-fc-kicker-light">EMANCIPACIÓN +18 · 0 PUNTOS PERDIDOS</span>
      <h1 className="tt-auth-h1">Reclama tu cuenta independiente</h1>
      <p className="tt-auth-lead">
        Ingresa el código que generó tu padre/madre desde su perfil para pasar tu cuenta a tu propio correo y WhatsApp conservando el 100 % de tus puntos, categoría e historial.
      </p>

      <div className="tt-auth-field">
        <label htmlFor="tt-em-code">Código de Emancipación</label>
        <input
          id="tt-em-code"
          type="text"
          className="tt-auth-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ej. TT-LIB-4K9M"
          required
        />
      </div>

      <div className="tt-auth-grid-2">
        <div className="tt-auth-field">
          <label htmlFor="tt-em-mail">Tu nuevo correo electrónico</label>
          <input
            id="tt-em-mail"
            type="email"
            className="tt-auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
          />
        </div>
        <div className="tt-auth-field">
          <label htmlFor="tt-em-wa">Tu WhatsApp propio (9 dígitos)</label>
          <input
            id="tt-em-wa"
            type="tel"
            inputMode="numeric"
            maxLength={12}
            className="tt-auth-input"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="964 123 456"
            required
          />
        </div>
      </div>

      <label className="tt-phone-confirm-check">
        <input
          type="checkbox"
          checked={whatsappOk}
          onChange={(e) => {
            triggerHaptic('light');
            setWhatsappOk(e.target.checked);
          }}
        />
        <span>
          Confirmo que soy mayor de 18 años y que{' '}
          <strong>
            {whatsapp.replace(/\D/g, '').length >= 9 ? normalizePeruPhone(whatsapp) : 'este número'}
          </strong>{' '}
          es mi WhatsApp personal.
        </span>
      </label>

      <div className="tt-auth-field">
        <label htmlFor="tt-em-pass">Crea tu contraseña propia (mín. 6 caracteres)</label>
        <div className="tt-pass-wrap">
          <input
            id="tt-em-pass"
            type={showPass ? 'text' : 'password'}
            className="tt-auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />
          <button type="button" className="tt-eye-btn" onClick={() => setShowPass((v) => !v)}>
            {showPass ? 'Ocultar' : 'Ver'}
          </button>
        </div>
      </div>

      <label className="tt-legal-check">
        <input
          type="checkbox"
          checked={legalOk}
          onChange={(e) => {
            triggerHaptic('light');
            setLegalOk(e.target.checked);
          }}
        />
        <span>
          Declaro ser mayor de 18 años y acepto los{' '}
          <button
            type="button"
            className="tt-legal-inline-link"
            onClick={() => onOpenLegal && onOpenLegal('terms')}
          >
            Términos y Condiciones
          </button>{' '}
          y la{' '}
          <button
            type="button"
            className="tt-legal-inline-link"
            onClick={() => onOpenLegal && onOpenLegal('privacy')}
          >
            Política de Privacidad (Ley N° 29733)
          </button>{' '}
          de TOTAL TENIS.
        </span>
      </label>

      <div className="tt-fg-actions">
        <button type="button" className="tt-fg-back" onClick={onBackToLogin}>
          « Volver
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="tt-auth-primary-pill is-emerald is-compact"
        >
          {isSubmitting ? 'Transfiriendo...' : 'Activar mi Cuenta +18'}
        </button>
      </div>
    </form>
  );
}
