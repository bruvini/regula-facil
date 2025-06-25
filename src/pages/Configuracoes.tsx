
import Layout from "@/components/Layout";
import { Settings } from "lucide-react";
import BlocoUsuarios from "@/components/configuracoes/BlocoUsuarios";
import BlocoPCP from "@/components/configuracoes/BlocoPCP";
import BlocoResetBanco from "@/components/configuracoes/BlocoResetBanco";
import BlocoCache from "@/components/configuracoes/BlocoCache";

const Configuracoes = () => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Título da página */}
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>

        {/* Bloco de Usuários */}
        <BlocoUsuarios />

        {/* Bloco de PCP */}
        <BlocoPCP />

        {/* Bloco de Reset do Banco de Dados */}
        <BlocoResetBanco />

        {/* Bloco de Limpeza de Cache */}
        <BlocoCache />
      </div>
    </Layout>
  );
};

export default Configuracoes;
