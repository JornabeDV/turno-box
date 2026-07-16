"use client";

import { Toaster } from "sonner";
import { useTheme } from "./useTheme";

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme}
      toastOptions={{
        style: {
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: "2px",
          color: "var(--text-primary)",
          fontFamily: "var(--font-oswald), system-ui, sans-serif",
        },
      }}
    />
  );
}
