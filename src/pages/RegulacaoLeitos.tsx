
import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import IndicadoresRegulacao from "@/components/regulacao-leitos/IndicadoresRegulacao";
import FiltrosRegulacao from "@/components/regulacao-leitos/FiltrosRegulacao";
import AcoesRegulacao from "@/components/regulacao-leitos/AcoesRegulacao";
import PacientesUTI from "@/components/regulacao-leitos/PacientesUTI";
import PacientesCirurgiaEletiva from "@/components/regulacao-leitos/PacientesCirurgiaEletiva";
import AlertasIsolamento from "@/components/regulacao-leitos/AlertasIsolamento";
import RegulacoesRemanejamentos from "@/components/regulacao-leitos/RegulacoesRemanejamentos";
import { useLoadingOverlay } from "@/hooks/useLoadingOverlay";
import { useState, useEffect } from "react";

const RegulacaoLeitos = () => {
  const { isLoading, setLoading } = useLoadingOverlay(true);
  const [componentsLoaded, setComponentsLoaded] = useState(0);
  const totalComponents = 6; // Total de componentes que precisam carregar

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLoading]);

  const handleComponentLoad = () => {
    setComponentsLoaded(prev => {
      const newCount = prev + 1;
      if (newCount >= totalComponents) {
        setLoading(false);
      }
      return newCount;
    });
  };

  return (
    <Layout>
      <LoadingOverlay isLoading={isLoading} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Regulação de Leitos</h1>
        </div>

        {/* Indicadores */}
        <IndicadoresRegulacao />

        {/* Filtros */}
        <FiltrosRegulacao />

        {/* Botões de Ação */}
        <AcoesRegulacao />

        {/* Pacientes Aguardando UTI */}
        <PacientesUTI />

        {/* Pacientes Aguardando Cirurgia Eletiva */}
        <PacientesCirurgiaEletiva />

        {/* Alertas de Isolamento */}
        <AlertasIsolamento />

        {/* Regulações e Remanejamentos */}
        <RegulacoesRemanejamentos />
      </div>
    </Layout>
  );
};

export default RegulacaoLeitos;
