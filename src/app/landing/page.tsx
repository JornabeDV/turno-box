import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { Features } from "@/components/landing/Features";
import { Demo } from "@/components/landing/Demo";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "TurnoBox — Gestión inteligente para boxes de CrossFit",
  description:
    "Dejá de administrar tu box con WhatsApp y Excel. Turnos, pagos, cupos y alumnos. Todo en una sola app.",
};

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0A1F2A]">
      <Navbar />
      <Hero />
      <TrustBar />
      <ProblemSolution />
      <Features />
      <Demo />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
