import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo className="h-20" />
        </Link>
        <div className="card">
          <h1 className="text-center text-3xl">Bem-vindo(a)</h1>
          <p className="mt-1 text-center text-sm text-muted">Área do cliente e da equipe ArtBrown</p>
          <LoginForm next={typeof next === "string" ? next : ""} />
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Ainda não tem acesso? Fale com a equipe ArtBrown.
        </p>
      </div>
    </main>
  );
}
