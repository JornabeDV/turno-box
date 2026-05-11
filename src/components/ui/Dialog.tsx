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
  size?: "sm" | "md" | "lg";
  className?: string;
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
  className,
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
                  className="fixed inset-0 z-50 bg-black/80"
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
                    "fixed left-1/2 top-1/2 z-50 max-md:w-full md:w-[calc(100vw-2rem)]",
                    sizeClass[size],
                    className,
                    "bg-[#0E2A38] border border-[#1A4A63] p-6 shadow-2xl",
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
                      <RadixDialog.Title className="text-base font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight">
                        {title}
                      </RadixDialog.Title>
                      {description && (
                        <RadixDialog.Description className="text-sm text-[#6B8A99] mt-0.5 font-[family-name:var(--font-oswald)]">
                          {description}
                        </RadixDialog.Description>
                      )}
                    </div>
                    <RadixDialog.Close className="p-1.5 text-[#4A6B7A] hover:text-[#EAEAEA] hover:bg-[#143D52] transition-colors">
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
