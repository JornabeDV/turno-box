"use client";

import { useState, useEffect } from "react";
import { BellIcon, BellSlashIcon } from "@phosphor-icons/react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  // Si ya hay uno listo, lo usamos
  const ready = await navigator.serviceWorker.ready.catch(() => null);
  if (ready?.active) return ready;

  // Si no, intentamos registrar /sw.js manualmente
  console.log("[PushToggle] Intentando registrar /sw.js manualmente...");
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.log("[PushToggle] Service Worker registrado:", reg.scope);
    // Esperamos a que esté listo
    const activated = await navigator.serviceWorker.ready;
    return activated;
  } catch (err) {
    console.error("[PushToggle] No se pudo registrar /sw.js:", err);
    return null;
  }
}

export function PushNotificationToggle() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasSw, setHasSw] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }

    const perm = Notification.permission as PermissionState;
    setPermission(perm);

    // Verificamos el estado real del SW y la suscripción push
    navigator.serviceWorker.ready
      .then((reg) => {
        setHasSw(!!reg.active);
        return reg.pushManager.getSubscription();
      })
      .then((sub) => setHasSubscription(!!sub))
      .catch(() => {
        setHasSw(false);
        setHasSubscription(false);
      });
  }, []);

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      // 1. Asegurar que el SW esté registrado
      const reg = await ensureServiceWorker();
      if (!reg?.active) {
        throw new Error(
          "No se pudo activar el Service Worker. Revisá en DevTools > Console si hay errores al cargar /sw.js"
        );
      }
      setHasSw(true);

      // 2. Suscribirse a push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ) as unknown as ArrayBuffer,
      });

      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      // 3. Guardar en el servidor
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error guardando la suscripción en el servidor");
      }

      setPermission("granted");
      setHasSubscription(true);
      setError(null);
    } catch (e) {
      console.error("[PushToggle] subscribe failed:", e);
      const message = e instanceof Error ? e.message : "Error desconocido";
      setError(message);
      setPermission(Notification.permission as PermissionState);
      setHasSubscription(false);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPermission("default");
      setHasSubscription(false);
    } catch (e) {
      console.error("[PushToggle] unsubscribe failed:", e);
      setError("Error al desactivar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }

  if (permission === "unsupported") return null;

  const isGranted = permission === "granted" && hasSubscription;
  const isDenied = permission === "denied";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 md:size-10 border border-[#1A4A63] bg-[#0A1F2A] flex items-center justify-center shrink-0">
            {isGranted ? (
              <BellIcon size={18} className="text-[#F78837]" weight="fill" />
            ) : (
              <BellSlashIcon size={18} className="text-[#4A6B7A]" weight="fill" />
            )}
          </div>
          <div>
            <p className="text-sm md:text-base font-medium text-[#EAEAEA] font-[family-name:var(--font-oswald)] uppercase tracking-tight">
              Notificaciones push
            </p>
            <p className="text-xs md:text-sm text-[#6B8A99] mt-0.5 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
              {isGranted
                ? "Activas en este dispositivo"
                : isDenied
                ? "Bloqueadas — habilitá desde ajustes del browser"
                : permission === "granted" && !hasSubscription
                ? "Permiso concedido pero sin suscripción activa"
                : "Recibí avisos del gym en tu celular"}
            </p>
          </div>
        </div>

        {!isDenied && (
          <button
            onClick={isGranted ? unsubscribe : subscribe}
            disabled={loading}
            className={[
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F78837]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isGranted ? "bg-[#F78837]" : "bg-[#1A4A63]",
            ].join(" ")}
            role="switch"
            aria-checked={isGranted}
          >
            <span
              className={[
                "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                isGranted ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        )}
      </div>

      {hasSw === false && (
        <p className="text-xs text-[#F78837]">
          ⚠️ No se detecta el Service Worker. Al activar el toggle se intentará registrar automáticamente.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400 font-[family-name:var(--font-jetbrains)]">
          {error}
        </p>
      )}
    </div>
  );
}
