export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Excluir webhooks, archivos estáticos y rutas de Next.js internos
    "/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)",
  ],
};
