import type { NextConfig } from "next";

// Configuração de compilação do Next.js; a aplicação continua sem backend.
const nextConfig: NextConfig = {
  // Usa a API do TypeScript no próprio processo durante o build.
  experimental: { useTypeScriptCli: false },
};

export default nextConfig;
