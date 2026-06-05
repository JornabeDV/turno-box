"use client";

import { useEffect } from "react";

/**
 * Registra el Service Worker manualmente como fallback.
 * Serwist debería hacerlo automáticamente en producción,
 * pero este componente asegura que /sw.js siempre se intente registrar.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Evitar registros duplicados
    if (window.__SW_REGISTERED__) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        window.__SW_REGISTERED__ = true;
        console.log("[SW] Service Worker registrado:", registration.scope);
      })
      .catch((err) => {
        console.warn("[SW] Falló el registro del Service Worker:", err);
      });
  }, []);

  return null;
}

declare global {
  interface Window {
    __SW_REGISTERED__?: boolean;
  }
}
