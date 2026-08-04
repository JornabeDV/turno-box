import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "COACH" | "STUDENT";

export default {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize() {
        // El login real se implementa en lib/auth.ts (Node runtime).
        // Esta configuración se usa solo en el middleware (edge runtime)
        // para verificar el JWT, no para autenticar credenciales.
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.gymId = (user as { gymId: string | null }).gymId;
        token.gymSlug = (user as { gymSlug?: string | null }).gymSlug ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role as UserRole;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).gymId = token.gymId as string | null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).gymSlug = token.gymSlug as string | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
