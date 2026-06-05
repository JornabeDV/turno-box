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
    price: "$29.900",
    period: "/mes",
    features: [
      "Hasta 50 alumnos",
      "Reservas online",
      "Control de cupos",
      "Soporte por email",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49.900",
    period: "/mes",
    features: [
      "Alumnos ilimitados",
      "Sistema de créditos",
      "Historial de pagos",
      "Panel General de métricas",
      "Soporte prioritario",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Consultar",
    period: "",
    features: [
      "Múltiples sedes",
      "Integraciones API",
      "Onboarding personalizado",
      "Soporte 24/7",
    ],
    highlighted: false,
  },
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
