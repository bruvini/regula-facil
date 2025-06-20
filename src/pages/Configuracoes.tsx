
import Layout from "@/components/Layout";
import { Settings } from "lucide-react";
import BlocoUsuarios from "@/components/configuracoes/BlocoUsuarios";

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
      </div>
    </Layout>
  );
};

export default Configuracoes;
