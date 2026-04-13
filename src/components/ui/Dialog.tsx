"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Ancho del panel. Default: "sm" */
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal forceMount>
        <AnimatePresence>
          {open && (
            <>
              {/* Overlay */}
              <RadixDialog.Overlay asChild>
                <motion.div
                  className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              </RadixDialog.Overlay>

              {/* Panel */}
              <RadixDialog.Content asChild>
                <motion.div
                  className={cn(
                    "fixed left-1/2 top-1/2 z-50 max-md:h-full max-md:w-full md:w-[calc(100vw-2rem)]",
                    sizeClass[size],
                    "glass-card md:rounded-2xl p-6 shadow-2xl",
                    "focus:outline-none",
                  )}
                  initial={{ opacity: 0, x: "-50%", y: "-46%", scale: 0.97 }}
                  animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                  exit={{ opacity: 0, x: "-50%", y: "-46%", scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between md:mb-5">
                    <div>
                      <RadixDialog.Title className="text-base font-semibold text-zinc-100">
                        {title}
                      </RadixDialog.Title>
                      {description && (
                        <RadixDialog.Description className="text-sm text-zinc-500 mt-0.5">
                          {description}
                        </RadixDialog.Description>
                      )}
                    </div>
                    <RadixDialog.Close className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                      <XIcon size={16} />
                    </RadixDialog.Close>
                  </div>

                  {children}
                </motion.div>
              </RadixDialog.Content>
            </>
          )}
        </AnimatePresence>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
