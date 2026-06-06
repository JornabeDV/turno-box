const WHATSAPP_NUMBER = "5492644366369";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hola, vi BoxTurno y quiero probarlo para mi gimnasio. ¿Me podrían dar más info?"
);

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

export const FEATURES = [
  {
    iconName: "CalendarCheck",
    title: "Reservas online 24/7",
    desc: "Tus alumnos reservan desde la app. Vos solo ves quién viene.",
  },
  {
    iconName: "Coins",
    title: "Créditos y packs",
    desc: "Vendé packs de clases. El sistema descuenta automáticamente.",
  },
  {
    iconName: "Users",
    title: "Control de cupos",
    desc: "Sabés en todo momento cuántos lugares quedan libres.",
  },
  {
    iconName: "Gear",
    title: "Panel General de admin",
    desc: "Gestión completa de alumnos, clases, profesores y actividades.",
  },
  {
    iconName: "Bell",
    title: "Notificaciones",
    desc: "Avisos automáticos de reservas, cancelaciones y vencimientos.",
  },
  {
    iconName: "Receipt",
    title: "Pagos y abonos",
    desc: "Historial completo de pagos, carga manual y seguimiento de deudas.",
  },
] as const;

export const PLANS = [
  {
    name: "Starter",
    price: "Consultar",
    period: "/mes",
    tagline: "Ideal para boxes en crecimiento",
    features: [
      "Hasta 50 alumnos",
      "Reservas online 24/7",
      "Control de cupos",
      "2 disciplinas + 2 coaches",
      "Gestión de alumnos",
      "Soporte por WhatsApp",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Consultar",
    period: "/mes",
    tagline: "Para boxes que facturan",
    features: [
      "Hasta 500 alumnos",
      "Todo lo de Starter",
      "Múltiples disciplinas y coaches",
      "Sistema de créditos (packs + vencimiento)",
      "Pagos con MercadoPago",
      "Panel de métricas",
      "Waitlist automático",
      "Notificaciones push",
      "Soporte prioritario",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Consultar",
    period: "",
    tagline: "Para cadenas y franquicias",
    features: [
      "Alumnos ilimitados",
      "Todo lo de Pro",
      "Importación masiva de alumnos",
      "Onboarding personalizado",
      "API e integraciones (próximamente)",
      "Múltiples sedes (próximamente)",
      "Soporte 24/7",
    ],
    highlighted: false,
  },
] as const;

export const PLAN_COMPARISON = [
  { feature: "Alumnos", starter: "Hasta 50", pro: "Hasta 500", enterprise: "Ilimitados" },
  { feature: "Reservas online 24/7", starter: true, pro: true, enterprise: true },
  { feature: "Control de cupos por clase", starter: true, pro: true, enterprise: true },
  { feature: "Gestión de alumnos", starter: true, pro: true, enterprise: true },
  { feature: "Disciplinas", starter: "3", pro: "Ilimitadas", enterprise: "Ilimitadas" },
  { feature: "Coaches", starter: "3", pro: "Ilimitados", enterprise: "Ilimitados" },
  { feature: "Waitlist automático", starter: false, pro: true, enterprise: true },
  { feature: "Sistema de créditos (packs + vencimiento)", starter: false, pro: true, enterprise: true },
  { feature: "Pagos con MercadoPago", starter: false, pro: true, enterprise: true },
  { feature: "Historial de pagos completo", starter: false, pro: true, enterprise: true },
  { feature: "Panel de métricas", starter: false, pro: true, enterprise: true },
  { feature: "Notificaciones push", starter: false, pro: true, enterprise: true },
  { feature: "Recordatorios automáticos", starter: false, pro: true, enterprise: true },
  { feature: "Importación masiva de alumnos", starter: false, pro: false, enterprise: true },
  { feature: "Onboarding personalizado", starter: false, pro: false, enterprise: true },
  { feature: "API e integraciones", starter: false, pro: false, enterprise: "Próximamente" },
  { feature: "Múltiples sedes", starter: false, pro: false, enterprise: "Próximamente" },
  { feature: "Soporte", starter: "WhatsApp", pro: "Prioritario", enterprise: "24/7" },
] as const;

export const FAQ_ITEMS = [
  {
    q: "¿Necesito tarjeta de crédito para probarlo?",
    a: "No. Tenés 14 días de prueba gratis sin necesidad de agregar un método de pago.",
  },
  {
    q: "¿Puedo migrar mis alumnos actuales?",
    a: "Sí. Te ayudamos a importar tu lista de alumnos desde Excel para que no empieces de cero.",
  },
  {
    q: "¿Los alumnos necesitan pagar algo?",
    a: "No. La app es gratuita para tus alumnos. Solo el gimnasio paga la suscripción.",
  },
  {
    q: "¿Funciona si mi gimnasio es pequeño?",
    a: "Absolutamente. El plan Starter está pensado para gimnasios en crecimiento con hasta 50 alumnos.",
  },
] as const;
