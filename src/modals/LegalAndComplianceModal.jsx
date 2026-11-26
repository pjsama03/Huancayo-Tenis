import React, { useEffect, useMemo, useState } from 'react';
import {
  APP_CONFIG,
} from '../data/playersAndClubsData';
import {
  ASSETS,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import { buildWhatsAppLink } from '../utils/tenisEngine';

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (DATOS LEGALES, RUC, ARCO Y CLÁUSULAS EDITABLES)
   --------------------------------------------------------------------------
   - Cambia razón social, RUC, dirección o textos aquí sin tocar el diseño.
   - Si subes tu propio icono del Libro de Reclamaciones a public/assets/,
     colócalo como `icon-libro-reclamaciones.png` y se mostrará automáticamente.
   ========================================================================== */
export const LEGAL_EDITABLE_CONFIG = {
  brandName: 'TOTAL TENIS',
  legalEntity: 'TOTAL TENIS · Circuito Deportivo Digital',
  ruc: 'En trámite · Persona Natural con Negocio',
  address: 'Huancayo, Junín, Perú',
  arcoEmail: APP_CONFIG.supportEmail || 'soporte@totaltenis.pe',
  supportWhatsApp: APP_CONFIG.supportWhatsApp || '964812340',
  responseDeadlineDays: 15, // Plazo legal Indecopi (15 días hábiles improrrogables)
  customBookIconSrc: '/assets/icon-libro-reclamaciones.png',
  lastUpdated: 'Noviembre 2026',

  /* 6 CLÁUSULAS OBLIGATORIAS DE TÉRMINOS Y CONDICIONES */
  termsClauses: [
    {
      number: '01',
      title: 'Naturaleza del Servicio',
      icon: 'shield',
      summary: 'Plataforma tecnológica de gestión deportiva y rankings recreativos.',
      body: 'TOTAL TENIS es una plataforma tecnológica de gestión deportiva, coordinación de partidos y rankings recreativos. La plataforma no organiza eventos médicos, no presta servicios de salud ni garantiza supervisión presencial permanente en las instalaciones o canchas administradas por terceros.',
    },
    {
      number: '02',
      title: 'Titularidad (+18), Menores Tutelados (-18) y Emancipación',
      icon: 'users',
      summary: 'Acceso directo para mayores de edad y protección integral del menor.',
      body: 'El registro directo como titular es exclusivo para mayores de 18 años. Los menores de edad participan únicamente mediante una Subcuenta Tutelada creada y administrada bajo declaración de patria potestad o tutela por su padre, madre o apoderado verificado. Al cumplir 18 años, el titular adulto puede emitir un código único de emancipación para que el jugador asuma su cuenta propia conservando el 100 % de sus puntos, categoría e historial.',
    },
    {
      number: '03',
      title: 'Exención de Responsabilidad Física (Deslinde)',
      icon: 'alert',
      summary: 'Participación voluntaria bajo propia responsabilidad y riesgo físico.',
      body: 'El usuario (o su padre, madre o tutor legal en el caso de cuentas tuteladas) declara que el participante se encuentra apto físicamente para la práctica del tenis y participa en los partidos, retos, entrenamientos y torneos bajo su propia responsabilidad y riesgo físico. TOTAL TENIS y sus administradores quedan exentos de toda responsabilidad civil, médica o penal por lesiones, accidentes, golpes de calor, daños materiales o altercados ocurridos antes, durante o después de los encuentros.',
    },
    {
      number: '04',
      title: 'Pagos Directos, No Reembolso y Naturaleza de las Gemas',
      icon: 'clock',
      summary: 'Ventas directas finales y puntos de fidelidad sin valor monetario.',
      body: 'Los pagos realizados por concepto de inscripciones a torneos, membresías Socio VIP o servicios publicados en la plataforma se efectúan como pago directo de servicio y son finales. No proceden reembolsos si el usuario cancela su participación con menos de 24 horas de anticipación, no se presenta al partido (walkover) o es descalificado por incumplimiento del reglamento. Las Gemas son puntos de fidelidad deportiva sin valor monetario, sin equivalencia en soles y no canjeables por dinero en efectivo.',
    },
    {
      number: '05',
      title: 'Derecho de Admisión, Sanciones y Baneo',
      icon: 'crown',
      summary: 'Protección de la integridad deportiva y juego limpio.',
      body: 'El Comité Administrador de TOTAL TENIS se reserva el derecho de suspender temporal o definitivamente cualquier cuenta, sin derecho a reembolso ni indemnización, ante casos comprobados de suplantación de identidad, falsificación o arreglo de marcadores, agresión verbal o física, acoso o conducta antideportiva dentro o fuera de cancha.',
    },
    {
      number: '06',
      title: 'Reglas del Ranking, Temporadas 00:00 y Reset al Piso',
      icon: 'chart',
      summary: 'Equidad competitiva, cierres automáticos y carrera al Master Top 8.',
      body: 'El puntaje oficial, la ventana dinámica anti-escasez, la actividad mensual y los cierres automáticos de temporada a las 00:00 (hora Perú) —donde se guarda la foto anual para el Master Top 8 y cada jugador inicia la nueva temporada en el piso de su categoría— son administrados por la plataforma para preservar la equidad deportiva de toda la comunidad.',
    },
  ],

  /* 5 CLÁUSULAS OBLIGATORIAS DE POLÍTICA DE PRIVACIDAD (LEY N° 29733 — PERÚ) */
  privacyClauses: [
    {
      number: '01',
      title: 'Datos Personales Recopilados',
      icon: 'users',
      body: 'Para el funcionamiento del circuito recopilamos únicamente los datos que proporcionas al registrarte y competir: nombre completo, número de celular (WhatsApp), correo electrónico, fotografía de perfil, club o sede de procedencia, edad (+18 años para titulares) y estadísticas deportivas de tus partidos.',
    },
    {
      number: '02',
      title: 'Protección Especial de Menores Tutelados (-18)',
      icon: 'shield',
      body: 'En subcuentas juveniles tuteladas no solicitamos ni almacenamos correo electrónico, contraseña ni teléfono personal del menor. Toda coordinación de retos, avisos y contacto por WhatsApp se enruta exclusivamente hacia el número verificado del padre, madre o apoderado legal.',
    },
    {
      number: '03',
      title: 'Finalidad del Tratamiento',
      icon: 'shield',
      body: 'Tus datos personales se utilizan exclusivamente para operar el ranking deportivo oficial, permitir la coordinación de partidos entre rivales autorizados, validar pagos directos de torneos o membresías y enviarte comunicaciones oficiales vinculadas al circuito TOTAL TENIS.',
    },
    {
      number: '04',
      title: 'Privacidad de tu Teléfono (WhatsApp)',
      icon: 'whatsapp',
      body: 'Tienes control directo sobre tu número de contacto. Desde los Ajustes de tu perfil puedes elegir en cualquier momento si tu número de WhatsApp es visible para la comunidad o si queda restringido únicamente a rivales con los que tengas un reto oficialmente aceptado.',
    },
    {
      number: '05',
      title: 'Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)',
      icon: 'check',
      body: 'Conforme a la Ley N° 29733 de Protección de Datos Personales del Perú, puedes ejercer en cualquier momento tus Derechos ARCO solicitando el acceso, actualización, rectificación o eliminación definitiva de tus datos personales (o los de tu menor tutelado) de la base de datos de TOTAL TENIS a través de nuestros canales oficiales de soporte.',
    },
  ],
};
const COMPLAINTS_STORAGE_KEY = 'tt_indecopi_complaints_v1';

/* ==========================================================================
   INSIGNIA VECTORIAL DE DOBLE CAPA CON RELIEVE (LIBRO DE RECLAMACIONES)
   Reemplaza definitivamente el icono plano / emoji tosco.
   ========================================================================== */
function DualLayerLegalCrest({ variant = 'reclamaciones', size = 44 }) {
  const [customImgOk, setCustomImgOk] = useState(false);
  const showCustom = variant === 'reclamaciones' && customImgOk;

  return (
    <div
      className={`tt-lg-crest is-${variant}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {variant === 'reclamaciones' && (
        <img
          src={LEGAL_EDITABLE_CONFIG.customBookIconSrc}
          alt=""
          onLoad={() => setCustomImgOk(true)}
          onError={() => setCustomImgOk(false)}
          style={{
            position: 'absolute',
            inset: 4,
            width: size - 8,
            height: size - 8,
            objectFit: 'contain',
            opacity: customImgOk ? 1 : 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {!showCustom && (
        <svg
          width={Math.round(size * 0.58)}
          height={Math.round(size * 0.58)}
          viewBox="0 0 28 28"
          fill="none"
        >
          <defs>
            <linearGradient id={`tt-lg-g-${variant}`} x1="0" y1="0" x2="28" y2="28">
              <stop
                offset="0%"
                stopColor={variant === 'reclamaciones' ? '#FEF08A' : '#7CF5C0'}
              />
              <stop
                offset="100%"
                stopColor={variant === 'reclamaciones' ? '#F59E0B' : '#00DC7D'}
              />
            </linearGradient>
          </defs>

          {variant === 'reclamaciones' && (
            <>
              <path
                d="M4.5 7.5C4.5 6.1 5.6 5 7 5H13.2C14.5 5 15.8 5.6 16.6 6.6V22.5C15.7 21.6 14.5 21.1 13.2 21.1H7C5.6 21.1 4.5 20 4.5 18.6V7.5Z"
                fill={`url(#tt-lg-g-${variant})`}
                fillOpacity="0.28"
              />
              <path
                d="M14 7.2C12.8 5.9 11 5.2 9 5.2H5.8C4.8 5.2 4 6 4 7V19.2C4 20.2 4.8 21 5.8 21H9.4C11.2 21 12.9 21.6 14 22.8M14 7.2C15.2 5.9 17 5.2 19 5.2H22.2C23.2 5.2 24 6 24 7V19.2C24 20.2 23.2 21 22.2 21H18.6C16.8 21 15.1 21.6 14 22.8M14 7.2V22.8"
                stroke={`url(#tt-lg-g-${variant})`}
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="19.5" cy="12" r="2.4" fill={`url(#tt-lg-g-${variant})`} />
            </>
          )}

          {variant === 'terms' && (
            <>
              <rect
                x="5"
                y="3.5"
                width="18"
                height="21"
                rx="4"
                fill={`url(#tt-lg-g-${variant})`}
                fillOpacity="0.2"
                stroke={`url(#tt-lg-g-${variant})`}
                strokeWidth="2"
              />
              <path
                d="M9.5 10H18.5M9.5 14.2H18.5M9.5 18.4H14.8"
                stroke={`url(#tt-lg-g-${variant})`}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </>
          )}

          {variant === 'privacy' && (
            <>
              <path
                d="M14 3.5L22.5 6.8V13.4C22.5 18.6 18.9 22.8 14 24.5C9.1 22.8 5.5 18.6 5.5 13.4V6.8L14 3.5Z"
                fill={`url(#tt-lg-g-${variant})`}
                fillOpacity="0.22"
                stroke={`url(#tt-lg-g-${variant})`}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M10.4 14L12.8 16.4L17.8 11.4"
                stroke={`url(#tt-lg-g-${variant})`}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
      )}
    </div>
  );
}

/* ==========================================================================
   UTILIDAD: GENERADOR CORRELATIVO OFICIAL (LR-2026-001, LR-2026-002...)
   ========================================================================== */
function getNextComplaintCode(existingList = []) {
  const year = new Date().getFullYear();
  let storedCount = 0;
  try {
    const raw = window.localStorage.getItem(COMPLAINTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) storedCount = parsed.length;
    }
  } catch (e) {
    storedCount = 0;
  }
  const nextSeq = Math.max(storedCount, existingList.length) + 1;
  return `LR-${year}-${String(nextSeq).padStart(3, '0')}`;
}

