import type { Metadata } from "next";
import "./globals.css";

// Metadados usados pelo Next.js no título e na descrição da página.
export const metadata: Metadata = {
  title: "Simulador de Autômato: Exercício 6",
  description: "Conversão de AFND-ε para AFD e reconhecimento de sentenças.",
};

/** Estrutura HTML comum da aplicação; marca o conteúdo como português brasileiro. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
