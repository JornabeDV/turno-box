"use client";

import { useState, useEffect } from "react";
import { CaretDownIcon, AndroidLogoIcon, AppleLogoIcon, QuestionIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type OS = "android" | "ios" | "unknown";

function detectOS(): OS {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "unknown";
}

const STEPS_ANDROID = [
  {
    step: "1",
    title: "Instalá la app en tu celular",
    body: 'En Chrome, tocá el menú (⋮) → "Agregar a pantalla de inicio" → "Instalar". Si ya la tenés instalada, saltá este paso.',
  },
  {
    step: "2",
    title: "Activá las notificaciones",
    body: "Usá el toggle de arriba y aceptá el permiso cuando el celular te lo pida.",
  },
  {
    step: "3",
    title: "Permitir actividad en segundo plano",
    body: 'Ajustes del celular → Aplicaciones → Bee Box → Batería → "Sin restricciones". Esto permite recibir notificaciones aunque la app esté cerrada.',
  },
];

const STEPS_IOS = [
  {
    step: "1",
    title: "Abrí la app en Safari",
    body: "Las notificaciones push solo funcionan desde Safari en iOS. No uses Chrome ni otro browser.",
  },
  {
    step: "2",
    title: "Agregá la app al inicio",
    body: 'Tocá el botón compartir (□↑) → "Agregar a pantalla de inicio" → "Agregar".',
  },
  {
    step: "3",
    title: "Abrí la app desde el ícono",
    body: "Cerrá Safari y abrí Bee Box desde el ícono en tu pantalla de inicio. Esto es necesario para que las notificaciones funcionen.",
  },
  {
    step: "4",
    title: "Activá las notificaciones",
    body: "Usá el toggle de arriba y aceptá el permiso cuando aparezca. Requiere iOS 16.4 o superior.",
  },
];

export function PushNotificationHelp() {
  const [open, setOpen] = useState(false);
  const [os, setOs] = useState<OS>("unknown");

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const steps = os === "android" ? STEPS_ANDROID : os === "ios" ? STEPS_IOS : null;

  return (
    <div className="border-t border-white/[0.06] mt-4 pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-xs text-zinc-500">
          <QuestionIcon size={14} />
          ¿Cómo recibir notificaciones cuando la app está cerrada?
        </span>
        <CaretDownIcon
          size={14}
          className={cn(
            "text-zinc-600 transition-transform shrink-0",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
        <div className="mt-4 space-y-3">
          {/* Selector de OS si no se detectó */}
          {os === "unknown" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOs("android")}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
              >
                <AndroidLogoIcon size={14} /> Android
              </button>
              <button
                type="button"
                onClick={() => setOs("ios")}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
              >
                <AppleLogoIcon size={14} /> iPhone / iPad
              </button>
            </div>
          )}

          {/* Badge de OS detectado */}
          {os !== "unknown" && (
            <div className="flex items-center gap-1.5">
              {os === "android"
                ? <AndroidLogoIcon size={13} className="text-zinc-500" />
                : <AppleLogoIcon size={13} className="text-zinc-500" />
              }
              <span className="text-[11px] text-zinc-500">
                {os === "android" ? "Instrucciones para Android" : "Instrucciones para iPhone / iPad"}
              </span>
              <button
                type="button"
                onClick={() => setOs("unknown")}
                className="ml-auto text-[11px] text-zinc-600 underline underline-offset-2"
              >
                cambiar
              </button>
            </div>
          )}

          {/* Pasos */}
          {steps && (
            <ol className="space-y-3">
              {steps.map((s) => (
                <li key={s.step} className="flex gap-3">
                  <span className="size-5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{s.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
