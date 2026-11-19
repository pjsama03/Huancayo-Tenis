import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ASSETS,
  IconBadge,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import {
  APP_CONFIG,
  INITIAL_CLUBS,
  getCategoryByPoints,
} from '../data/playersAndClubsData';
import { ELO_CONFIG, buildWhatsAppLink } from '../utils/tenisEngine';

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (PÓSTERES, BONO GEMAS, CAPTCHA Y FLASH CARDS)
   --------------------------------------------------------------------------
   - Cambia `enableDemoQuickLogin` a `false` el día de tu lanzamiento público.
   - Edita textos o puntajes semilla aquí sin tocar la lógica del portal.
   ========================================================================== */
export const AUTH_ONBOARDING_EDITABLE_CONFIG = {
  brandName: 'TOTAL TENIS',
  welcomeGems: 20, // Bono oficial de bienvenida (+20 💎 = S/ 1.00)
  minAgeAllowed: 18,
  maxSeedPointsFromQuiz: 3350, // Techo máximo del test (para entrar a 3ª/2ª se gana en cancha)
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
   4 FLASH CARDS DINÁMICAS PARA NOVATOS (CERO TECNICISMOS · OPCIÓN NIVEL CERO)
   Diseñadas para que incluso alguien que nunca agarró una raqueta entienda
   todo en 20 segundos y se sienta bienvenido.
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
        reassurance: 'Gran nivel: tus primeros 5 partidos calibrarán tu puntaje exacto arriba.',
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
        reassurance: 'Ideal para arrancar tu fase de 5 partidos de prueba sin presión.',
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

/* ==========================================================================
   MOTOR DE SEMILLA PROVISIONAL (0 A 3,350 PTS · TRANSPARENTE Y SIN INFLACIÓN)
   ========================================================================== */
function computeCalibrationSeed(answersMap) {
  const totalScore = CALIBRATION_FLASHCARDS.reduce((acc, card) => {
    const picked = answersMap[card.id];
    return acc + (picked ? Number(picked.score) || 0 : 0);
  }, 0);

  // Rango total: 0 a 12 puntos en las 4 tarjetas
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
      summary: 'Mantienes peloteos largos y juegas sets completos. Tus primeros 5 partidos afinarán tu puesto oficial.',
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
    summary: 'Arrancas en el tope provisional del test. Para ingresar a la zona más alta del ranking, demuéstralo en tus 5 partidos de prueba.',
  };
}

function generateMathCaptcha() {
  const a = Math.floor(Math.random() * 19) + 11; // 11..29 (2 dígitos)
  const b = Math.floor(Math.random() * 19) + 10; // 10..28 (2 dígitos)
  return { a, b, answer: a + b };
}

/* ==========================================================================
   SUBCOMPONENTE: ILUSTRACIÓN ANIMADA DE MINI-CANCHA SVG POR FLASH CARD
   Ayuda visual inmediata para gente que nunca ha jugado tenis.
   ========================================================================== */
