import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            gymId: true,
            image: true,
            isActive: true,
            gym: { select: { slug: true } },
          },
        });

        if (!user || !user.passwordHash || !user.isActive) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          gymId: user.gymId,
          gymSlug: user.gym?.slug ?? null,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    // Persiste role, gymId y gymSlug en el JWT
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.gymId = (user as { gymId: string | null }).gymId;
        token.gymSlug = (user as { gymSlug?: string | null }).gymSlug ?? null;
      }
      return token;
    },
    // Expone role, gymId y gymSlug en la session del cliente
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role as Role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).gymId = token.gymId as string | null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).gymSlug = token.gymSlug as string | null;
      }
      return session;
    },
  },
});
