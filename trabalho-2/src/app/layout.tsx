import type { Metadata } from "next";
import "./globals.css";

// Metadados usados pelo Next.js no título e na descrição da página.
export const metadata: Metadata = {
  title: "Simulador de GLC: Exercício 3",
  description: "Gramática livre de contexto, Forma Normal de Chomsky e árvore de derivação.",
};

/** Estrutura HTML comum da aplicação; marca o conteúdo como português brasileiro. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