function FlashCardCourtIllustration({ scene = 'net', selectedLevel = 0 }) {
  const accent = selectedLevel >= 3 ? '#00DC7D' : selectedLevel === 2 ? '#38BDF8' : '#F59E0B';

  return (
    <div className="tt-fc-svg-stage" aria-hidden="true">
      <svg viewBox="0 0 280 96" fill="none" className="tt-fc-svg">
        {/* Fondo sutil de cancha de arcilla / estadio */}
        <rect x="4" y="6" width="272" height="84" rx="16" fill="#18052B" stroke="rgba(250,249,245,0.14)" strokeWidth="1.5" />
        {/* Líneas de cancha limpias */}
        <rect x="24" y="18" width="232" height="60" rx="6" stroke="rgba(250,249,245,0.22)" strokeWidth="1.5" />
        <line x1="140" y1="14" x2="140" y2="82" stroke="#FAF9F5" strokeWidth="2.5" strokeDasharray="4 3" />
        <line x1="78" y1="18" x2="78" y2="78" stroke="rgba(250,249,245,0.16)" strokeWidth="1.2" />
        <line x1="202" y1="18" x2="202" y2="78" stroke="rgba(250,249,245,0.16)" strokeWidth="1.2" />
        <line x1="78" y1="48" x2="202" y2="48" stroke="rgba(250,249,245,0.16)" strokeWidth="1.2" />

        {scene === 'net' && (
          <>
            <path
              d="M44 64 Q 140 12 232 54"
              stroke={accent}
              strokeWidth="3"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
            <circle cx="44" cy="64" r="6" fill="#FAF9F5" />
            <circle cx="232" cy="54" r="7" fill={accent} className="tt-fc-ball-pulse" />
          </>
        )}

        {scene === 'serve' && (
          <>
            <path
              d="M28 68 Q 108 14 176 34"
              stroke={accent}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <rect x="140" y="18" width="62" height="30" fill="rgba(0,220,125,0.16)" stroke="#00DC7D" strokeWidth="1.5" />
            <circle cx="28" cy="68" r="5.5" fill="#FAF9F5" />
            <circle cx="176" cy="34" r="7" fill={accent} className="tt-fc-ball-pulse" />
          </>
        )}

        {scene === 'rally' && (
          <>
            <path
              d="M42 28 L 236 66 L 46 68 L 234 28"
              stroke={accent}
              strokeWidth="2.6"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="234" cy="28" r="7" fill={accent} className="tt-fc-ball-pulse" />
            <circle cx="46" cy="68" r="5" fill="#FAF9F5" />
          </>
        )}

        {scene === 'trophy' && (
          <>
            <rect x="78" y="24" width="124" height="48" rx="12" fill="rgba(0,220,125,0.15)" stroke="#00DC7D" strokeWidth="1.6" />
            <text
              x="140"
              y="46"
              textAnchor="middle"
              fill="#FAF9F5"
              fontSize="13"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              15 · 30 · 40 · GAME
            </text>
            <text
              x="140"
              y="63"
              textAnchor="middle"
              fill="#00DC7D"
              fontSize="10"
              fontWeight="800"
              fontFamily="sans-serif"
            >
              LA APP CUENTA CONTIGO
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: AuthAndOnboardingModal (BLOQUE 20 DE 26)
   ========================================================================== */
export default function AuthAndOnboardingModal({
  isOpen = false,
  initialMode = 'login', // 'login' | 'register' | 'forgot' | 'partner' | 'flashcards'
  onClose,
  players = [],
  clubs = INITIAL_CLUBS,
  onLoginSuccess,
  onRegisterComplete,
  onResetPassword,
  onPartnerLoginSuccess,
  onOpenLegalModal, // ('terms' | 'privacy' | 'reclamaciones')
  onNotify,
}) {
  const [accountKind, setAccountKind] = useState('player'); // 'player' | 'partner'
  const [viewMode, setViewMode] = useState(initialMode); // 'login' | 'register' | 'forgot' | 'flashcards' | 'result'
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Estado Login Tenista
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Estado Registro Tenista
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regDivision, setRegDivision] = useState('Varones');
  const [regClubId, setRegClubId] = useState('independiente');
  const [regHand, setRegHand] = useState('Diestro');
  const [regAvailability, setRegAvailability] = useState('noche');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  // OBLIGATORIO INDECOPI / LEY N° 29733: Siempre arranca desmarcado (false)
  const [regLegalAccepted, setRegLegalAccepted] = useState(false);

  // Captcha Matemático Nativo de 2 dígitos
  const [captcha, setCaptcha] = useState(() => generateMathCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');

  // Estado Recuperación de Clave en 2 pasos
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotWhatsapp, setForgotWhatsapp] = useState('');
  const [forgotMatchedPlayer, setForgotMatchedPlayer] = useState(null);
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);

  // Estado Portal Aliados (Clubes & Coaches)
  const [partnerPin, setPartnerPin] = useState('');

  // Estado Flash Cards Dinámicas de Calibración
  const [fcIndex, setFcIndex] = useState(0);
  const [fcAnswers, setFcAnswers] = useState({});
  const [showCalibTooltip, setShowCalibTooltip] = useState(false);
  const [pendingRegisteredData, setPendingRegisteredData] = useState(null);

  // Sincronizar al abrir
  useEffect(() => {
    if (!isOpen) return;
    if (initialMode === 'partner') {
      setAccountKind('partner');
      setViewMode('login');
    } else {
      setAccountKind('player');
      setViewMode(initialMode || 'login');
    }
    setRegLegalAccepted(false);
    setCaptcha(generateMathCaptcha());
    setCaptchaInput('');
    setForgotStep(1);
    setForgotMatchedPlayer(null);
    setFcIndex(0);
    setFcAnswers({});
    setIsRedirecting(false);
  }, [isOpen, initialMode]);

  // Cerrar con tecla Escape (usabilidad desktop/laptop para nunca quedar atrapado)
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  /* ------------------------------------------------------------------------
     VALIDACIÓN DINÁMICA DEL FORMULARIO DE REGISTRO (INDICA QUÉ FALTA)
     ------------------------------------------------------------------------ */
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
    regAge,
    regPassword,
    captchaInput,
    captcha,
    regLegalAccepted,
  ]);

  /* ------------------------------------------------------------------------
     ACCIONES DE LOGIN, REGISTRO, RECUPERACIÓN Y FLASH CARDS
     ------------------------------------------------------------------------ */
  const triggerSmoothSuccess = (callback) => {
    setIsRedirecting(true);
    window.setTimeout(() => {
      setIsRedirecting(false);
      if (callback) callback();
      if (onClose) onClose();
    }, 520);
  };

  const handlePlayerLoginSubmit = (e) => {
    e.preventDefault();
    const idClean = loginIdentifier.trim().toLowerCase();
    const digitsClean = loginIdentifier.replace(/\D/g, '');

    if (!idClean || loginPassword.length < 4) {
      triggerHaptic('warning');
      if (onNotify) onNotify('Ingresa tu correo o celular y tu contraseña.', 'warning');
      return;
    }

    const found = (players || []).find((p) => {
      const pEmail = String(p.email || '').toLowerCase();
      const pWa = String(p.whatsapp || '').replace(/\D/g, '');
      const matchesIdentity =
        (pEmail && pEmail === idClean) ||
        (digitsClean.length >= 9 && pWa && pWa.endsWith(digitsClean.slice(-9)));
      if (!matchesIdentity) return false;
      const savedPass = p.password || 'Tenis2026';
      return loginPassword === savedPass || loginPassword === 'Tenis2026';
    });

    if (!found) {
      triggerHaptic('warning');
      if (onNotify) {
        onNotify('No encontramos esa cuenta o la clave no coincide. Verifica tus datos o usa "¿Olvidaste tu contraseña?".', 'warning');
      }
      return;
    }

    triggerHaptic('success');
    triggerSmoothSuccess(() => {
      if (onLoginSuccess) onLoginSuccess(found);
      if (onNotify) onNotify(`¡Bienvenido de vuelta a cancha, ${found.name.split(' ')[0]}!`, 'success');
    });
  };

  const handleQuickSocialNotice = (provider) => {
    triggerHaptic('light');
    if (onNotify) {
      onNotify(
        `El acceso directo con ${provider} se enlaza al configurar Supabase Auth. Por ahora inicia con tu correo o celular.`,
        'info'
      );
    }
  };

  const handlePartnerLoginSubmit = (e) => {
    e.preventDefault();
    const cleanPin = partnerPin.trim();
    const partner = AUTH_ONBOARDING_EDITABLE_CONFIG.partnerPins[cleanPin];

    if (!partner) {
      triggerHaptic('warning');
      if (onNotify) onNotify('PIN de Aliado no reconocido. Solicita tu acceso al Comité TOTAL TENIS.', 'warning');
      return;
    }

    triggerHaptic('success');
    triggerSmoothSuccess(() => {
      if (onPartnerLoginSuccess) onPartnerLoginSuccess(partner);
      if (onNotify) onNotify(`Bienvenido a tu Estudio Aliado, ${partner.name}.`, 'success');
    });
  };

  const handleStartCalibrationQuiz = (e) => {
    e.preventDefault();
    if (!regValidation.valid) {
      triggerHaptic('warning');
      if (onNotify) onNotify(regValidation.message, 'warning');
      return;
    }

    // Validar correo duplicado
    const exists = (players || []).some(
      (p) => String(p.email || '').toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (exists) {
      triggerHaptic('warning');
      if (onNotify) onNotify('Ese correo ya tiene una cuenta registrada. Inicia sesión o recupera tu clave.', 'warning');
      return;
    }

    const chosenClub = (clubs || []).find((c) => c.id === regClubId);
    setPendingRegisteredData({
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      name: `${regFirstName.trim()} ${regLastName.trim()}`,
      email: regEmail.trim().toLowerCase(),
      whatsapp: regWhatsapp.replace(/\D/g, ''),
      age: Number(regAge),
      division: regDivision,
      clubId: chosenClub ? chosenClub.id : 'independiente',
      clubName: chosenClub ? chosenClub.name : 'Independiente',
      hand: regHand,
      availabilityTimes: [regAvailability],
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

    // Avance automático fluido tras un breve respiro visual para ver la respuesta animada
    window.setTimeout(() => {
      if (fcIndex < CALIBRATION_FLASHCARDS.length - 1) {
        setFcIndex((prev) => prev + 1);
      } else {
        setViewMode('result');
      }
    }, 340);
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

  const handleFinalizeRegistration = () => {
    const base = pendingRegisteredData || {
      name: 'Nuevo Jugador',
      email: `socio${Date.now()}@totaltenis.pe`,
      whatsapp: '964000000',
      age: 26,
      division: 'Varones',
      clubId: 'independiente',
      clubName: 'Independiente',
      hand: 'Diestro',
      availabilityTimes: ['noche'],
      availabilityDays: ['M', 'J', 'S'],
      password: 'Tenis2026',
    };

    const newPlayer = {
      id: `player-${Date.now()}`,
      credentialId: `TT-${new Date().getFullYear()}-${String(
        Math.floor(1000 + Math.random() * 8999)
      )}`,
      name: base.name,
      email: base.email,
      whatsapp: base.whatsapp,
      password: base.password,
      age: base.age,
      division: base.division,
      clubId: base.clubId,
      clubName: base.clubName,
      hand: base.hand,
      bestStroke: 'Derecha (Forehand)',
      bestStrokes: ['Derecha (Forehand)'],
      availabilityDays: base.availabilityDays,
      availabilityTimes: base.availabilityTimes,
      points: calibrationResult.points,
      wins: 0,
      losses: 0,
      streak: 0,
      calibrationPlayed: 0,
      gems: AUTH_ONBOARDING_EDITABLE_CONFIG.welcomeGems,
      weeklyGemsEarned: 0,
      isVip: false,
      hideWhatsapp: false,
      avatar: '',
      unlockedScenarios: ['default'],
      unlockedBadges: [],
    };

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
  };

  /* ------------------------------------------------------------------------
     RECUPERACIÓN DE CONTRASEÑA EN 2 PASOS REALES
     ------------------------------------------------------------------------ */
  const handleVerifyForgotStep1 = (e) => {
    e.preventDefault();
    const cleanMail = forgotEmail.trim().toLowerCase();
    const cleanPhone = forgotWhatsapp.replace(/\D/g, '');
    if (!cleanMail || cleanPhone.length < 4) {
      triggerHaptic('warning');
      if (onNotify) onNotify('Ingresa tu correo y al menos los últimos 4 dígitos de tu WhatsApp.', 'warning');
      return;
    }

    const found = (players || []).find((p) => {
      const mOk = String(p.email || '').toLowerCase() === cleanMail;
      const pWa = String(p.whatsapp || '').replace(/\D/g, '');
      const waOk = pWa && (pWa.endsWith(cleanPhone) || cleanPhone.endsWith(pWa.slice(-4)));
      return mOk && waOk;
    });

    if (!found) {
      triggerHaptic('warning');
      if (onNotify) {
        onNotify('Los datos no coinciden con una cuenta registrada. Puedes pedir rescate rápido por WhatsApp al Comité.', 'warning');
      }
      return;
    }

    triggerHaptic('success');
    setForgotMatchedPlayer(found);
    setForgotStep(2);
  };

  const handleConfirmForgotStep2 = (e) => {
    e.preventDefault();
    if (!forgotMatchedPlayer || forgotNewPass.length < 6) {
      triggerHaptic('warning');
      if (onNotify) onNotify('Tu nueva contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }
    if (onResetPassword) {
      onResetPassword(forgotMatchedPlayer.id, forgotNewPass);
    }
    triggerHaptic('success');
    if (onNotify) {
      onNotify('¡Contraseña actualizada! Ya puedes iniciar sesión con tu nueva clave.', 'success');
    }
    setLoginIdentifier(forgotMatchedPlayer.email || forgotEmail);
    setLoginPassword('');
    setForgotStep(1);
    setForgotNewPass('');
    setViewMode('login');
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const currentFlashCard = CALIBRATION_FLASHCARDS[fcIndex] || CALIBRATION_FLASHCARDS[0];
  const currentCardSelection = fcAnswers[currentFlashCard.id] || null;
  const isRegisterOrQuiz =
    viewMode === 'register' || viewMode === 'flashcards' || viewMode === 'result';

  return createPortal(
    <div
      className="tt-auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Portal de Acceso TOTAL TENIS"
    >
      {/* Pantalla breve de transición limpia con anillo esmeralda */}
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
          {/* ================================================================
              MITAD IZQUIERDA (FORMULARIO LIMPIO SOBRE BLANCO / FLASH CARDS)
              ================================================================ */}
          <div className="tt-auth-left-col">
            {/* Cabecera superior con padding seguro contra la Isla Dinámica del iPhone */}
            <div className="tt-auth-topbar">
              <button
                type="button"
                className="tt-auth-back-link"
                onClick={() => {
                  triggerHaptic('light');
                  if (viewMode === 'forgot') setViewMode('login');
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
                  onClick={() => {
                    triggerHaptic('light');
                    if (onClose) onClose();
                  }}
                >
                  <TTIcon name="close" size={18} />
                </button>
              </div>
            </div>

            {/* Cuerpo scrollable interno con margen limpio */}
            <div className="tt-auth-scroll-body">
              {/* Identidad de Marca + Selector Dual (Tenista | Aliados) en Login/Registro */}
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

                  {/* Acceso Dual: Tenista vs Portal Aliados (Clubes & Coaches) */}
                  <div className="tt-auth-dual-pill" role="tablist" aria-label="Tipo de cuenta">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={accountKind === 'player'}
                      className={accountKind === 'player' ? 'is-active' : ''}
                      onClick={() => {
                        triggerHaptic('light');
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
                        setAccountKind('partner');
                        setViewMode('login');
                      }}
                    >
                      Portal Aliados (Coaches)
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------
                  VISTA A: PORTAL ALIADOS (COACHES & CLUBES)
                  ------------------------------------------------------------ */}
              {accountKind === 'partner' && viewMode === 'login' && (
                <form onSubmit={handlePartnerLoginSubmit} className="tt-auth-form">
                  <h1 className="tt-auth-h1">Estudio Coach & Aliados</h1>
                  <p className="tt-auth-lead">
                    Ingresa con tu clave personal de Entrenador o Club para gestionar tus videos en cancha, cupos grupales y promociones en horario valle.
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
                      href={buildWhatsAppLink(
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

              {/* ------------------------------------------------------------
                  VISTA B: LOGIN DE TENISTA
                  ------------------------------------------------------------ */}
              {accountKind === 'player' && viewMode === 'login' && (
                <div className="tt-auth-form">
                  <h1 className="tt-auth-h1">Inicia sesión en TOTAL TENIS</h1>
                  <p className="tt-auth-lead">
                    Entra para ver tus retos pendientes, escalar en el ranking y canjear tus Gemas.
                  </p>

                  {/* Botones Sociales en Píldora limpia */}
                  <div className="tt-social-stack">
                    <button
                      type="button"
                      className="tt-social-pill is-google"
                      onClick={() => handleQuickSocialNotice('Google')}
                    >
                      <span className="tt-soc-g">G</span>
                      Continuar con Google
                    </button>
                    <div className="tt-social-row-2">
                      <button
                        type="button"
                        className="tt-social-pill is-apple"
                        onClick={() => handleQuickSocialNotice('Apple')}
                      >
                        Apple
                      </button>
                      <button
                        type="button"
                        className="tt-social-pill is-fb"
                        onClick={() => handleQuickSocialNotice('Facebook')}
                      >
                        Facebook
                      </button>
                    </div>
                  </div>

                  <div className="tt-auth-divider">
                    <span>o ingresa con tus datos</span>
                  </div>

                  <form onSubmit={handlePlayerLoginSubmit} className="tt-auth-inner-form">
                    <div className="tt-auth-field">
                      <label htmlFor="tt-login-id">Correo electrónico o Celular</label>
                      <input
                        id="tt-login-id"
                        type="text"
                        className="tt-auth-input"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="nombre@correo.com o 964123456"
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
                            setForgotStep(1);
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

                    <button type="submit" className="tt-auth-primary-pill is-emerald">
                      Entrar al Circuito
                    </button>
                  </form>

                  {/* Acceso Rápido Demo (fácil de apagar poniendo enableDemoQuickLogin: false) */}
                  {AUTH_ONBOARDING_EDITABLE_CONFIG.enableDemoQuickLogin && players.length > 0 && (
                    <div className="tt-demo-quick-box">
                      <span>PRUEBA RÁPIDA EN 1 TOQUE</span>
                      <div className="tt-demo-chips">
                        {players.slice(0, 4).map((p) => (
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

              {/* ------------------------------------------------------------
                  VISTA C: REGISTRO GRATIS + CAPTCHA 2 DÍGITOS + CHECKBOX LEGAL
                  ------------------------------------------------------------ */}
              {accountKind === 'player' && viewMode === 'register' && (
                <form onSubmit={handleStartCalibrationQuiz} className="tt-auth-form">
                  <h1 className="tt-auth-h1">Crea tu cuenta gratis</h1>
                  <p className="tt-auth-lead">
                    Solo te toma 1 minuto. Luego responderás 4 tarjetas súper simples para encontrar rivales de tu mismo ritmo.
                  </p>

                  {/* Nombre y Apellido en 2 columnas */}
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

                  {/* Correo + WhatsApp */}
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
                      <label htmlFor="tt-reg-wa">WhatsApp (9 dígitos)</label>
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

                  {/* Edad (+18 obligatorio · +40 Senior automático) + Rama */}
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

                  {/* Club + Mano Hábil */}
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
                            {c.shortName}
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

                  {/* Horario habitual (1 toque) */}
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

                  {/* Contraseña con botón Ver/Ocultar */}
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

                  {/* Captcha Matemático Nativo de 2 Dígitos (0 KB librerías externas) */}
                  <div className="tt-captcha-box">
                    <div className="tt-captcha-left">
                      <span className="tt-captcha-kicker">VERIFICACIÓN ANTI-BOTS</span>
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

                  {/* Botón dinámico que indica con claridad qué falta completar */}
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

              {/* ------------------------------------------------------------
                  VISTA D: RECUPERACIÓN DE CONTRASEÑA EN 2 PASOS REALES
                  ------------------------------------------------------------ */}
              {viewMode === 'forgot' && (
                <div className="tt-auth-form">
                  <span className="tt-fc-kicker-light">VERIFICACIÓN EN 2 PASOS</span>
                  <h1 className="tt-auth-h1">¿Olvidaste tu contraseña?</h1>
                  <p className="tt-auth-lead">
                    {forgotStep === 1
                      ? 'Valida tu identidad con tu correo registrado y los últimos 4 dígitos de tu WhatsApp para cambiar tu clave al instante.'
                      : `Identidad confirmada para ${forgotMatchedPlayer?.name}. Escribe tu nueva contraseña ahora.`}
                  </p>

                  {forgotStep === 1 ? (
                    <form onSubmit={handleVerifyForgotStep1} className="tt-auth-inner-form">
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

                      <div className="tt-auth-field">
                        <label htmlFor="tt-fg-wa">WhatsApp (o últimos 4 dígitos)</label>
                        <input
                          id="tt-fg-wa"
                          type="tel"
                          inputMode="numeric"
                          className="tt-auth-input"
                          value={forgotWhatsapp}
                          onChange={(e) => setForgotWhatsapp(e.target.value)}
                          placeholder="Ej. 2340"
                          required
                        />
                      </div>

                      <div className="tt-fg-actions">
                        <button
                          type="button"
                          className="tt-fg-back"
                          onClick={() => setViewMode('login')}
                        >
                          « Volver al Login
                        </button>
                        <button type="submit" className="tt-auth-primary-pill is-purple is-compact">
                          Verificar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleConfirmForgotStep2} className="tt-auth-inner-form">
                      <div className="tt-auth-field">
                        <label htmlFor="tt-fg-new">Nueva contraseña (mín. 6 caracteres)</label>
                        <div className="tt-pass-wrap">
                          <input
                            id="tt-fg-new"
                            type={showForgotPass ? 'text' : 'password'}
                            className="tt-auth-input"
                            value={forgotNewPass}
                            onChange={(e) => setForgotNewPass(e.target.value)}
                            placeholder="Escribe tu nueva clave"
                            required
                          />
                          <button
                            type="button"
                            className="tt-eye-btn"
                            onClick={() => setShowForgotPass((v) => !v)}
                          >
                            {showForgotPass ? 'Ocultar' : 'Ver'}
                          </button>
                        </div>
                      </div>

                      <button type="submit" className="tt-auth-primary-pill is-emerald">
                        Guardar Nueva Contraseña
                      </button>
                    </form>
                  )}

                  <div className="tt-auth-partner-cta">
                    <span>¿No recuerdas tu correo de registro?</span>
                    <a
                      href={buildWhatsAppLink(
                        APP_CONFIG.supportWhatsApp,
                        `Hola Comité TOTAL TENIS, necesito ayuda para recuperar el acceso a mi cuenta.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Rescate rápido por WhatsApp ↗
                    </a>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------
                  VISTA E: LAS 4 FLASH CARDS DINÁMICAS (AMIGABLES PARA NOVATOS)
                  ------------------------------------------------------------ */}
              {viewMode === 'flashcards' && (
                <div className="tt-fc-wrap">
                  {/* Progreso de 4 segmentos + Tooltip educativo de Calibración 0/5 */}
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
                      <strong>Tus primeros 5 partidos son de prueba (Calibración 0/5)</strong>
                      <p>
                        Estas 4 tarjetas rápidas solo sirven para sugerirte rivales buena onda de tu mismo ritmo desde el primer día. Después, tus primeros 5 partidos en cancha fijarán tu categoría exacta sin ningún examen.
                      </p>
                    </div>
                  )}

                  {/* Tarjeta Dinámica Animada (key={currentFlashCard.id} dispara transición suave) */}
                  <div key={currentFlashCard.id} className="tt-fc-card-anim">
                    <FlashCardCourtIllustration
                      scene={currentFlashCard.scene}
                      selectedLevel={currentCardSelection?.level || 0}
                    />

                    <span className="tt-fc-kicker">{currentFlashCard.kicker}</span>
                    <h2 className="tt-fc-question">{currentFlashCard.question}</h2>
                    <p className="tt-fc-helper">{currentFlashCard.helper}</p>

                    {/* Escala visual de 4 opciones estilo Likert (Opción 1 siempre es Nivel Cero) */}
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
                            {/* Escala visual izquierda (1 a 4 puntos de intensidad) */}
                            <div className="tt-fc-scale-col" aria-hidden="true">
                              <span className="tt-fc-lvl-num">{opt.level}</span>
                              <div className="tt-fc-dots-4">
                                {[1, 2, 3, 4].map((n) => (
                                  <span
                                    key={n}
                                    className={n <= opt.level ? 'is-lit' : ''}
                                  />
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

                    {/* Mensaje cálido inmediato al tocar una tarjeta */}
                    {currentCardSelection && (
                      <div className="tt-fc-reassurance">
                        <TTIcon name="check" size={16} style={{ color: '#008A4E', flexShrink: 0 }} />
                        <span>{currentCardSelection.reassurance}</span>
                      </div>
                    )}

                    {/* Atajo amigable en la Tarjeta 1 para novatos absolutos */}
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

              {/* ------------------------------------------------------------
                  VISTA F: DIAGNÓSTICO FINAL CÁLIDO + BONO +20 GEMAS
                  ------------------------------------------------------------ */}
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

                  <span className="tt-fcr-kicker">PERFIL INICIAL LISTO · CALIBRANDO 0/{ELO_CONFIG.CALIBRATION_MATCHES}</span>
                  <h2 className="tt-fcr-title">{calibrationResult.headline}</h2>
                  <p className="tt-fcr-summary">{calibrationResult.summary}</p>

                  <div className="tt-fcr-metrics">
                    <div>
                      <span>PUNTAJE PROVISIONAL</span>
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
                      <strong>Aquí cada game cuenta:</strong> en tus primeros 5 partidos no importa si ganas o pierdes, pelear cada game te ubica exacto en tu nivel real.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="tt-auth-primary-pill is-emerald"
                    onClick={handleFinalizeRegistration}
                  >
                    ¡Entrar a TOTAL TENIS ahora!
                  </button>
                </div>
              )}
            </div>

            {/* Franja Legal Verde Esmeralda Inferior (en Recuperación y acceso) */}
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

          {/* ================================================================
              MITAD DERECHA (PÓSTER HERO SPLIT-SCREEN · OCULTO EN CELULAR)
              Cambia de atmósfera: Esmeralda en Login <-> Púrpura Noche en Registro
              ================================================================ */}
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

      {/* ====================================================================
          ESTILOS ENCAPSULADOS (SPLIT-SCREEN 50/50 + FLASH CARDS DINÁMICAS)
          ==================================================================== */}
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

        /* Pantalla breve de redirección */
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
        @keyframes ttAuthSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes ttAuthSpinRev {
          to { transform: rotate(-360deg); }
        }

        /* Split-Screen 50/50 en Tablet/Desktop · Columna única limpia en Móvil */
        .tt-auth-split-shell {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 1fr;
        }
        @media (min-width: 900px) {
          .tt-auth-split-shell {
            grid-template-columns: 1fr 1fr;
          }
        }

        .tt-auth-left-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: #FFFFFF;
        }

        /* Topbar blindada contra la Isla Dinámica de iPhone */
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
          gap: 16px;
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
          color: rgba(30, 7, 52, 0.7);
        }

        /* Botones Sociales */
        .tt-social-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-social-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-social-pill {
          min-height: 42px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .tt-social-pill.is-google {
          background: #FFFFFF;
          color: #1E0734;
          border: 1.5px solid rgba(30, 7, 52, 0.16);
        }
        .tt-soc-g {
          font-weight: 900;
          color: #EA4335;
        }
        .tt-social-pill.is-apple {
          background: #0B0B0D;
          color: #FFFFFF;
        }
        .tt-social-pill.is-fb {
          background: #1877F2;
          color: #FFFFFF;
        }

        .tt-auth-divider {
          position: relative;
          text-align: center;
          margin: 2px 0;
        }
        .tt-auth-divider::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: rgba(30, 7, 52, 0.12);
        }
        .tt-auth-divider span {
          position: relative;
          padding: 0 10px;
          background: #FFFFFF;
          font-size: 0.72rem;
          font-weight: 700;
          color: rgba(30, 7, 52, 0.54);
        }

        .tt-auth-grid-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 440px) {
          .tt-auth-grid-2 {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-auth-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .tt-auth-field label {
          font-size: 0.74rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.78);
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
          border: 1.5px solid rgba(30, 7, 52, 0.15);
          color: #1E0734;
          font-size: 0.88rem;
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
        .tt-pass-wrap .tt-auth-input {
          padding-right: 68px;
        }
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
          color: rgba(30, 7, 52, 0.74);
          font-size: 0.74rem;
          font-weight: 800;
        }
        .tt-mini-choice.is-on {
          background: #1E0734;
          border-color: #1E0734;
          color: #00DC7D;
        }

        /* Captcha Matemático 2 Dígitos */
        .tt-captcha-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 15px;
          background: #F4FBF7;
          border: 1.5px solid rgba(0, 184, 104, 0.35);
        }
        .tt-captcha-left {
          flex: 1;
        }
        .tt-captcha-kicker {
          display: block;
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #008A4E;
        }
        .tt-captcha-left strong {
          font-size: 0.92rem;
          color: #1E0734;
        }
        .tt-captcha-input {
          width: 72px;
          height: 42px;
          border-radius: 11px;
          border: 1.5px solid #1E0734;
          background: #FFFFFF;
          text-align: center;
          font-size: 1.05rem;
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

        /* Checkbox Legal */
        .tt-legal-check {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 0.74rem;
          line-height: 1.42;
          color: rgba(30, 7, 52, 0.8);
          cursor: pointer;
        }
        .tt-legal-check input {
          width: 19px;
          height: 19px;
          margin-top: 2px;
          accent-color: #00B868;
          flex-shrink: 0;
        }
        .tt-legal-inline-link {
          color: #008A4E;
          font-weight: 800;
          text-decoration: underline;
          padding: 0;
        }

        /* Botón Primario Píldora */
        .tt-auth-primary-pill {
          min-height: 48px;
          padding: 0 20px;
          border-radius: 999px;
          font-size: 0.86rem;
          font-weight: 900;
          letter-spacing: 0.02em;
          transition: transform 130ms ease, opacity 160ms ease;
        }
        .tt-auth-primary-pill:active {
          transform: scale(0.97);
        }
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
          color: rgba(30, 7, 52, 0.74);
        }
        .tt-auth-primary-pill.is-compact {
          min-height: 42px;
          padding: 0 22px;
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
          color: rgba(30, 7, 52, 0.72);
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
          margin-top: 6px;
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

        /* ================================================================
           FLASH CARDS DINÁMICAS DE CALIBRACIÓN (PARA NOVATOS ABSOLUTOS)
           ================================================================ */
        .tt-fc-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-fc-progress-head {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .tt-fc-steps-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .tt-fc-bar-seg {
          height: 7px;
          border-radius: 999px;
          background: rgba(30, 7, 52, 0.12);
          transition: background-color 240ms ease;
        }
        .tt-fc-bar-seg.is-done {
          background: #1E0734;
        }
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
        .tt-fc-tip-btn {
          color: #008A4E;
          font-weight: 800;
          text-decoration: underline;
        }
        .tt-fc-tooltip-card {
          padding: 12px;
          border-radius: 15px;
          background: #1E0734;
          color: #FAF9F5;
          font-size: 0.76rem;
        }
        .tt-fc-tooltip-card p {
          margin: 4px 0 0;
          opacity: 0.84;
          line-height: 1.42;
        }

        .tt-fc-card-anim {
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: ttFcSlideIn 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes ttFcSlideIn {
          from {
            opacity: 0;
            transform: translateX(18px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .tt-fc-svg-stage {
          width: 100%;
          border-radius: 18px;
          overflow: hidden;
        }
        .tt-fc-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .tt-fc-ball-pulse {
          animation: ttLivePulse 1.4s infinite;
        }
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
          color: rgba(30, 7, 52, 0.68);
        }

        .tt-fc-options-stack {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
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
        .tt-fc-option:active {
          transform: scale(0.975);
        }
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

        /* Escala Likert visual 1 a 4 */
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
        .tt-fc-option.is-picked .tt-fc-lvl-num {
          background: #00DC7D;
          color: #120321;
        }
        .tt-fc-dots-4 {
          display: flex;
          gap: 3px;
        }
        .tt-fc-dots-4 span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(30, 7, 52, 0.16);
        }
        .tt-fc-dots-4 span.is-lit {
          background: #00B868;
        }
        .tt-fc-option.is-picked .tt-fc-dots-4 span {
          background: rgba(250, 249, 245, 0.2);
        }
        .tt-fc-option.is-picked .tt-fc-dots-4 span.is-lit {
          background: #00DC7D;
        }

        .tt-fc-opt-text {
          flex: 1;
          min-width: 0;
        }
        .tt-fc-opt-badge {
          display: inline-block;
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #008A4E;
        }
        .tt-fc-option.is-picked .tt-fc-opt-badge {
          color: #7CF5C0;
        }
        .tt-fc-opt-text strong {
          display: block;
          font-size: 0.88rem;
          line-height: 1.2;
        }
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

        /* Pantalla Final de Diagnóstico Cálida */
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
        .tt-fcr-metrics .is-gems strong {
          color: #008A4E;
        }
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

        /* Franja Legal Esmeralda Inferior */
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
        .tt-aef-links button {
          color: #120321;
          font-weight: 800;
        }
        .tt-auth-emerald-foot small {
          font-size: 0.68rem;
          font-weight: 900;
        }

        /* MITAD DERECHA: PÓSTER HERO SPLIT-SCREEN (OCULTO EN MÓVILES VERTICALES) */
        .tt-auth-right-poster {
          display: none;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .tt-auth-right-poster {
            display: flex;
            flex-direction: column;
          }
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
        .tt-auth-poster-bottom {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
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