function downloadComplaintReceiptText(record) {
  const lines = [
    '============================================================',
    '  HOJA DE RECLAMACIÓN VIRTUAL — LIBRO DE RECLAMACIONES',
    `  ${LEGAL_EDITABLE_CONFIG.brandName} · ${LEGAL_EDITABLE_CONFIG.legalEntity}`,
    '============================================================',
    `Código Correlativo : ${record.code}`,
    `Fecha y Hora       : ${record.createdAtFormatted}`,
    `Dirección          : ${LEGAL_EDITABLE_CONFIG.address}`,
    `RUC                : ${LEGAL_EDITABLE_CONFIG.ruc}`,
    '------------------------------------------------------------',
    '1. DATOS DEL CONSUMIDOR:',
    `   Nombre Completo : ${record.fullName}`,
    `   Documento       : ${record.docType} ${record.docNumber}`,
    `   Correo          : ${record.email}`,
    `   Teléfono        : ${record.phone}`,
    '------------------------------------------------------------',
    '2. DETALLE DE LA RECLAMACIÓN:',
    `   Tipo            : ${record.type}`,
    record.amount ? `   Monto Involuc.  : S/ ${record.amount}` : null,
    `   Incidente       : ${record.detail}`,
    record.consumerRequest ? `   Pedido          : ${record.consumerRequest}` : null,
    '------------------------------------------------------------',
    `Plazo legal de respuesta: hasta ${LEGAL_EDITABLE_CONFIG.responseDeadlineDays} días hábiles improrrogables`,
    '(Ley N° 29571, Ley N° 31435 y Ley N° 32495 - Indecopi Perú).',
    '============================================================',
  ]
    .filter(Boolean)
    .join('\n');

  const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Constancia-${record.code}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: LegalAndComplianceModal (BLOQUE 21 DE 26)
   ========================================================================== */
export default function LegalAndComplianceModal({
  isOpen = false,
  initialSection = 'reclamaciones', // 'reclamaciones' | 'terms' | 'privacy'
  onClose,
  currentUser = null,
  complaints = [],
  onOpenAuth,
  onSubmitComplaint,
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState(initialSection);

  // Estado del formulario oficial del Libro de Reclamaciones Virtual
  const [fullName, setFullName] = useState('');
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [claimType, setClaimType] = useState('Reclamo'); // 'Reclamo' | 'Queja'
  const [amount, setAmount] = useState('');
  const [detail, setDetail] = useState('');
  const [consumerRequest, setConsumerRequest] = useState('');
  const [submittedRecord, setSubmittedRecord] = useState(null);

  // Sincronizar pestaña inicial y autocompletar datos del usuario en sesión
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(
      initialSection === 'terms' || initialSection === 'privacy'
        ? initialSection
        : 'reclamaciones'
    );
    setSubmittedRecord(null);
    if (currentUser) {
      setFullName((prev) => prev || currentUser.name || '');
      setEmail((prev) => prev || currentUser.email || '');
      setPhone((prev) => prev || currentUser.whatsapp || '');
    }
  }, [isOpen, initialSection, currentUser]);

  // Validación clara en vivo para el Libro de Reclamaciones
  const formValidation = useMemo(() => {
    const cleanDoc = docNumber.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    if (fullName.trim().length < 4) {
      return { ok: false, hint: 'Ingresa tu nombre completo' };
    }
    if (docType === 'DNI' && !/^\d{8}$/.test(cleanDoc)) {
      return { ok: false, hint: 'El DNI debe tener 8 dígitos' };
    }
    if (docType === 'CE' && cleanDoc.length < 8) {
      return { ok: false, hint: 'Ingresa tu Carné de Extranjería válido' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return { ok: false, hint: 'Ingresa un correo electrónico válido' };
    }
    if (cleanPhone.length < 9) {
      return { ok: false, hint: 'Ingresa un número de teléfono válido' };
    }
    if (detail.trim().length < 15) {
      return { ok: false, hint: 'Describe el incidente (mín. 15 caracteres)' };
    }
    return { ok: true, hint: 'Enviar Hoja de Reclamación' };
  }, [fullName, docType, docNumber, email, phone, detail]);

  const handleSubmitClaim = (e) => {
    e.preventDefault();
    if (!currentUser) {
      triggerHaptic('warning');
      if (onNotify) {
        onNotify('Inicia sesión con tu cuenta para registrar una Hoja de Reclamación.', 'warning');
      }
      if (onClose) onClose();
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    if (!formValidation.ok) {
      triggerHaptic('warning');
      if (onNotify) onNotify(formValidation.hint, 'warning');
      return;
    }

    const code = getNextComplaintCode(complaints);
    const now = new Date();
    const createdAtFormatted = now.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const record = {
      id: `claim-${Date.now()}`,
      code,
      createdAt: now.toISOString(),
      createdAtFormatted,
      playerId: currentUser?.id || null,
      fullName: fullName.trim(),
      docType,
      docNumber: docNumber.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      type: claimType,
      amount: amount.trim(),
      detail: detail.trim(),
      consumerRequest: consumerRequest.trim(),
      status: 'REGISTRADA',
    };

    try {
      const raw = window.localStorage.getItem(COMPLAINTS_STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(prev) ? [record, ...prev] : [record];
      window.localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      // Continuar aun si el navegador bloquea storage privado
    }

    if (onSubmitComplaint) {
      onSubmitComplaint(record);
    }

    triggerHaptic('success');
    setSubmittedRecord(record);
    if (onNotify) {
      onNotify(`Hoja de Reclamación ${code} registrada oficialmente.`, 'success');
    }
  };

  const handleCopyCode = async (code) => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(code);
      if (onNotify) onNotify(`Código ${code} copiado.`, 'success');
    } catch (e) {
      if (onNotify) onNotify(`Código oficial: ${code}`, 'info');
    }
  };

  const handleSendArcoRequest = () => {
    triggerHaptic('light');
    const msg = [
      `Hola soporte legal de TOTAL TENIS, deseo ejercer mis Derechos ARCO (Ley N° 29733):`,
      `• Titular: ${currentUser?.name || fullName || 'Usuario registrado'}`,
      `• Correo de cuenta: ${currentUser?.email || email || 'Por indicar'}`,
      `• Solicitud: [Acceso / Rectificación / Cancelación / Oposición]`,
    ].join('\n');
    window.open(
      buildWhatsAppLink(LEGAL_EDITABLE_CONFIG.supportWhatsApp, msg),
      '_blank',
      'noopener,noreferrer'
    );
  };

  const headerMeta =
    activeTab === 'terms'
      ? {
          title: 'Términos y Condiciones',
          subtitle: `Normativa de uso del circuito · Actualizado ${LEGAL_EDITABLE_CONFIG.lastUpdated}`,
        }
      : activeTab === 'privacy'
      ? {
          title: 'Política de Privacidad',
          subtitle: 'Protección de Datos Personales · Ley N° 29733 (Perú)',
        }
      : {
          title: 'Libro de Reclamaciones Virtual',
          subtitle: 'Conforme al Código de Protección al Consumidor (Indecopi)',
        };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={headerMeta.title}
      subtitle={headerMeta.subtitle}
      icon={<DualLayerLegalCrest variant={activeTab} size={42} />}
      isWide
      isTopLayer
    >
      <div className="tt-lg-shell">
        {/* 1. CONMUTADOR SUPERIOR LIMPIO (3 SECCIONES LEGALES) */}
        <div className="tt-lg-tabs" role="tablist" aria-label="Información Legal TOTAL TENIS">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reclamaciones'}
            className={`tt-lg-tab ${activeTab === 'reclamaciones' ? 'is-active is-gold' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('reclamaciones');
            }}
          >
            Libro Reclamaciones
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'terms'}
            className={`tt-lg-tab ${activeTab === 'terms' ? 'is-active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('terms');
            }}
          >
            Términos
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'privacy'}
            className={`tt-lg-tab ${activeTab === 'privacy' ? 'is-active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('privacy');
            }}
          >
            Privacidad
          </button>
        </div>

        {/* ==================================================================
            PESTAÑA 1: LIBRO DE RECLAMACIONES VIRTUAL (SOLO USUARIOS LOGUEADOS)
            ================================================================== */}
        {activeTab === 'reclamaciones' && (
          <div className="tt-lg-stack">
            <div className="tt-lg-indecopi-banner">
              <DualLayerLegalCrest variant="reclamaciones" size={50} />
              <div className="tt-lg-ib-text">
                <span className="tt-lg-kicker">HOJA DE RECLAMACIÓN VIRTUAL · PERÚ</span>
                <h3>{LEGAL_EDITABLE_CONFIG.legalEntity}</h3>
                <p>
                  {LEGAL_EDITABLE_CONFIG.address} · {LEGAL_EDITABLE_CONFIG.ruc}
                </p>
              </div>
            </div>

            {!currentUser ? (
              <div className="tt-lg-auth-gate">
                <div className="tt-lg-ag-icon" aria-hidden="true">
                  <TTIcon name="shield" size={28} style={{ color: '#00DC7D' }} />
                </div>
                <h4>Inicia sesión para registrar una reclamación</h4>
                <p>
                  Para proteger la identidad del consumidor y dar seguimiento oficial a tu caso,
                  debes estar conectado con tu cuenta de TOTAL TENIS antes de enviar una Hoja de
                  Reclamación.
                </p>
                <div className="tt-lg-ag-actions">
                  <button
                    type="button"
                    className="tt-lg-btn-primary"
                    onClick={() => {
                      triggerHaptic('medium');
                      if (onClose) onClose();
                      if (onOpenAuth) onOpenAuth('login');
                    }}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    className="tt-lg-btn-outline"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onClose) onClose();
                      if (onOpenAuth) onOpenAuth('register');
                    }}
                  >
                    Crear Cuenta Gratis
                  </button>
                </div>
              </div>
            ) : submittedRecord ? (
              <div className="tt-lg-receipt-card">
                <div className="tt-lg-rc-badge">
                  <TTIcon name="check" size={20} />
                  <span>REGISTRO OFICIAL CONFIRMADO</span>
                </div>

                <span className="tt-lg-rc-label">CÓDIGO CORRELATIVO DE HOJA DE RECLAMACIÓN</span>
                <button
                  type="button"
                  className="tt-lg-rc-code"
                  onClick={() => handleCopyCode(submittedRecord.code)}
                  title="Toca para copiar código"
                >
                  {submittedRecord.code}
                </button>
                <small className="tt-lg-rc-date">
                  Registrado el {submittedRecord.createdAtFormatted} · Plazo máximo de respuesta:{' '}
                  {LEGAL_EDITABLE_CONFIG.responseDeadlineDays} días hábiles.
                </small>

                <div className="tt-lg-rc-summary">
                  <div>
                    <span>Titular</span>
                    <strong>{submittedRecord.fullName}</strong>
                  </div>
                  <div>
                    <span>Documento</span>
                    <strong>
                      {submittedRecord.docType} {submittedRecord.docNumber}
                    </strong>
                  </div>
                  <div>
                    <span>Tipo</span>
                    <strong>{submittedRecord.type}</strong>
                  </div>
                  <div>
                    <span>Correo</span>
                    <strong>{submittedRecord.email}</strong>
                  </div>
                </div>

                <div className="tt-lg-rc-actions">
                  <button
                    type="button"
                    className="tt-lg-btn-primary"
                    onClick={() => {
                      triggerHaptic('light');
                      downloadComplaintReceiptText(submittedRecord);
                    }}
                  >
                    Descargar Constancia ({submittedRecord.code})
                  </button>

                  <a
                    href={buildWhatsAppLink(
                      LEGAL_EDITABLE_CONFIG.supportWhatsApp,
                      `Hola soporte TOTAL TENIS, acabo de registrar la Hoja de Reclamación ${submittedRecord.code} (${submittedRecord.type}) a nombre de ${submittedRecord.fullName}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tt-lg-btn-outline"
                  >
                    <TTIcon name="whatsapp" size={16} />
                    Enviar copia al Comité
                  </a>
                </div>

                <button
                  type="button"
                  className="tt-lg-reset-link"
                  onClick={() => {
                    setSubmittedRecord(null);
                    setDetail('');
                    setConsumerRequest('');
                    setAmount('');
                  }}
                >
                  Registrar otra hoja de reclamación
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitClaim} className="tt-lg-form">
                <div className="tt-lg-field">
                  <label htmlFor="tt-lr-name">Nombre completo del consumidor</label>
                  <input
                    id="tt-lr-name"
                    type="text"
                    className="tt-lg-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nombres y apellidos completos"
                    required
                  />
                </div>

                <div className="tt-lg-grid-2">
                  <div className="tt-lg-field">
                    <label>Tipo de documento</label>
                    <div className="tt-lg-choice-pair">
                      {[
                        { id: 'DNI', label: 'DNI' },
                        { id: 'CE', label: 'Carné Ext.' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className={`tt-lg-choice ${docType === d.id ? 'is-on' : ''}`}
                          onClick={() => {
                            triggerHaptic('light');
                            setDocType(d.id);
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="tt-lg-field">
                    <label htmlFor="tt-lr-doc">Número de {docType}</label>
                    <input
                      id="tt-lr-doc"
                      type="text"
                      inputMode={docType === 'DNI' ? 'numeric' : 'text'}
                      maxLength={docType === 'DNI' ? 8 : 12}
                      className="tt-lg-input"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder={docType === 'DNI' ? '8 dígitos' : 'Número de CE'}
                      required
                    />
                  </div>
                </div>

                <div className="tt-lg-grid-2">
                  <div className="tt-lg-field">
                    <label htmlFor="tt-lr-mail">Correo electrónico</label>
                    <input
                      id="tt-lr-mail"
                      type="email"
                      className="tt-lg-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                  <div className="tt-lg-field">
                    <label htmlFor="tt-lr-phone">Teléfono / WhatsApp</label>
                    <input
                      id="tt-lr-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={12}
                      className="tt-lg-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="964 123 456"
                      required
                    />
                  </div>
                </div>

                <div className="tt-lg-field">
                  <label>Tipo de registro</label>
                  <div className="tt-lg-type-grid">
                    <button
                      type="button"
                      className={`tt-lg-type-card ${claimType === 'Reclamo' ? 'is-on' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setClaimType('Reclamo');
                      }}
                    >
                      <strong>Reclamo</strong>
                      <small>Disconformidad relacionada al servicio o torneo contratado.</small>
                    </button>

                    <button
                      type="button"
                      className={`tt-lg-type-card ${claimType === 'Queja' ? 'is-on' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setClaimType('Queja');
                      }}
                    >
                      <strong>Queja</strong>
                      <small>Malestar o descontento respecto a la atención recibida.</small>
                    </button>
                  </div>
                </div>

                <div className="tt-lg-field">
                  <label htmlFor="tt-lr-amount">Monto involucrado en S/ (opcional)</label>
                  <input
                    id="tt-lr-amount"
                    type="number"
                    min="0"
                    step="0.10"
                    className="tt-lg-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ej. 40.00 (déjalo vacío si no aplica)"
                  />
                </div>

                <div className="tt-lg-field">
                  <label htmlFor="tt-lr-detail">Detalle del incidente</label>
                  <textarea
                    id="tt-lr-detail"
                    rows={4}
                    className="tt-lg-textarea"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Cuéntanos con claridad qué ocurrió, fecha y sede o servicio relacionado..."
                    required
                  />
                </div>

                <div className="tt-lg-field">
                  <label htmlFor="tt-lr-req">Pedido concreto del consumidor (opcional)</label>
                  <input
                    id="tt-lr-req"
                    type="text"
                    className="tt-lg-input"
                    value={consumerRequest}
                    onChange={(e) => setConsumerRequest(e.target.value)}
                    placeholder="Ej. Corrección de registro, respuesta formal o revisión del caso..."
                  />
                </div>

                <p className="tt-lg-legal-note">
                  La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante Indecopi. Daremos respuesta formal por escrito en un plazo máximo de{' '}
                  <strong>{LEGAL_EDITABLE_CONFIG.responseDeadlineDays} días hábiles improrrogables</strong> (Ley N° 31435 y Ley N° 32495).
                </p>

                <button
                  type="submit"
                  className={`tt-lg-btn-primary ${!formValidation.ok ? 'is-muted' : ''}`}
                >
                  {formValidation.hint}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 2: TÉRMINOS Y CONDICIONES (6 CLÁUSULAS OBLIGATORIAS + SBS)
            ================================================================== */}
        {activeTab === 'terms' && (
          <div className="tt-lg-stack">
            <div className="tt-lg-doc-hero">
              <DualLayerLegalCrest variant="terms" size={44} />
              <div>
                <span className="tt-lg-kicker">CONTRATO DE USO DEL CIRCUITO</span>
                <h3>Términos y Condiciones · {LEGAL_EDITABLE_CONFIG.brandName}</h3>
                <p>
                  Al crear tu cuenta (+18 años) y participar en partidos, torneos o servicios publicados, aceptas expresamente las siguientes cláusulas:
                </p>
              </div>
            </div>

            <div className="tt-lg-clauses-list">
              {LEGAL_EDITABLE_CONFIG.termsClauses.map((cl) => (
                <article key={cl.number} className="tt-lg-clause-card">
                  <div className="tt-lg-cl-head">
                    <span className="tt-lg-cl-num">{cl.number}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4>{cl.title}</h4>
                      <small>{cl.summary}</small>
                    </div>
                  </div>
                  <p>{cl.body}</p>
                </article>
              ))}
            </div>

            <div className="tt-lg-sbs-callout">
              <TTIcon name="shield" size={18} style={{ color: '#00DC7D', flexShrink: 0 }} />
              <div>
                <strong>Transparencia de Pagos Directos</strong>
                <p>
                  TOTAL TENIS no funciona como billetera digital, no almacena saldos monetarios de usuarios ni acumula pozos de dinero entre terceros. Todo pago por torneos, membresías VIP o artículos se realiza de forma directa por el servicio contratado y se valida manualmente contra constancia.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 3: POLÍTICA DE PRIVACIDAD (LEY N° 29733 + DERECHOS ARCO)
            ================================================================== */}
        {activeTab === 'privacy' && (
          <div className="tt-lg-stack">
            <div className="tt-lg-doc-hero">
              <DualLayerLegalCrest variant="privacy" size={44} />
              <div>
                <span className="tt-lg-kicker">LEY N° 29733 · PROTECCIÓN DE DATOS PERÚ</span>
                <h3>Política de Privacidad y Datos Personales</h3>
                <p>
                  Tratamos tu información con transparencia, seguridad y estricta finalidad deportiva conforme a la normativa peruana vigente.
                </p>
              </div>
            </div>

            <div className="tt-lg-clauses-list">
              {LEGAL_EDITABLE_CONFIG.privacyClauses.map((cl) => (
                <article key={cl.number} className="tt-lg-clause-card">
                  <div className="tt-lg-cl-head">
                    <span className="tt-lg-cl-num is-emerald">{cl.number}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4>{cl.title}</h4>
                    </div>
                  </div>
                  <p>{cl.body}</p>
                </article>
              ))}
            </div>

            <div className="tt-lg-arco-card">
              <div className="tt-lg-arco-top">
                <span className="tt-lg-kicker" style={{ color: '#7CF5C0' }}>
                  CANAL OFICIAL DE DERECHOS ARCO
                </span>
                <h4>¿Deseas modificar o eliminar tus datos personales?</h4>
                <p>
                  Puedes enviar tu solicitud directa al correo <strong>{LEGAL_EDITABLE_CONFIG.arcoEmail}</strong> o por nuestro canal oficial de soporte.
                </p>
              </div>

              <div className="tt-lg-arco-actions">
                <a
                  href={`mailto:${LEGAL_EDITABLE_CONFIG.arcoEmail}?subject=${encodeURIComponent(
                    'Solicitud Derechos ARCO - TOTAL TENIS'
                  )}`}
                  className="tt-lg-btn-primary is-emerald-fill"
                >
                  Solicitar por Correo
                </a>
                <button
                  type="button"
                  className="tt-lg-btn-outline is-dark-surface"
                  onClick={handleSendArcoRequest}
                >
                  <TTIcon name="whatsapp" size={16} />
                  Solicitar por WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="tt-lg-footer">
          <SmartImage
            src={ASSETS.logoOscuro || ASSETS.logo}
            alt="TOTAL TENIS"
            style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
          />
          <span>© {new Date().getFullYear()} {LEGAL_EDITABLE_CONFIG.brandName}. Todos los derechos reservados.</span>
        </footer>
      </div>

      <style>{`
        .tt-lg-shell {
          border-radius: 20px;
          padding: 15px;
          background: #FAF9F5;
          color: #1E0734;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-lg-stack {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .tt-lg-auth-gate {
          border-radius: 20px;
          padding: 22px 16px;
          background: linear-gradient(180deg, #FFFFFF 0%, #F4F0FA 100%);
          border: 1.5px solid rgba(30, 7, 52, 0.16);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 5px 0 #D0C5E6;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
        }
        .tt-lg-ag-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: linear-gradient(180deg, #2D0F4E 0%, #17042A 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.55);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 0 #0B0116;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-lg-auth-gate h4 {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-size: 1.28rem;
          color: #1E0734;
        }
        .tt-lg-auth-gate p {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.46;
          color: rgba(30, 7, 52, 0.78);
          max-width: 420px;
        }
        .tt-lg-ag-actions {
          width: 100%;
          max-width: 340px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
          margin-top: 4px;
        }
        .tt-lg-crest {
          position: relative;
          border-radius: 14px;
          background: linear-gradient(135deg, #270A44 0%, #140324 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.55);
          box-shadow: 0 8px 18px rgba(30, 7, 52, 0.28),
            inset 0 1px 1px rgba(255, 255, 255, 0.22);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 180ms ease;
        }
        .tt-lg-crest.is-reclamaciones {
          border-color: rgba(245, 158, 11, 0.72);
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.22),
            inset 0 1px 1px rgba(254, 240, 138, 0.3);
        }
        .tt-lg-tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
          padding: 5px;
          border-radius: 15px;
          background: rgba(30, 7, 52, 0.08);
        }
        .tt-lg-tab {
          min-height: 40px;
          padding: 0 6px;
          border-radius: 11px;
          font-size: 0.72rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.72);
          white-space: nowrap;
          transition: background-color 180ms ease, color 180ms ease, transform 120ms ease;
        }
        .tt-lg-tab:active {
          transform: scale(0.97);
        }
        .tt-lg-tab.is-active {
          background: #1E0734;
          color: #00DC7D;
          box-shadow: 0 4px 12px rgba(30, 7, 52, 0.2);
        }
        .tt-lg-tab.is-active.is-gold {
          color: #FDE68A;
        }
        .tt-lg-kicker {
          display: block;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #008A4E;
        }
        .tt-lg-indecopi-banner,
        .tt-lg-doc-hero {
          border-radius: 18px;
          padding: 14px;
          background: #FFFFFF;
          border: 1px solid rgba(30, 7, 52, 0.1);
          box-shadow: 0 6px 18px rgba(30, 7, 52, 0.05);
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .tt-lg-indecopi-banner {
          border-left: 4px solid #F59E0B;
        }
        .tt-lg-doc-hero {
          border-left: 4px solid #00B868;
        }
        .tt-lg-ib-text h3,
        .tt-lg-doc-hero h3 {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-size: 1.24rem;
          line-height: 1.08;
          color: #1E0734;
        }
        .tt-lg-ib-text p,
        .tt-lg-doc-hero p {
          margin: 4px 0 0;
          font-size: 0.76rem;
          line-height: 1.42;
          color: rgba(30, 7, 52, 0.72);
        }
        .tt-lg-form {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-lg-grid-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 520px) {
          .tt-lg-grid-2 {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-lg-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .tt-lg-field label {
          font-size: 0.73rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.78);
        }
        .tt-lg-input,
        .tt-lg-textarea {
          width: 100%;
          padding: 10px 13px;
          border-radius: 13px;
          background: #FFFFFF;
          border: 1.5px solid rgba(30, 7, 52, 0.14);
          color: #1E0734;
          font-size: 16px;
          font-weight: 600;
          font-family: inherit;
        }
        .tt-lg-input {
          min-height: 44px;
        }
        .tt-lg-textarea {
          resize: vertical;
          min-height: 92px;
        }
        .tt-lg-input:focus,
        .tt-lg-textarea:focus {
          outline: none;
          border-color: #00B868;
        }
        .tt-lg-choice-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .tt-lg-choice {
          min-height: 44px;
          border-radius: 12px;
          background: linear-gradient(180deg, #FFFFFF 0%, #EFEAF8 100%);
          border: 1.5px solid rgba(30, 7, 52, 0.18);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #C8BDDF;
          color: #1E0734;
          font-size: 0.78rem;
          font-weight: 800;
        }
        .tt-lg-choice.is-on {
          background: linear-gradient(180deg, #35115C 0%, #1E0734 100%);
          border-color: #1E0734;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 3px 0 #0D0218;
          color: #00DC7D;
        }
        .tt-lg-type-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-lg-type-card {
          padding: 11px;
          border-radius: 15px;
          background: linear-gradient(180deg, #FFFFFF 0%, #F4F0FA 100%);
          border: 1.5px solid rgba(30, 7, 52, 0.18);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #C8BDDF;
          color: #1E0734;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .tt-lg-type-card.is-on {
          background: linear-gradient(180deg, #35115C 0%, #1E0734 100%);
          border-color: #00DC7D;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 3px 0 #0D0218;
          color: #FAF9F5;
        }
        .tt-lg-type-card strong {
          font-size: 0.86rem;
        }
        .tt-lg-type-card small {
          font-size: 0.69rem;
          line-height: 1.32;
          opacity: 0.76;
        }
        .tt-lg-legal-note {
          margin: 2px 0;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(30, 7, 52, 0.05);
          font-size: 0.71rem;
          line-height: 1.42;
          color: rgba(30, 7, 52, 0.74);
        }
        .tt-lg-btn-primary {
          min-height: 46px;
          padding: 0 18px;
          border-radius: 14px;
          background: linear-gradient(180deg, #35115C 0%, #1E0734 100%);
          color: #00E582;
          border: 1.5px solid #1E0734;
          font-size: 0.84rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          text-decoration: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 4px 0 #0D0218, 0 10px 20px rgba(30, 7, 52, 0.22);
          transition: transform 115ms ease, box-shadow 115ms ease;
        }
        .tt-lg-btn-primary:active {
          transform: translateY(3px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 1px 0 #0D0218;
        }
        .tt-lg-btn-primary.is-muted {
          background: rgba(30, 7, 52, 0.16);
          border-color: transparent;
          color: rgba(30, 7, 52, 0.72);
          box-shadow: none;
        }
        .tt-lg-btn-primary.is-emerald-fill {
          background: linear-gradient(180deg, #24F499 0%, #00C96F 56%, #00A85B 100%);
          border-color: rgba(176, 255, 222, 0.8);
          color: #120321;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 4px 0 #00743F;
        }
        .tt-lg-btn-outline {
          min-height: 46px;
          padding: 0 16px;
          border-radius: 14px;
          background: linear-gradient(180deg, #FFFFFF 0%, #EFEAF8 100%);
          border: 1.5px solid rgba(30, 7, 52, 0.24);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #C8BDDF;
          color: #1E0734;
          font-size: 0.8rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          text-decoration: none;
          transition: transform 115ms ease, box-shadow 115ms ease;
        }
        .tt-lg-btn-outline:active {
          transform: translateY(3px);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 1px 0 #C8BDDF;
        }
        .tt-lg-btn-outline.is-dark-surface {
          background: linear-gradient(180deg, #35155C 0%, #21093E 100%);
          border-color: rgba(250, 249, 245, 0.35);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 0 #0D0218;
          color: #FAF9F5;
        }
        .tt-lg-receipt-card {
          border-radius: 20px;
          padding: 18px 15px;
          background: #FFFFFF;
          border: 1.5px solid #00B868;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
        }
        .tt-lg-rc-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.16);
          color: #008A4E;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.06em;
        }
        .tt-lg-rc-label {
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: rgba(30, 7, 52, 0.56);
        }
        .tt-lg-rc-code {
          padding: 8px 18px;
          border-radius: 14px;
          background: #1E0734;
          color: #00DC7D;
          font-family: var(--tt-font-display);
          font-size: 1.85rem;
          font-weight: 900;
          letter-spacing: 0.06em;
        }
        .tt-lg-rc-date {
          font-size: 0.72rem;
          color: rgba(30, 7, 52, 0.68);
        }
        .tt-lg-rc-summary {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          text-align: left;
          padding: 12px;
          border-radius: 14px;
          background: #FAF9F5;
        }
        .tt-lg-rc-summary span {
          display: block;
          font-size: 0.62rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.54);
        }
        .tt-lg-rc-summary strong {
          font-size: 0.78rem;
          color: #1E0734;
        }
        .tt-lg-rc-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }
        .tt-lg-reset-link {
          margin-top: 4px;
          font-size: 0.74rem;
          font-weight: 800;
          color: #008A4E;
          text-decoration: underline;
        }
        .tt-lg-clauses-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-lg-clause-card {
          border-radius: 17px;
          padding: 13px 14px;
          background: #FFFFFF;
          border: 1px solid rgba(30, 7, 52, 0.1);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-lg-cl-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-lg-cl-num {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #1E0734;
          color: #FDE68A;
          font-family: var(--tt-font-display);
          font-size: 1rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tt-lg-cl-num.is-emerald {
          color: #00DC7D;
        }
        .tt-lg-cl-head h4 {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 900;
          color: #1E0734;
        }
        .tt-lg-cl-head small {
          display: block;
          font-size: 0.7rem;
          color: #008A4E;
          font-weight: 700;
        }
        .tt-lg-clause-card p {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.5;
          color: rgba(30, 7, 52, 0.8);
        }
        .tt-lg-sbs-callout {
          padding: 13px;
          border-radius: 16px;
          background: #1E0734;
          color: #FAF9F5;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.76rem;
        }
        .tt-lg-sbs-callout p {
          margin: 3px 0 0;
          opacity: 0.82;
          line-height: 1.44;
        }
        .tt-lg-arco-card {
          border-radius: 18px;
          padding: 15px;
          background: linear-gradient(135deg, #250942 0%, #140324 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.35);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-lg-arco-top h4 {
          margin: 3px 0 0;
          font-family: var(--tt-font-display);
          font-size: 1.2rem;
        }
        .tt-lg-arco-top p {
          margin: 4px 0 0;
          font-size: 0.76rem;
          line-height: 1.44;
          opacity: 0.84;
        }
        .tt-lg-arco-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        @media (min-width: 520px) {
          .tt-lg-arco-actions {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-lg-footer {
          padding-top: 10px;
          border-top: 1px solid rgba(30, 7, 52, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.7rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.62);
        }
      `}</style>
    </ModalPortal>
  );
}
