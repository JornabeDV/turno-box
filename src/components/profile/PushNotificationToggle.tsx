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

export function PushNotificationToggle() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
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

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      setPermission("granted");
    } catch {
      setPermission(Notification.permission as PermissionState);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  if (permission === "unsupported") return null;

  const isGranted = permission === "granted";
  const isDenied = permission === "denied";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="size-9 border border-[#1A4A63] bg-[#0A1F2A] flex items-center justify-center shrink-0">
          {isGranted ? (
            <BellIcon size={18} className="text-[#F78837]" weight="fill" />
          ) : (
            <BellSlashIcon size={18} className="text-[#4A6B7A]" weight="fill" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-[#EAEAEA] font-[family-name:var(--font-oswald)] uppercase tracking-tight">
            Notificaciones push
          </p>
          <p className="text-xs text-[#6B8A99] mt-0.5 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
            {isGranted
              ? "Activas en este dispositivo"
              : isDenied
              ? "Bloqueadas — habilitá desde ajustes del browser"
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
  );
}
