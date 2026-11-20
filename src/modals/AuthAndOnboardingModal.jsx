import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ASSETS,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import {
  APP_CONFIG,
  INITIAL_CLUBS,
  getCategoryByPoints,
} from '../data/playersAndClubsData';
import { ELO_CONFIG } from '../utils/tenisEngine';
import {
  buildWhatsappLink,
  isCloudReady,
  normalizePeruPhone,
  sendCloudPasswordReset,
  signInCloudAccount,
  signUpCloudAccount,
  upsertCloudPlayer,
} from '../utils/cloudService';

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (PÓSTERES, BONO GEMAS Y ACCESO ALIADOS)
   - Cambia `enableDemoQuickLogin` a `false` el día del lanzamiento público.
   ========================================================================== */
export const AUTH_ONBOARDING_EDITABLE_CONFIG = {
  brandName: 'TOTAL TENIS',
  welcomeGems: 20,
  minAgeAllowed: 18,
  maxSeedPointsFromQuiz: 3350,
  enableDemoQuickLogin: true,
  posters: {
    login: '/assets/login-poster-esmeralda.jpg',
    register: '/assets/registro-poster-purpura.jpg',
  },
  partnerPins: {
    '7101': { id: 'coach-rodrigo', name: 'Rodrigo Villavicencio', role: 'COACH' },
    '7202': { id: 'coach-romina', name: 'Romina Cutipa', role: 'COACH' },
    '7303': { id: 'coach-carlos', name: 'Carlos Méndez', role: 'COACH' },
  },
};

/* ==========================================================================
   4 TARJETAS RÁPIDAS PARA NOVATOS (LENGUAJE NATURAL · OPCIÓN NIVEL CERO)
   ========================================================================== */
export const CALIBRATION_FLASHCARDS = [
  {
    id: 'fc-contact',
    stepLabel: 'TARJETA 1 DE 4',
    kicker: 'TU CONTACTO CON LA RAQUETA',
    question: '¿Qué tan seguido has jugado tenis antes?',
    helper: 'No hay respuestas buenas ni malas: esto solo sirve para juntarte con gente de tu mismo ritmo.',
    scene: 'net',
    options: [
      {
        level: 1,
        score: 0,
        badge: 'NIVEL CERO',
        title: 'Empiezo totalmente de cero',
        desc: 'Nunca he jugado tenis o recién voy a tomar mis primeras clases.',
        reassurance: '¡Bienvenido! Te ubicaremos con jugadores nuevos para que te diviertas desde el día 1.',
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
        reassurance: '¡Excelente base! Tendrás partidos muy parejos y entretenidos desde la primera semana.',
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
    question: 'Cuando te toca iniciar el punto lanzando la bola, ¿cómo lo haces?',
    helper: 'Imagina que estás detrás de la línea del fondo y debes pasar la pelota al otro lado.',
    scene: 'serve',
    options: [
      {
        level: 1,
        score: 0,
        badge: 'NIVEL CERO',
        title: 'Todavía no sé sacar',
        desc: 'Prefiero soltarla suave desde abajo o aún estoy aprendiendo el movimiento.',
        reassurance: 'Sin problema: en la categoría inicial muchos empiezan sacando suave para aprender.',
      },
      {
        level: 2,
        score: 1,
        badge: 'SAQUE SEGURO',
        title: 'La paso suave por arriba para que entre',
        desc: 'No busco fuerza todavía; mi meta es meterla en el cuadro sin equivocarme.',
        reassurance: 'Muy inteligente: asegurar la bola en juego te hará ganar muchos puntos.',
      },
      {
        level: 3,
        score: 2,
        badge: 'SAQUE FIRME',
        title: 'Tengo un saque cómodo y casi no fallo',
        desc: 'El primero va con buena velocidad y si fallo, tengo un segundo saque seguro.',
        reassurance: '¡Sólido! Un segundo saque confiable marca mucha diferencia en partidos reales.',
      },
      {
        level: 4,
        score: 3,
        badge: 'SAQUE DE ATAQUE',
        title: 'Saco fuerte buscando las esquinas',
        desc: 'Dirijo la pelota hacia donde le incomoda al rival para empezar atacando.',
        reassurance: 'Armamento pesado: te mediremos contra rivales que puedan devolver ese ritmo.',
      },
    ],
  },
  {
    id: 'fc-movement',
    stepLabel: 'TARJETA 3 DE 4',
    kicker: 'PELOTEANDO EN MOVIMIENTO',
    question: 'Si la pelota viene hacia los costados y te hace correr, ¿qué pasa?',
    helper: 'Piensa en un peloteo real donde el otro jugador te mueve de izquierda a derecha.',
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
        desc: 'Corro a las esquinas, devuelvo alto o cruzado y puedo cambiar de dirección.',
        reassurance: 'Consistencia de club: ya juegas puntos completos con estrategia.',
      },
      {
        level: 4,
        score: 3,
        badge: 'CONTRAATAQUE',
        title: 'Llego cómodo y respondo atacando',
        desc: 'Incluso corriendo puedo devolver fuerte y buscar el espacio libre del rival.',
        reassurance: 'Ritmo competitivo alto: listo para medirse en la parte alta del circuito.',
      },
    ],
  },
  {
    id: 'fc-matches',
    stepLabel: 'TARJETA 4 DE 4',
    kicker: 'PARTIDOS Y PUNTAJE',
    question: '¿Conoces cómo se cuentan los puntos (15, 30, 40) y has jugado partidos?',
    helper: 'Última tarjeta: con esto armamos tu perfil inicial listo para salir a jugar.',
    scene: 'trophy',
    options: [
      {
        level: 1,
        score: 0,
        badge: 'NIVEL CERO',
        title: 'Aún no sé contar los puntos',
        desc: 'Quiero aprender las reglas básicas jugando mis primeros encuentros amigables.',
        reassurance: '¡Nuestra app lleva el marcador por ti toque a toque, así aprenderás facilísimo!',
      },
      {
        level: 2,
        score: 1,
        badge: 'AMISTOSOS',
        title: 'Sé contar, pero casi no juego sets',
        desc: 'Entiendo el 15-30-40 y a veces juego games sueltos con conocidos.',
        reassurance: 'Ideal para arrancar tus 5 partidos de prueba sin presión.',
      },
      {
        level: 3,
        score: 2,
        badge: 'PARTIDOS DE CLUB',
        title: 'Juego partidos completos casi cada semana',
        desc: 'Estoy acostumbrado a jugar sets completos y desempates con amigos.',
        reassurance: '¡Tienes ritmo de partido! Te sentirás como en casa en nuestra cartelera.',
      },
      {
        level: 4,
        score: 3,
        badge: 'TORNEOS',
        title: 'He competido en torneos o campeonatos',
        desc: 'He disputado cuadros de clubes locales o regionales con regularidad.',
        reassurance: 'Perfil competitivo confirmado: arrancas listo para desafiar a los líderes.',
      },
    ],
  },
];

function computeCalibrationSeed(answersMap) {
  const totalScore = CALIBRATION_FLASHCARDS.reduce((acc, card) => {
    const picked = answersMap[card.id];
    return acc + (picked ? Number(picked.score) || 0 : 0);
  }, 0);

  if (totalScore <= 2) {
    return {
      points: 300,
      headline: 'Ritmo Inicial · Bienvenida sin presión',
      summary: 'Arrancas en la base perfecta para disfrutar tus primeros peloteos y aprender contando puntos con la app.',
    };
  }
  if (totalScore <= 5) {
    return {
      points: 850,
      headline: 'Ritmo En Progreso · Base Firme',
      summary: 'Ya pasas la bola con soltura y estás listo para disputar partidos entretenidos con rivales de tu mismo paso.',
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
    points: Math.min(3100, AUTH_ONBOARDING_EDITABLE_CONFIG.maxSeedPointsFromQuiz),
    headline: 'Ritmo Avanzado · Desafío de Altura',
    summary: 'Arrancas en el tope provisional del cuestionario. Para ingresar a la zona más alta del ranking, demuéstralo en tus 5 partidos de prueba.',
  };
}

function generateMathCaptcha() {
  const a = Math.floor(Math.random() * 19) + 11;
  const b = Math.floor(Math.random() * 19) + 10;
  return { a, b, answer: a + b };
}

function translateAuthError(rawError) {
  const msg = String(rawError?.message || rawError || '').toLowerCase();
  if (msg.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos. Verifica tus datos o recupera tu clave abajo.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Aún falta confirmar tu correo. Revisa tu bandeja de entrada o carpeta de spam.';
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'Ese correo ya tiene una cuenta registrada. Inicia sesión o recupera tu contraseña.';
  }
  if (msg.includes('password should be at least')) {
    return 'Tu contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Hiciste varios intentos seguidos. Espera un minuto y vuelve a intentarlo.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Sin conexión estable a internet. Revisa tu señal e intenta de nuevo.';
  }
  return 'No pudimos completar el acceso. Revisa tus datos e inténtalo nuevamente.';
}

function mapAvailabilityLabel(slotId) {
  if (slotId === 'manana') return 'Mañanas';
  if (slotId === 'tarde') return 'Tardes';
  return 'Noches y fines de semana';
}

/* ==========================================================================
   ILUSTRACIÓN SVG DE MINI-CANCHA POR TARJETA
   ========================================================================== */
function FlashCardCourtIllustration({ scene = 'net', selectedLevel = 0 }) {
  const accent = selectedLevel >= 3 ? '#00DC7D' : selectedLevel === 2 ? '#38BDF8' : '#F59E0B';

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
            <rect x="78" y="24" width="124" height="48" rx="12" fill="rgba(0,220,125,0.15)" stroke="#00DC7D" strokeWidth="1.6" />
            <text x="140" y="46" textAnchor="middle" fill="#FAF9F5" fontSize="13" fontWeight="900" fontFamily="sans-serif">
              15 · 30 · 40 · GAME
            </text>
            <text x="140" y="63" textAnchor="middle" fill="#00DC7D" fontSize="10" fontWeight="800" fontFamily="sans-serif">
              LA APP CUENTA CONTIGO
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: AuthAndOnboardingModal (CONECTADO A SUPABASE AUTH)
   ========================================================================== */
export default function AuthAndOnboardingModal({
  isOpen = false,
  initialMode = 'login',
  onClose,
  players = [],
  clubs = INITIAL_CLUBS,
  onLoginSuccess,
  onRegisterComplete,
  onPartnerLoginSuccess,
  onOpenLegalModal,
  onNotify,
}) {
  const [accountKind, setAccountKind] = useState('player'); // 'player' | 'partner'
  const [viewMode, setViewMode] = useState(initialMode); // 'login' | 'register' | 'forgot' | 'flashcards' | 'result' | 'verifyEmail'
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState('');

  // Login Tenista
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Registro Tenista
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regWhatsappConfirmed, setRegWhatsappConfirmed] = useState(false);
  const [regAge, setRegAge] = useState('');
  const [regDivision, setRegDivision] = useState('Varones');
  const [regClubId, setRegClubId] = useState('independiente');
  const [regHand, setRegHand] = useState('Diestro');
  const [regAvailability, setRegAvailability] = useState('noche');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  // OBLIGATORIO INDECOPI / LEY N° 29733: Siempre arranca desmarcado
  const [regLegalAccepted, setRegLegalAccepted] = useState(false);

  // Captcha matemático
  const [captcha, setCaptcha] = useState(() => generateMathCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');

  // Recuperación por correo (Supabase Auth + Brevo SMTP)
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Portal Aliados (Coaches & Clubes)
  const [partnerPin, setPartnerPin] = useState('');

  // Tarjetas rápidas
  const [fcIndex, setFcIndex] = useState(0);
  const [fcAnswers, setFcAnswers] = useState({});
  const [showCalibTooltip, setShowCalibTooltip] = useState(false);
  const [pendingRegisteredData, setPendingRegisteredData] = useState(null);
  const [verifyTargetEmail, setVerifyTargetEmail] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initialMode === 'partner') {
      setAccountKind('partner');
      setViewMode('login');
    } else {
      setAccountKind('player');
      setViewMode(initialMode || 'login');
    }
    setInlineError('');
    setIsSubmitting(false);
    setRegLegalAccepted(false);
    setRegWhatsappConfirmed(false);
    setCaptcha(generateMathCaptcha());
    setCaptchaInput('');
    setForgotSent(false);
    setFcIndex(0);
    setFcAnswers({});
    setIsRedirecting(false);
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, isSubmitting]);

  /* Validación en vivo del registro (indica exactamente qué falta) */
  const regValidation = useMemo(() => {
    const cleanPhone = regWhatsapp.replace(/\D/g, '');
    const numericAge = Number(regAge);
    const captchaOk = Number(captchaInput.trim()) === captcha.answer;

    if (regFirstName.trim().length < 2 || regLastName.trim().length < 2) {
      return { valid: false, message: 'Escribe tu nombre y apellido' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      return { valid: false, message: 'Ingresa un correo electrónico válido' };
    }
    if (cleanPhone.length < 9) {
      return { valid: false, message: 'Ingresa tu WhatsApp (9 dígitos)' };
    }
    if (!regWhatsappConfirmed) {
      return { valid: false, message: 'Confirma que tu celular de WhatsApp es correcto' };
    }
    if (!numericAge || numericAge < AUTH_ONBOARDING_EDITABLE_CONFIG.minAgeAllowed || numericAge > 90) {
      return { valid: false, message: 'Registro exclusivo para mayores de 18 años' };
    }
    if (regPassword.length < 6) {
      return { valid: false, message: 'Crea una contraseña (mín. 6 caracteres)' };
    }
    if (!captchaOk) {
      return { valid: false, message: `Resuelve la suma (${captcha.a} + ${captcha.b})` };
    }
    if (!regLegalAccepted) {
      return { valid: false, message: 'Marca los Términos y Privacidad para seguir' };
    }
    return { valid: true, message: 'Continuar a las 4 Tarjetas Rápidas →' };
  }, [
    regFirstName,
    regLastName,
    regEmail,
    regWhatsapp,
    regWhatsappConfirmed,
    regAge,
    regPassword,
    captchaInput,
    captcha,
    regLegalAccepted,
  ]);

  const demoPlayersForQuickLogin = useMemo(
    () => (players || []).filter((p) => p.isDemo).slice(0, 4),
    [players]
  );

  const triggerSmoothSuccess = (callback) => {
    setIsRedirecting(true);
    window.setTimeout(() => {
      setIsRedirecting(false);
      if (callback) callback();
      if (onClose) onClose();
    }, 450);
  };

  /* ------------------------------------------------------------------------
     1. INICIO DE SESIÓN REAL CON SUPABASE AUTH
     ------------------------------------------------------------------------ */
  const handlePlayerLoginSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setInlineError('');

    const rawId = loginIdentifier.trim();
    if (!rawId || loginPassword.length < 6) {
      triggerHaptic('warning');
      setInlineError('Ingresa tu correo (o celular) y tu contraseña de al menos 6 caracteres.');
      return;
    }

    // Permitir ingresar correo directo o buscar el correo asociado a un celular registrado
    let targetEmail = rawId.toLowerCase();
    if (!targetEmail.includes('@')) {
      const digits = rawId.replace(/\D/g, '');
      const matchedByPhone = (players || []).find((p) => {
        const pDigits = String(p.whatsapp || '').replace(/\D/g, '');
        return digits.length >= 9 && pDigits && pDigits.endsWith(digits.slice(-9));
      });
      if (!matchedByPhone?.email) {
        triggerHaptic('warning');
        setInlineError('No encontramos una cuenta con ese celular. Prueba ingresando tu correo electrónico.');
        return;
      }
      targetEmail = matchedByPhone.email.toLowerCase();
    }

    setIsSubmitting(true);
    try {
      if (!isCloudReady) {
        throw new Error('Conexión con la base de datos no disponible.');
      }

      const authRes = await signInCloudAccount({
        email: targetEmail,
        password: loginPassword,
      });

      const authUser = authRes?.user;
      const authId = authUser?.id || null;

      let matchedPlayer =
        (players || []).find((p) => authId && p.authId === authId) ||
        (players || []).find((p) => String(p.email || '').toLowerCase() === targetEmail) ||
        null;

      // Si el perfil aún no existía en la tabla profiles (ej. cuenta creada en Auth), se crea limpio
      if (!matchedPlayer && authUser) {
        const meta = authUser.user_metadata || {};
        const fallbackProfile = {
          id: authId || `player-${Date.now()}`,
          authId,
          name: meta.name || targetEmail.split('@')[0],
          email: targetEmail,
          whatsapp: normalizePeruPhone(meta.whatsapp || ''),
          showWhatsapp: true,
          age: Number(meta.age) || 25,
          division: meta.division || 'Varones',
          clubId: meta.clubId || 'independiente',
          clubName: meta.clubName || 'Independiente',
          points: 1200,
          wins: 0,
          losses: 0,
          streak: 0,
          calibrationPlayed: 0,
          gems: AUTH_ONBOARDING_EDITABLE_CONFIG.welcomeGems,
          isVip: false,
          vipStatus: 'STANDARD',
          isAdmin: false,
          isDemo: false,
          hand: meta.hand || 'Diestro',
          backhand: '2 manos',
          weapon: 'Derecha',
          availability: 'Noches y fines de semana',
          unlockedScenarios: ['default'],
          unlockedBadges: [],
          credentialId: `TT-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 8999))}`,
        };
        matchedPlayer = (await upsertCloudPlayer(fallbackProfile)) || fallbackProfile;
      } else if (matchedPlayer && authId && !matchedPlayer.authId) {
        matchedPlayer = { ...matchedPlayer, authId };
        upsertCloudPlayer(matchedPlayer).catch(() => {});
      }

      triggerHaptic('success');
      triggerSmoothSuccess(() => {
        if (onLoginSuccess && matchedPlayer) onLoginSuccess(matchedPlayer);
        if (onNotify) {
          onNotify(`¡Bienvenido de vuelta, ${(matchedPlayer?.name || 'Tenista').split(' ')[0]}!`, 'success');
        }
      });
    } catch (err) {
      triggerHaptic('warning');
      const friendly = translateAuthError(err);
      setInlineError(friendly);
      if (onNotify) onNotify(friendly, 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------------
     2. PORTAL ALIADOS (COACHES & CLUBES)
     ------------------------------------------------------------------------ */
  const handlePartnerLoginSubmit = (e) => {
    e.preventDefault();
    const cleanPin = partnerPin.trim();
    const partner = AUTH_ONBOARDING_EDITABLE_CONFIG.partnerPins[cleanPin];

    if (!partner) {
      triggerHaptic('warning');
      setInlineError('PIN de Aliado no reconocido. Solicita tu acceso al Comité TOTAL TENIS.');
      return;
    }

    setInlineError('');
    triggerHaptic('success');
    triggerSmoothSuccess(() => {
      if (onPartnerLoginSuccess) onPartnerLoginSuccess(partner);
      if (onNotify) onNotify(`Bienvenido a tu Estudio Aliado, ${partner.name}.`, 'success');
    });
  };

  /* ------------------------------------------------------------------------
     3. REGISTRO PASO 1 -> TARJETAS RÁPIDAS -> SUPABASE AUTH + PROFILES
     ------------------------------------------------------------------------ */
  const handleStartCalibrationQuiz = (e) => {
    e.preventDefault();
    setInlineError('');

    if (!regValidation.valid) {
      triggerHaptic('warning');
      setInlineError(regValidation.message);
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();
    const exists = (players || []).some(
      (p) => !p.isDemo && String(p.email || '').toLowerCase() === cleanEmail
    );
    if (exists) {
      triggerHaptic('warning');
      setInlineError('Ese correo ya tiene una cuenta registrada. Inicia sesión o recupera tu clave.');
      return;
    }

    const chosenClub = (clubs || []).find((c) => c.id === regClubId);
    setPendingRegisteredData({
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      name: `${regFirstName.trim()} ${regLastName.trim()}`,
      email: cleanEmail,
      whatsapp: normalizePeruPhone(regWhatsapp),
      age: Number(regAge),
      division: regDivision,
      clubId: chosenClub ? chosenClub.id : 'independiente',
      clubName: chosenClub ? chosenClub.name : 'Independiente',
      hand: regHand,
      availabilitySlot: regAvailability,
      availabilityLabel: mapAvailabilityLabel(regAvailability),
      availabilityDays: ['M', 'J', 'S'],
      password: regPassword,
    });

    triggerHaptic('medium');
    setFcIndex(0);
    setFcAnswers({});
    setViewMode('flashcards');
  };

  const handlePickFlashCardOption = (card, option) => {
    triggerHaptic('light');
    const updated = { ...fcAnswers, [card.id]: option };
    setFcAnswers(updated);

    window.setTimeout(() => {
      if (fcIndex < CALIBRATION_FLASHCARDS.length - 1) {
        setFcIndex((prev) => prev + 1);
      } else {
        setViewMode('result');
      }
    }, 320);
  };

  const handleSkipZeroLevelExpress = () => {
    triggerHaptic('medium');
    const zeroAnswers = {};
    CALIBRATION_FLASHCARDS.forEach((c) => {
      zeroAnswers[c.id] = c.options[0];
    });
    setFcAnswers(zeroAnswers);
    setViewMode('result');
  };

  const calibrationResult = useMemo(() => {
    const seed = computeCalibrationSeed(fcAnswers);
    const cat = getCategoryByPoints(seed.points);
    return { ...seed, category: cat };
  }, [fcAnswers]);

  const handleFinalizeRegistration = async () => {
    if (isSubmitting || !pendingRegisteredData) return;
    setInlineError('');
    setIsSubmitting(true);

    const base = pendingRegisteredData;
    try {
      const signUpRes = await signUpCloudAccount({
        email: base.email,
        password: base.password,
        metadata: {
          name: base.name,
          whatsapp: base.whatsapp,
          age: base.age,
          division: base.division,
          clubId: base.clubId,
          clubName: base.clubName,
          hand: base.hand,
        },
      });

      const authUser = signUpRes?.user;
      const hasImmediateSession = Boolean(signUpRes?.session);
      const authId = authUser?.id || null;

      const newPlayer = {
        id: authId || `player-${Date.now()}`,
        authId,
        credentialId: `TT-${new Date().getFullYear()}-${String(
          Math.floor(1000 + Math.random() * 8999)
        )}`,
        name: base.name,
        email: base.email,
        whatsapp: normalizePeruPhone(base.whatsapp),
        showWhatsapp: true,
        hideWhatsapp: false,
        age: base.age,
        division: base.division,
        clubId: base.clubId,
        clubName: base.clubName,
        hand: base.hand,
        backhand: '2 manos',
        weapon: 'Derecha',
        bestStroke: 'Derecha (Forehand)',
        bestStrokes: ['Derecha (Forehand)'],
        availability: base.availabilityLabel,
        availabilityDays: base.availabilityDays,
        availabilityTimes: [base.availabilitySlot],
        points: calibrationResult.points,
        wins: 0,
        losses: 0,
        streak: 0,
        calibrationPlayed: 0,
        rankTrend: 0,
        gems: AUTH_ONBOARDING_EDITABLE_CONFIG.welcomeGems,
        weeklyGemsEarned: 0,
        isVip: false,
        vipStatus: 'STANDARD',
        isAdmin: false,
        isPaused: false,
        isDemo: false,
        avatar: '',
        coverScenario: 'default',
        unlockedScenarios: ['default'],
        unlockedBadges: [],
        activeBadgeId: '',
        unlockedVideos: [],
      };

      // Si Confirm email está ACTIVO en Supabase (Brevo SMTP), guardamos el perfil y pedimos verificar correo
      if (!hasImmediateSession) {
        await upsertCloudPlayer(newPlayer).catch(() => {});
        setVerifyTargetEmail(base.email);
        setViewMode('verifyEmail');
        triggerHaptic('success');
        if (onNotify) {
          onNotify('Te enviamos un correo para confirmar tu cuenta.', 'success');
        }
        return;
      }

      // Si Confirm email está desactivado para pruebas, entramos directo a la app
      triggerHaptic('success');
      triggerSmoothSuccess(() => {
        if (onRegisterComplete) onRegisterComplete(newPlayer);
        if (onNotify) {
          onNotify(
            `¡Cuenta creada! Recibiste +${AUTH_ONBOARDING_EDITABLE_CONFIG.welcomeGems} Gemas de bienvenida.`,
            'success'
          );
        }
      });
    } catch (err) {
      triggerHaptic('warning');
      const friendly = translateAuthError(err);
      setInlineError(friendly);
      if (onNotify) onNotify(friendly, 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------------
     4. RECUPERACIÓN REAL DE CONTRASEÑA POR CORREO
     ------------------------------------------------------------------------ */
  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setInlineError('');

    const cleanMail = forgotEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanMail)) {
      triggerHaptic('warning');
      setInlineError('Escribe un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendCloudPasswordReset(cleanMail);
      setForgotSent(true);
      triggerHaptic('success');
      if (onNotify) {
        onNotify('Enlace enviado. Revisa tu bandeja de entrada o carpeta de spam.', 'success');
      }
    } catch (err) {
      triggerHaptic('warning');
      setInlineError(translateAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const currentFlashCard = CALIBRATION_FLASHCARDS[fcIndex] || CALIBRATION_FLASHCARDS[0];
  const currentCardSelection = fcAnswers[currentFlashCard.id] || null;
  const isRegisterOrQuiz =
    viewMode === 'register' ||
    viewMode === 'flashcards' ||
    viewMode === 'result' ||
    viewMode === 'verifyEmail';

  return createPortal(
    <div
      className="tt-auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Portal de Acceso TOTAL TENIS"
    >
      {isRedirecting ? (
        <div className="tt-auth-redirect">
          <div className="tt-auth-redirect-ring">
            <SmartImage
              src={ASSETS.logoOscuro || ASSETS.logo}
              alt="TOTAL TENIS"
              style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: '50%' }}
            />
          </div>
          <strong>Preparando tu cancha...</strong>
          <span>TOTAL TENIS · Circuito Oficial</span>
        </div>
      ) : (
        <div className="tt-auth-split-shell">
          {/* MITAD IZQUIERDA: FORMULARIO LIMPIO */}
          <div className="tt-auth-left-col">
            <div className="tt-auth-topbar">
              <button
                type="button"
                className="tt-auth-back-link"
                disabled={isSubmitting}
                onClick={() => {
                  triggerHaptic('light');
                  setInlineError('');
                  if (viewMode === 'forgot' || viewMode === 'verifyEmail') setViewMode('login');
                  else if (viewMode === 'flashcards' && fcIndex > 0) setFcIndex((i) => i - 1);
                  else if (viewMode === 'flashcards') setViewMode('register');
                  else if (viewMode === 'result') setViewMode('flashcards');
                  else if (onClose) onClose();
                }}
              >
                ‹ {viewMode === 'login' ? 'Volver al circuito' : 'Atrás'}
              </button>

              <div className="tt-auth-topbar-right">
                {accountKind === 'player' && viewMode === 'login' && (
                  <button
                    type="button"
                    className="tt-auth-switch-link"
                    onClick={() => {
                      triggerHaptic('light');
                      setInlineError('');
                      setViewMode('register');
                    }}
                  >
                    ¿Nuevo aquí? <strong>Regístrate</strong>
                  </button>
                )}

                {accountKind === 'player' && viewMode === 'register' && (
                  <button
                    type="button"
                    className="tt-auth-switch-link"
                    onClick={() => {
                      triggerHaptic('light');
                      setInlineError('');
                      setViewMode('login');
                    }}
                  >
                    ¿Ya tienes cuenta? <strong>Inicia sesión</strong>
                  </button>
                )}

                <button
                  type="button"
                  className="tt-auth-close-x"
                  aria-label="Cerrar ventana de acceso"
                  disabled={isSubmitting}
                  onClick={() => {
                    triggerHaptic('light');
                    if (onClose) onClose();
                  }}
                >
                  <TTIcon name="close" size={18} />
                </button>
              </div>
            </div>

            <div className="tt-auth-scroll-body">
              {(viewMode === 'login' || viewMode === 'register') && (
                <div className="tt-auth-brand-head">
                  <div className="tt-auth-logo-row">
                    <SmartImage
                      src={ASSETS.logoOscuro || ASSETS.logo}
                      alt="TOTAL TENIS"
                      style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span className="tt-auth-brand-word">TOTAL TENIS</span>
                  </div>

                  <div className="tt-auth-dual-pill" role="tablist" aria-label="Tipo de cuenta">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={accountKind === 'player'}
                      className={accountKind === 'player' ? 'is-active' : ''}
                      onClick={() => {
                        triggerHaptic('light');
                        setInlineError('');
                        setAccountKind('player');
                      }}
                    >
                      Soy Tenista
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={accountKind === 'partner'}
                      className={accountKind === 'partner' ? 'is-active' : ''}
                      onClick={() => {
                        triggerHaptic('light');
                        setInlineError('');
                        setAccountKind('partner');
                        setViewMode('login');
                      }}
                    >
                      Portal Aliados (Coaches)
                    </button>
                  </div>
                </div>
              )}

              {inlineError && (
                <div className="tt-auth-error-banner" role="alert">
                  {inlineError}
                </div>
              )}

              {/* VISTA A: PORTAL ALIADOS */}
              {accountKind === 'partner' && viewMode === 'login' && (
                <form onSubmit={handlePartnerLoginSubmit} className="tt-auth-form">
                  <h1 className="tt-auth-h1">Estudio Coach & Aliados</h1>
                  <p className="tt-auth-lead">
                    Ingresa con tu clave personal de Entrenador o Club para gestionar tus clases, horarios libres hoy y promociones.
                  </p>

                  <div className="tt-auth-field">
                    <label htmlFor="tt-partner-pin">Clave de Acceso Aliado (4 dígitos)</label>
                    <input
                      id="tt-partner-pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      className="tt-auth-input"
                      value={partnerPin}
                      onChange={(e) => setPartnerPin(e.target.value)}
                      placeholder="Ej. 7202"
                      required
                    />
                  </div>

                  <button type="submit" className="tt-auth-primary-pill is-purple">
                    Entrar a mi Estudio Aliado
                  </button>

                  <div className="tt-auth-partner-cta">
                    <span>¿Aún no afilias tu academia o club?</span>
                    <a
                      href={buildWhatsappLink(
                        APP_CONFIG.supportWhatsApp,
                        'Hola equipo TOTAL TENIS, quiero solicitar mi cuenta oficial en el Portal Aliados (Club / Coach).'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Solicitar alta por WhatsApp ↗
                    </a>
                  </div>
                </form>
              )}

              {/* VISTA B: LOGIN DE TENISTA (SIN BOTONES FALSOS DE REDES) */}
              {accountKind === 'player' && viewMode === 'login' && (
                <div className="tt-auth-form">
                  <h1 className="tt-auth-h1">Inicia sesión en TOTAL TENIS</h1>
                  <p className="tt-auth-lead">
                    Entra con tu correo para lanzar retos, confirmar marcadores en vivo y canjear tus Gemas.
                  </p>

                  <form onSubmit={handlePlayerLoginSubmit} className="tt-auth-inner-form">
                    <div className="tt-auth-field">
                      <label htmlFor="tt-login-id">Correo electrónico o Celular registrado</label>
                      <input
                        id="tt-login-id"
                        type="text"
                        className="tt-auth-input"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="nombre@correo.com"
                        autoComplete="username"
                        required
                      />
                    </div>

                    <div className="tt-auth-field">
                      <div className="tt-auth-label-row">
                        <label htmlFor="tt-login-pass">Contraseña</label>
                        <button
                          type="button"
                          className="tt-auth-forgot-btn"
                          onClick={() => {
                            triggerHaptic('light');
                            setInlineError('');
                            setForgotSent(false);
                            setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                            setViewMode('forgot');
                          }}
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                      <div className="tt-pass-wrap">
                        <input
                          id="tt-login-pass"
                          type={showLoginPass ? 'text' : 'password'}
                          className="tt-auth-input"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Tu contraseña"
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          className="tt-eye-btn"
                          aria-label={showLoginPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          onClick={() => setShowLoginPass((v) => !v)}
                        >
                          {showLoginPass ? 'Ocultar' : 'Ver'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="tt-auth-primary-pill is-emerald"
                    >
                      {isSubmitting ? 'Ingresando...' : 'Entrar al Circuito'}
                    </button>
                  </form>

                  <button
                    type="button"
                    className="tt-auth-secondary-outline"
                    onClick={() => {
                      triggerHaptic('light');
                      setInlineError('');
                      setViewMode('register');
                    }}
                  >
                    Crear cuenta gratis en 1 minuto
                  </button>

                  {AUTH_ONBOARDING_EDITABLE_CONFIG.enableDemoQuickLogin &&
                    demoPlayersForQuickLogin.length > 0 && (
                      <div className="tt-demo-quick-box">
                        <span>CUENTAS DE PRUEBA (MODO BETA)</span>
                        <div className="tt-demo-chips">
                          {demoPlayersForQuickLogin.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="tt-demo-chip"
                              onClick={() => {
                                triggerHaptic('light');
                                triggerSmoothSuccess(() => onLoginSuccess && onLoginSuccess(p));
                              }}
                            >
                              {p.name.split(' ')[0]} ({getCategoryByPoints(p.points).name})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* VISTA C: REGISTRO GRATIS CON CONFIRMACIÓN DE CELULAR Y CHECKBOX LEGAL */}
              {accountKind === 'player' && viewMode === 'register' && (
                <form onSubmit={handleStartCalibrationQuiz} className="tt-auth-form">
                  <h1 className="tt-auth-h1">Crea tu cuenta gratis</h1>
                  <p className="tt-auth-lead">
                    Solo te toma 1 minuto. Luego responderás 4 tarjetas rápidas para juntarte con rivales de tu mismo ritmo.
                  </p>

                  <div className="tt-auth-grid-2">
                    <div className="tt-auth-field">
                      <label htmlFor="tt-reg-fn">Nombre</label>
                      <input
                        id="tt-reg-fn"
                        type="text"
                        className="tt-auth-input"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        placeholder="Ej. Andrés"
                        required
                      />
                    </div>
                    <div className="tt-auth-field">
                      <label htmlFor="tt-reg-ln">Apellido</label>
                      <input
                        id="tt-reg-ln"
                        type="text"
                        className="tt-auth-input"
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        placeholder="Ej. Quispe"
                        required
                      />
                    </div>
                  </div>

                  <div className="tt-auth-grid-2">
                    <div className="tt-auth-field">
                      <label htmlFor="tt-reg-mail">Correo electrónico</label>
                      <input
                        id="tt-reg-mail"
                        type="email"
                        className="tt-auth-input"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        required
                      />
                    </div>
                    <div className="tt-auth-field">
                      <label htmlFor="tt-reg-wa">WhatsApp Perú (9 dígitos)</label>
                      <input
                        id="tt-reg-wa"
                        type="tel"
                        inputMode="numeric"
                        maxLength={12}
                        className="tt-auth-input"
                        value={regWhatsapp}
                        onChange={(e) => setRegWhatsapp(e.target.value)}
                        placeholder="964 123 456"
                        required
                      />
                    </div>
                  </div>

                  {/* Casilla de confirmación de celular correcto (Punto 7) */}
                  <label className="tt-phone-confirm-check">
                    <input
                      type="checkbox"
                      checked={regWhatsappConfirmed}
                      onChange={(e) => {
                        triggerHaptic('light');
                        setRegWhatsappConfirmed(e.target.checked);
                      }}
                    />
                    <span>
                      Confirmo que{' '}
                      <strong>
                        {regWhatsapp.replace(/\D/g, '').length >= 9
                          ? normalizePeruPhone(regWhatsapp)
                          : 'este número'}
                      </strong>{' '}
                      es mi WhatsApp correcto para coordinar cancha y horarios con mis rivales.
                    </span>
                  </label>

                  <div className="tt-auth-grid-2">
                    <div className="tt-auth-field">
                      <label htmlFor="tt-reg-age">
                        Edad (+18) {Number(regAge) >= 40 ? '· Apto +40 Senior' : ''}
                      </label>
                      <input
                        id="tt-reg-age"
                        type="number"
                        min={18}
                        max={90}
                        className="tt-auth-input"
                        value={regAge}
                        onChange={(e) => setRegAge(e.target.value)}
                        placeholder="Ej. 28"
                        required
                      />
                    </div>
                    <div className="tt-auth-field">
                      <label>Rama</label>
                      <div className="tt-auth-mini-pair">
                        {['Varones', 'Damas'].map((div) => (
                          <button
                            key={div}
                            type="button"
                            className={`tt-mini-choice ${regDivision === div ? 'is-on' : ''}`}
                            onClick={() => {
                              triggerHaptic('light');
                              setRegDivision(div);
                            }}
                          >
                            {div}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="tt-auth-grid-2">
                    <div className="tt-auth-field">
                      <label htmlFor="tt-reg-club">Club o Sede Habitual</label>
                      <select
                        id="tt-reg-club"
                        className="tt-auth-input"
                        value={regClubId}
                        onChange={(e) => setRegClubId(e.target.value)}
                      >
                        <option value="independiente">Jugador Independiente</option>
                        {(clubs || []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.shortName || c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="tt-auth-field">
                      <label>Mano Hábil</label>
                      <div className="tt-auth-mini-pair">
                        {['Diestro', 'Zurdo'].map((h) => (
                          <button
                            key={h}
                            type="button"
                            className={`tt-mini-choice ${regHand === h ? 'is-on' : ''}`}
                            onClick={() => {
                              triggerHaptic('light');
                              setRegHand(h);
                            }}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="tt-auth-field">
                    <label>¿En qué horario sueles jugar?</label>
                    <div className="tt-auth-tri-pills">
                      {[
                        { id: 'manana', label: 'Mañanas' },
                        { id: 'tarde', label: 'Tardes' },
                        { id: 'noche', label: 'Noches / Fin sem.' },
                      ].map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          className={`tt-mini-choice ${regAvailability === slot.id ? 'is-on' : ''}`}
                          onClick={() => {
                            triggerHaptic('light');
                            setRegAvailability(slot.id);
                          }}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="tt-auth-field">
                    <label htmlFor="tt-reg-pass">Crea tu contraseña (mín. 6 caracteres)</label>
                    <div className="tt-pass-wrap">
                      <input
                        id="tt-reg-pass"
                        type={showRegPass ? 'text' : 'password'}
                        className="tt-auth-input"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                      />
                      <button
                        type="button"
                        className="tt-eye-btn"
                        onClick={() => setShowRegPass((v) => !v)}
                      >
                        {showRegPass ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                  </div>

                  <div className="tt-captcha-box">
                    <div className="tt-captcha-left">
                      <span className="tt-captcha-kicker">VERIFICACIÓN RÁPIDA</span>
                      <strong>
                        ¿Cuánto es {captcha.a} + {captcha.b}?
                      </strong>
                    </div>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="tt-captcha-input"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="?"
                      aria-label={`Resultado de ${captcha.a} más ${captcha.b}`}
                    />
                    <button
                      type="button"
                      className="tt-captcha-refresh"
                      aria-label="Generar nueva suma"
                      onClick={() => {
                        triggerHaptic('light');
                        setCaptcha(generateMathCaptcha());
                        setCaptchaInput('');
                      }}
                    >
                      ↻
                    </button>
                  </div>

                  {/* Checkbox Legal OBLIGATORIAMENTE DESMARCADO (Indecopi / Ley N° 29733) */}
                  <label className="tt-legal-check">
                    <input
                      type="checkbox"
                      checked={regLegalAccepted}
                      onChange={(e) => {
                        triggerHaptic('light');
                        setRegLegalAccepted(e.target.checked);
                      }}
                    />
                    <span>
                      Declaro ser mayor de 18 años y acepto los{' '}
                      <button
                        type="button"
                        className="tt-legal-inline-link"
                        onClick={() => onOpenLegalModal && onOpenLegalModal('terms')}
                      >
                        Términos y Condiciones
                      </button>{' '}
                      y la{' '}
                      <button
                        type="button"
                        className="tt-legal-inline-link"
                        onClick={() => onOpenLegalModal && onOpenLegalModal('privacy')}
                      >
                        Política de Privacidad (Ley N° 29733)
                      </button>
                      .
                    </span>
                  </label>

                  <button
                    type="submit"
                    className={`tt-auth-primary-pill ${
                      regValidation.valid ? 'is-purple' : 'is-disabled-hint'
                    }`}
                  >
                    {regValidation.message}
                  </button>
                </form>
              )}

              {/* VISTA D: RECUPERACIÓN DE CONTRASEÑA POR CORREO REAL */}
              {viewMode === 'forgot' && (
                <div className="tt-auth-form">
                  <span className="tt-fc-kicker-light">RECUPERACIÓN SEGURA</span>
                  <h1 className="tt-auth-h1">¿Olvidaste tu contraseña?</h1>

                  {!forgotSent ? (
                    <>
                      <p className="tt-auth-lead">
                        Escribe el correo con el que te registraste y te enviaremos un enlace para crear una nueva contraseña.
                      </p>

                      <form onSubmit={handleSendResetEmail} className="tt-auth-inner-form">
                        <div className="tt-auth-field">
                          <label htmlFor="tt-fg-mail">Correo registrado</label>
                          <input
                            id="tt-fg-mail"
                            type="email"
                            className="tt-auth-input"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="tu@correo.com"
                            required
                          />
                        </div>

                        <div className="tt-fg-actions">
                          <button
                            type="button"
                            className="tt-fg-back"
                            onClick={() => {
                              setInlineError('');
                              setViewMode('login');
                            }}
                          >
                            « Volver al inicio
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="tt-auth-primary-pill is-purple is-compact"
                          >
                            {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="tt-auth-success-box">
                      <strong>¡Enlace enviado a {forgotEmail}!</strong>
                      <p>
                        Abre el correo de TOTAL TENIS (revisa también tu carpeta de spam o promociones) y toca el enlace para elegir tu nueva clave.
                      </p>
                      <button
                        type="button"
                        className="tt-auth-primary-pill is-emerald"
                        onClick={() => {
                          setForgotSent(false);
                          setViewMode('login');
                        }}
                      >
                        Volver a Iniciar Sesión
                      </button>
                    </div>
                  )}

                  <div className="tt-auth-partner-cta">
                    <span>¿No recuerdas con qué correo te registraste?</span>
                    <a
                      href={buildWhatsappLink(
                        APP_CONFIG.supportWhatsApp,
                        'Hola Comité TOTAL TENIS, necesito ayuda para recuperar el acceso a mi cuenta.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Pedir ayuda por WhatsApp ↗
                    </a>
                  </div>
                </div>
              )}

              {/* VISTA E: LAS 4 TARJETAS RÁPIDAS */}
              {viewMode === 'flashcards' && (
                <div className="tt-fc-wrap">
                  <div className="tt-fc-progress-head">
                    <div className="tt-fc-steps-bar">
                      {CALIBRATION_FLASHCARDS.map((c, idx) => (
                        <span
                          key={c.id}
                          className={`tt-fc-bar-seg ${
                            idx < fcIndex ? 'is-done' : idx === fcIndex ? 'is-now' : ''
                          }`}
                        />
                      ))}
                    </div>

                    <div className="tt-fc-meta-row">
                      <span>{currentFlashCard.stepLabel}</span>
                      <button
                        type="button"
                        className="tt-fc-tip-btn"
                        onClick={() => {
                          triggerHaptic('light');
                          setShowCalibTooltip((v) => !v);
                        }}
                      >
                        ¿Para qué sirve esto?
                      </button>
                    </div>
                  </div>

                  {showCalibTooltip && (
                    <div className="tt-fc-tooltip-card">
                      <strong>Tus primeros 5 partidos son de prueba (0/5)</strong>
                      <p>
                        Estas 4 tarjetas rápidas solo sirven para sugerirte rivales de tu mismo ritmo desde el primer día. Después, tus primeros 5 partidos en cancha fijarán tu categoría real.
                      </p>
                    </div>
                  )}

                  <div key={currentFlashCard.id} className="tt-fc-card-anim">
                    <FlashCardCourtIllustration
                      scene={currentFlashCard.scene}
                      selectedLevel={currentCardSelection?.level || 0}
                    />

                    <span className="tt-fc-kicker">{currentFlashCard.kicker}</span>
                    <h2 className="tt-fc-question">{currentFlashCard.question}</h2>
                    <p className="tt-fc-helper">{currentFlashCard.helper}</p>

                    <div className="tt-fc-options-stack">
                      {currentFlashCard.options.map((opt) => {
                        const isPicked = currentCardSelection?.level === opt.level;
                        return (
                          <button
                            key={opt.level}
                            type="button"
                            className={`tt-fc-option ${isPicked ? 'is-picked' : ''} ${
                              opt.level === 1 ? 'is-zero' : ''
                            }`}
                            onClick={() => handlePickFlashCardOption(currentFlashCard, opt)}
                          >
                            <div className="tt-fc-scale-col" aria-hidden="true">
                              <span className="tt-fc-lvl-num">{opt.level}</span>
                              <div className="tt-fc-dots-4">
                                {[1, 2, 3, 4].map((n) => (
                                  <span key={n} className={n <= opt.level ? 'is-lit' : ''} />
                                ))}
                              </div>
                            </div>

                            <div className="tt-fc-opt-text">
                              <span className="tt-fc-opt-badge">{opt.badge}</span>
                              <strong>{opt.title}</strong>
                              <small>{opt.desc}</small>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {currentCardSelection && (
                      <div className="tt-fc-reassurance">
                        <TTIcon name="check" size={16} style={{ color: '#008A4E', flexShrink: 0 }} />
                        <span>{currentCardSelection.reassurance}</span>
                      </div>
                    )}

                    {fcIndex === 0 && (
                      <button
                        type="button"
                        className="tt-fc-zero-express"
                        onClick={handleSkipZeroLevelExpress}
                      >
                        No sé nada de tenis todavía · Empezar directo en Nivel Cero →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* VISTA F: DIAGNÓSTICO FINAL + CREACIÓN REAL EN SUPABASE */}
              {viewMode === 'result' && (
                <div className="tt-fc-result-card">
                  <div className="tt-fcr-trophy-wrap">
                    <SmartImage
                      src="/assets/pelota-3d-volt-azul.png"
                      fallbackSrc={ASSETS.logo}
                      alt="Listo para jugar"
                      style={{ width: 72, height: 72, objectFit: 'contain' }}
                    />
                  </div>

                  <span className="tt-fcr-kicker">
                    PERFIL INICIAL LISTO · PARTIDOS DE PRUEBA 0/{ELO_CONFIG.CALIBRATION_MATCHES}
                  </span>
                  <h2 className="tt-fcr-title">{calibrationResult.headline}</h2>
                  <p className="tt-fcr-summary">{calibrationResult.summary}</p>

                  <div className="tt-fcr-metrics">
                    <div>
                      <span>PUNTAJE INICIAL</span>
                      <strong>{calibrationResult.points.toLocaleString('es-PE')} pts</strong>
                    </div>
                    <div>
                      <span>PARTIDOS DE PRUEBA</span>
                      <strong>0 / {ELO_CONFIG.CALIBRATION_MATCHES}</strong>
                    </div>
                    <div className="is-gems">
                      <span>BIENVENIDA</span>
                      <strong>+{AUTH_ONBOARDING_EDITABLE_CONFIG.welcomeGems} 💎</strong>
                    </div>
                  </div>

                  <div className="tt-fcr-callout">
                    <TTIcon name="shield" size={18} style={{ color: '#00DC7D', flexShrink: 0 }} />
                    <span>
                      <strong>Aquí cada game cuenta:</strong> en tus primeros 5 partidos pelear cada game te ubica exacto en tu categoría real.
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="tt-auth-primary-pill is-emerald"
                    onClick={handleFinalizeRegistration}
                  >
                    {isSubmitting ? 'Creando tu cuenta...' : '¡Crear mi cuenta y entrar!'}
                  </button>
                </div>
              )}

              {/* VISTA G: CONFIRMACIÓN POR CORREO (CUANDO BREVO SMTP ESTÉ ACTIVO) */}
              {viewMode === 'verifyEmail' && (
                <div className="tt-fc-result-card">
                  <div className="tt-fcr-trophy-wrap">
                    <TTIcon name="check" size={40} style={{ color: '#00DC7D' }} />
                  </div>
                  <span className="tt-fcr-kicker">UN SOLO PASO MÁS</span>
                  <h2 className="tt-fcr-title">Confirma tu correo electrónico</h2>
                  <p className="tt-fcr-summary">
                    Enviamos un enlace de activación a <strong>{verifyTargetEmail}</strong>. Ábrelo desde tu celular (revisa también spam) y luego inicia sesión normalmente.
                  </p>
                  <button
                    type="button"
                    className="tt-auth-primary-pill is-emerald"
                    onClick={() => {
                      setLoginIdentifier(verifyTargetEmail);
                      setLoginPassword('');
                      setViewMode('login');
                    }}
                  >
                    Ya confirmé mi correo · Iniciar Sesión
                  </button>
                </div>
              )}
            </div>

            <footer className="tt-auth-emerald-foot">
              <div className="tt-aef-links">
                <button
                  type="button"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('terms')}
                >
                  Términos
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('privacy')}
                >
                  Privacidad
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('reclamaciones')}
                >
                  Libro de Reclamaciones
                </button>
              </div>
              <small>© {new Date().getFullYear()} TOTAL TENIS</small>
            </footer>
          </div>

          {/* MITAD DERECHA: PÓSTER HERO SPLIT-SCREEN */}
          <aside
            className={`tt-auth-right-poster ${isRegisterOrQuiz ? 'is-purple-mode' : 'is-emerald-mode'}`}
            aria-hidden="true"
          >
            <SmartImage
              src={
                isRegisterOrQuiz
                  ? AUTH_ONBOARDING_EDITABLE_CONFIG.posters.register
                  : AUTH_ONBOARDING_EDITABLE_CONFIG.posters.login
              }
              fallbackSrc={ASSETS.bienvenidaOscuro}
              alt=""
              className="tt-auth-poster-bg"
            />
            <div className="tt-auth-poster-scrim" />

            <div className="tt-auth-poster-content">
              <div className="tt-auth-poster-top">
                <SmartImage
                  src={ASSETS.logoBlanco || ASSETS.logo}
                  alt="TOTAL TENIS"
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                />
                <span>TOTAL TENIS · CIRCUITO OFICIAL</span>
              </div>

              <div className="tt-auth-poster-bottom">
                <h2>
                  {isRegisterOrQuiz
                    ? 'CREA TU CUENTA GRATIS Y DESBLOQUEA TU CANCHA'
                    : 'ENTRA A CANCHA Y COMPITE EN VIVO'}
                </h2>
                <div className="tt-auth-poster-line" />
                <div className="tt-auth-poster-perks">
                  <span>RANKING OFICIAL EN VIVO</span>
                  <span>·</span>
                  <span>PREMIOS Y GEMAS 💎</span>
                  <span>·</span>
                  <span>TORNEOS Y SEDES</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <style>{`
        .tt-auth-overlay {
          position: fixed;
          inset: 0;
          z-index: 120;
          background: #FAF9F5;
          color: #1E0734;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .tt-auth-redirect {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #FAF9F5;
          color: #1E0734;
        }
        .tt-auth-redirect-ring {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          border: 4px solid rgba(30, 7, 52, 0.1);
          border-top-color: #00DC7D;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ttAuthSpin 0.9s linear infinite;
        }
        .tt-auth-redirect-ring > * {
          animation: ttAuthSpinRev 0.9s linear infinite;
        }
        @keyframes ttAuthSpin { to { transform: rotate(360deg); } }
        @keyframes ttAuthSpinRev { to { transform: rotate(-360deg); } }

        .tt-auth-split-shell {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 1fr;
        }
        @media (min-width: 900px) {
          .tt-auth-split-shell { grid-template-columns: 1fr 1fr; }
        }
        .tt-auth-left-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: #FFFFFF;
        }
        .tt-auth-topbar {
          padding: calc(env(safe-area-inset-top, 0px) + 14px) 16px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-bottom: 1px solid rgba(30, 7, 52, 0.08);
          background: #FFFFFF;
          flex-shrink: 0;
        }
        .tt-auth-back-link {
          font-size: 0.8rem;
          font-weight: 800;
          color: #1E0734;
          padding: 6px 4px;
        }
        .tt-auth-topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-auth-switch-link {
          font-size: 0.76rem;
          color: rgba(30, 7, 52, 0.72);
        }
        .tt-auth-switch-link strong {
          color: #008A4E;
          font-weight: 900;
        }
        .tt-auth-close-x {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(30, 7, 52, 0.08);
          color: #1E0734;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tt-auth-scroll-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 18px 18px 26px;
          max-width: 520px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-auth-brand-head {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-auth-logo-row {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .tt-auth-brand-word {
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 1.38rem;
          letter-spacing: 0.04em;
          color: #1E0734;
        }
        .tt-auth-dual-pill {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
          padding: 4px;
          border-radius: 14px;
          background: #F3F0F7;
        }
        .tt-auth-dual-pill button {
          min-height: 36px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.68);
        }
        .tt-auth-dual-pill button.is-active {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-auth-error-banner {
          padding: 11px 13px;
          border-radius: 13px;
          background: #FEF2F2;
          border: 1.5px solid #FCA5A5;
          color: #991B1B;
          font-size: 0.78rem;
          font-weight: 800;
          line-height: 1.38;
        }
        .tt-auth-success-box {
          padding: 15px;
          border-radius: 16px;
          background: #ECFDF5;
          border: 1.5px solid #6EE7B7;
          color: #065F46;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 0.8rem;
          line-height: 1.44;
        }
        .tt-auth-success-box p { margin: 0; }
        .tt-auth-form,
        .tt-auth-inner-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-auth-h1 {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.72rem;
          font-weight: 900;
          line-height: 1.04;
          color: #1E0734;
        }
        .tt-auth-lead {
          margin: -4px 0 2px;
          font-size: 0.82rem;
          line-height: 1.44;
          color: rgba(30, 7, 52, 0.72);
        }
        .tt-auth-grid-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 440px) {
          .tt-auth-grid-2 { grid-template-columns: 1fr 1fr; }
        }
        .tt-auth-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .tt-auth-field label {
          font-size: 0.74rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.82);
        }
        .tt-auth-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .tt-auth-forgot-btn {
          font-size: 0.72rem;
          font-weight: 800;
          color: #008A4E;
        }
        .tt-auth-input {
          width: 100%;
          min-height: 44px;
          padding: 0 13px;
          border-radius: 13px;
          background: #FAF9F5;
          border: 1.5px solid rgba(30, 7, 52, 0.16);
          color: #1E0734;
          font-size: 16px;
          font-weight: 600;
        }
        .tt-auth-input:focus {
          outline: none;
          border-color: #00B868;
          background: #FFFFFF;
        }
        .tt-pass-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .tt-pass-wrap .tt-auth-input { padding-right: 68px; }
        .tt-eye-btn {
          position: absolute;
          right: 10px;
          padding: 5px 8px;
          border-radius: 8px;
          background: rgba(30, 7, 52, 0.08);
          color: #1E0734;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .tt-auth-mini-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .tt-auth-tri-pills {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        .tt-mini-choice {
          min-height: 42px;
          padding: 0 8px;
          border-radius: 12px;
          background: #FAF9F5;
          border: 1.5px solid rgba(30, 7, 52, 0.14);
          color: rgba(30, 7, 52, 0.78);
          font-size: 0.74rem;
          font-weight: 800;
        }
        .tt-mini-choice.is-on {
          background: #1E0734;
          border-color: #1E0734;
          color: #00DC7D;
        }
        .tt-phone-confirm-check {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 10px 12px;
          border-radius: 13px;
          background: #F4FBF7;
          border: 1.5px solid rgba(0, 184, 104, 0.34);
          font-size: 0.74rem;
          line-height: 1.4;
          color: #1E0734;
          cursor: pointer;
        }
        .tt-phone-confirm-check input,
        .tt-legal-check input {
          width: 19px;
          height: 19px;
          margin-top: 2px;
          accent-color: #00B868;
          flex-shrink: 0;
        }
        .tt-captcha-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 15px;
          background: #F4FBF7;
          border: 1.5px solid rgba(0, 184, 104, 0.35);
        }
        .tt-captcha-left { flex: 1; }
        .tt-captcha-kicker {
          display: block;
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #008A4E;
        }
        .tt-captcha-left strong { font-size: 0.92rem; color: #1E0734; }
        .tt-captcha-input {
          width: 72px;
          height: 42px;
          border-radius: 11px;
          border: 1.5px solid #1E0734;
          background: #FFFFFF;
          text-align: center;
          font-size: 16px;
          font-weight: 900;
          color: #1E0734;
        }
        .tt-captcha-refresh {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(30, 7, 52, 0.1);
          color: #1E0734;
          font-size: 1.05rem;
          font-weight: 900;
        }
        .tt-legal-check {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 0.74rem;
          line-height: 1.42;
          color: rgba(30, 7, 52, 0.84);
          cursor: pointer;
        }
        .tt-legal-inline-link {
          color: #008A4E;
          font-weight: 800;
          text-decoration: underline;
          padding: 0;
        }
        .tt-auth-primary-pill {
          min-height: 48px;
          padding: 0 20px;
          border-radius: 999px;
          font-size: 0.86rem;
          font-weight: 900;
          letter-spacing: 0.02em;
          transition: transform 130ms ease, opacity 160ms ease;
        }
        .tt-auth-primary-pill:disabled { opacity: 0.65; }
        .tt-auth-primary-pill:active { transform: scale(0.97); }
        .tt-auth-primary-pill.is-emerald {
          background: linear-gradient(90deg, #00A859 0%, #00DC7D 100%);
          color: #120321;
          box-shadow: 0 10px 24px rgba(0, 184, 104, 0.32);
        }
        .tt-auth-primary-pill.is-purple {
          background: #1E0734;
          color: #00DC7D;
          box-shadow: 0 10px 24px rgba(30, 7, 52, 0.25);
        }
        .tt-auth-primary-pill.is-disabled-hint {
          background: rgba(30, 7, 52, 0.14);
          color: rgba(30, 7, 52, 0.76);
        }
        .tt-auth-primary-pill.is-compact {
          min-height: 42px;
          padding: 0 22px;
        }
        .tt-auth-secondary-outline {
          min-height: 44px;
          padding: 0 16px;
          border-radius: 999px;
          background: #FAF9F5;
          border: 1.5px solid #1E0734;
          color: #1E0734;
          font-size: 0.8rem;
          font-weight: 900;
        }
        .tt-fg-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 4px;
        }
        .tt-fg-back {
          font-size: 0.78rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.74);
        }
        .tt-auth-partner-cta {
          margin-top: 6px;
          padding: 12px;
          border-radius: 14px;
          background: #FAF9F5;
          border: 1px solid rgba(30, 7, 52, 0.1);
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 0.75rem;
          text-align: center;
        }
        .tt-auth-partner-cta a {
          color: #008A4E;
          font-weight: 900;
          text-decoration: none;
        }
        .tt-demo-quick-box {
          margin-top: 4px;
          padding: 11px;
          border-radius: 14px;
          background: #F6F4FA;
          border: 1px dashed rgba(30, 7, 52, 0.2);
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .tt-demo-quick-box span {
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: rgba(30, 7, 52, 0.62);
        }
        .tt-demo-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tt-demo-chip {
          padding: 5px 10px;
          border-radius: 999px;
          background: #FFFFFF;
          border: 1px solid rgba(30, 7, 52, 0.15);
          color: #1E0734;
          font-size: 0.7rem;
          font-weight: 800;
        }

        /* TARJETAS RÁPIDAS */
        .tt-fc-wrap { display: flex; flex-direction: column; gap: 12px; }
        .tt-fc-progress-head { display: flex; flex-direction: column; gap: 7px; }
        .tt-fc-steps-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .tt-fc-bar-seg {
          height: 7px;
          border-radius: 999px;
          background: rgba(30, 7, 52, 0.12);
          transition: background-color 240ms ease;
        }
        .tt-fc-bar-seg.is-done { background: #1E0734; }
        .tt-fc-bar-seg.is-now {
          background: #00DC7D;
          box-shadow: 0 0 10px rgba(0, 220, 125, 0.55);
        }
        .tt-fc-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: rgba(30, 7, 52, 0.58);
        }
        .tt-fc-tip-btn { color: #008A4E; font-weight: 800; text-decoration: underline; }
        .tt-fc-tooltip-card {
          padding: 12px;
          border-radius: 15px;
          background: #1E0734;
          color: #FAF9F5;
          font-size: 0.76rem;
        }
        .tt-fc-tooltip-card p { margin: 4px 0 0; opacity: 0.86; line-height: 1.42; }
        .tt-fc-card-anim {
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: ttFcSlideIn 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes ttFcSlideIn {
          from { opacity: 0; transform: translateX(18px) scale(0.985); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .tt-fc-svg-stage { width: 100%; border-radius: 18px; overflow: hidden; }
        .tt-fc-svg { width: 100%; height: auto; display: block; }
        .tt-fc-ball-pulse { animation: ttLivePulse 1.4s infinite; }
        .tt-fc-kicker,
        .tt-fc-kicker-light {
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #008A4E;
        }
        .tt-fc-question {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.48rem;
          font-weight: 900;
          line-height: 1.06;
          color: #1E0734;
        }
        .tt-fc-helper {
          margin: -3px 0 2px;
          font-size: 0.78rem;
          line-height: 1.4;
          color: rgba(30, 7, 52, 0.7);
        }
        .tt-fc-options-stack { display: flex; flex-direction: column; gap: 9px; }
        .tt-fc-option {
          width: 100%;
          padding: 12px;
          border-radius: 17px;
          background: #FAF9F5;
          border: 1.5px solid rgba(30, 7, 52, 0.12);
          color: #1E0734;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          transition: transform 140ms ease, border-color 180ms ease, background-color 180ms ease;
        }
        .tt-fc-option:active { transform: scale(0.975); }
        .tt-fc-option.is-zero {
          border-style: dashed;
          border-color: rgba(0, 184, 104, 0.48);
        }
        .tt-fc-option.is-picked {
          background: #1E0734;
          border-color: #00DC7D;
          border-style: solid;
          color: #FAF9F5;
          box-shadow: 0 10px 24px rgba(30, 7, 52, 0.24);
        }
        .tt-fc-scale-col {
          width: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .tt-fc-lvl-num {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(30, 7, 52, 0.08);
          font-family: var(--tt-font-display);
          font-size: 1rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-fc-option.is-picked .tt-fc-lvl-num { background: #00DC7D; color: #120321; }
        .tt-fc-dots-4 { display: flex; gap: 3px; }
        .tt-fc-dots-4 span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(30, 7, 52, 0.16);
        }
        .tt-fc-dots-4 span.is-lit { background: #00B868; }
        .tt-fc-option.is-picked .tt-fc-dots-4 span { background: rgba(250, 249, 245, 0.2); }
        .tt-fc-option.is-picked .tt-fc-dots-4 span.is-lit { background: #00DC7D; }
        .tt-fc-opt-text { flex: 1; min-width: 0; }
        .tt-fc-opt-badge {
          display: inline-block;
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #008A4E;
        }
        .tt-fc-option.is-picked .tt-fc-opt-badge { color: #7CF5C0; }
        .tt-fc-opt-text strong { display: block; font-size: 0.88rem; line-height: 1.2; }
        .tt-fc-opt-text small {
          display: block;
          margin-top: 2px;
          font-size: 0.72rem;
          line-height: 1.35;
          opacity: 0.76;
        }
        .tt-fc-reassurance {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 13px;
          background: #E9FBF2;
          color: #1E0734;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .tt-fc-zero-express {
          margin-top: 4px;
          padding: 10px;
          border-radius: 12px;
          background: transparent;
          color: #008A4E;
          font-size: 0.76rem;
          font-weight: 900;
          text-align: center;
          text-decoration: underline;
        }
        .tt-fc-result-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 11px;
          padding: 8px 0;
        }
        .tt-fcr-trophy-wrap {
          width: 96px;
          height: 96px;
          border-radius: 26px;
          background: linear-gradient(135deg, #1E0734 0%, #2D0B4F 100%);
          border: 2px solid #00DC7D;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 14px 30px rgba(0, 220, 125, 0.24);
        }
        .tt-fcr-kicker {
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #008A4E;
        }
        .tt-fcr-title {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.62rem;
          line-height: 1.04;
          color: #1E0734;
        }
        .tt-fcr-summary {
          margin: 0;
          font-size: 0.82rem;
          line-height: 1.45;
          color: rgba(30, 7, 52, 0.76);
        }
        .tt-fcr-metrics {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .tt-fcr-metrics > div {
          padding: 11px 6px;
          border-radius: 14px;
          background: #FAF9F5;
          border: 1px solid rgba(30, 7, 52, 0.12);
        }
        .tt-fcr-metrics span {
          display: block;
          font-size: 0.56rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          color: rgba(30, 7, 52, 0.58);
        }
        .tt-fcr-metrics strong {
          font-family: var(--tt-font-display);
          font-size: 1.18rem;
          color: #1E0734;
        }
        .tt-fcr-metrics .is-gems strong { color: #008A4E; }
        .tt-fcr-callout {
          width: 100%;
          padding: 12px;
          border-radius: 15px;
          background: #1E0734;
          color: #FAF9F5;
          text-align: left;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 0.76rem;
          line-height: 1.4;
        }
        .tt-auth-emerald-foot {
          padding: 11px 16px calc(env(safe-area-inset-bottom, 0px) + 11px);
          background: linear-gradient(90deg, #00A859 0%, #00DC7D 100%);
          color: #120321;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        .tt-aef-links {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .tt-aef-links button { color: #120321; font-weight: 800; }
        .tt-auth-emerald-foot small { font-size: 0.68rem; font-weight: 900; }

        .tt-auth-right-poster {
          display: none;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .tt-auth-right-poster { display: flex; flex-direction: column; }
        }
        .tt-auth-right-poster.is-emerald-mode {
          background: linear-gradient(135deg, #00A859 0%, #00DC7D 100%);
        }
        .tt-auth-right-poster.is-purple-mode {
          background: linear-gradient(135deg, #1E0734 0%, #2D0C4F 100%);
        }
        .tt-auth-poster-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.84;
        }
        .tt-auth-poster-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(20, 4, 36, 0.34) 0%,
            rgba(20, 4, 36, 0.16) 45%,
            rgba(16, 3, 29, 0.94) 100%
          );
        }
        .tt-auth-poster-content {
          position: relative;
          z-index: 2;
          flex: 1;
          padding: 36px;
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .tt-auth-poster-top {
          display: flex;
          align-items: center;
          gap: 11px;
          font-family: var(--tt-font-display);
          font-weight: 900;
          letter-spacing: 0.08em;
          font-size: 1.05rem;
        }
        .tt-auth-poster-bottom { display: flex; flex-direction: column; gap: 12px; }
        .tt-auth-poster-bottom h2 {
          margin: 0;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 2.7rem;
          line-height: 0.96;
          text-shadow: 0 4px 18px rgba(0, 0, 0, 0.55);
        }
        .tt-auth-poster-line {
          width: 140px;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(90deg, #00DC7D 0%, #F59E0B 100%);
        }
        .tt-auth-poster-perks {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #7CF5C0;
        }
      `}</style>
    </div>,
    document.body
  );
}
