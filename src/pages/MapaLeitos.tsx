
import { useState, useMemo } from 'react';
import Layout from "@/components/Layout";
import { Card, CardContent } from '@/components/ui/card';
import { useMapaLeitos } from '@/hooks/useMapaLeitos';
import IndicadoresBar from '@/components/mapa-leitos/IndicadoresBar';
import FiltrosLeitos from '@/components/mapa-leitos/FiltrosLeitos';
import FiltrosAvancados from '@/components/mapa-leitos/FiltrosAvancados';
import GridLeitosPorSetor from '@/components/mapa-leitos/GridLeitosPorSetor';
import ModalGerenciamento from '@/components/mapa-leitos/ModalGerenciamento';
import ModalRegulacaoPaciente from '@/components/mapa-leitos/ModalRegulacaoPaciente';
import ModalBloquearLeito from '@/components/mapa-leitos/ModalBloquearLeito';
import { LeitoWithData } from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';

const MapaLeitos = () => {
  const { 
    leitos, 
    setores, 
    isolamentoTipos,
    loading, 
    error, 
    atualizarStatusLeito,
    bloquearLeito,
    regularPaciente,
    adicionarSetor, 
    editarSetor,
    excluirSetor,
    adicionarLeito,
    editarLeito,
    excluirLeito,
    adicionarLeitosEmLote,
    verificarPacientesAguardandoRegulacao
  } = useMapaLeitos();
  const { toast } = useToast();
  
  const [filtros, setFiltros] = useState({
    busca: '',
    setorSelecionado: 'todos',
    statusSelecionados: [] as string[],
    tipoLeito: 'todos',
    apenasPC: false,
    isolamento: [] as string[],
    tempoMinimoStatus: 0,
    sexoPaciente: 'todos'
  });

  const [filtrosAvancadosAbertos, setFiltrosAvancadosAbertos] = useState(false);
  const [modalGerenciamentoAberto, setModalGerenciamentoAberto] = useState(false);
  const [modalRegulacaoAberto, setModalRegulacaoAberto] = useState(false);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [leitoSelecionado, setLeitoSelecionado] = useState<string>('');

  // Filtrar leitos
  const leitosFiltrados = useMemo(() => {
    return leitos.filter((leito) => {
      // Filtro de busca
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        const matchCodigo = leito.codigo.toLowerCase().includes(busca);
        const matchSetor = leito.setorData?.sigla.toLowerCase().includes(busca) || 
                          leito.setorData?.nomeCompleto.toLowerCase().includes(busca);
        const matchPaciente = leito.pacienteData?.nome.toLowerCase().includes(busca);
        
        if (!matchCodigo && !matchSetor && !matchPaciente) {
          return false;
        }
      }

      // Filtro de setor
      if (filtros.setorSelecionado !== 'todos' && leito.setorData?.id !== filtros.setorSelecionado) {
        return false;
      }

      // Filtro de status
      if (filtros.statusSelecionados.length > 0 && !filtros.statusSelecionados.includes(leito.status)) {
        return false;
      }

      // Filtro de tipo
      if (filtros.tipoLeito !== 'todos' && leito.tipo !== filtros.tipoLeito) {
        return false;
      }

      // Filtro PCP
      if (filtros.apenasPC && !leito.ehPCP) {
        return false;
      }

      // Filtro de isolamento (updated for multiple selection)
      if (filtros.isolamento.length > 0) {
        const temIsolamento = leito.pacienteData?.isolamentosAtivos?.some(iso => {
          // This would need proper isolation type checking when resolved from database
          return true; // Placeholder
        });
        if (!temIsolamento) {
          return false;
        }
      }

      // Filtro de tempo mínimo no status
      if (filtros.tempoMinimoStatus > 0) {
        const tempoAtualMs = Date.now() - leito.dataUltimaAtualizacaoStatus.toMillis();
        const tempoAtualMinutos = tempoAtualMs / (1000 * 60);
        if (tempoAtualMinutos < filtros.tempoMinimoStatus) {
          return false;
        }
      }

      // Filtro de sexo do paciente
      if (filtros.sexoPaciente !== 'todos' && leito.pacienteData?.sexo !== filtros.sexoPaciente) {
        return false;
      }

      return true;
    });
  }, [leitos, filtros]);

  // Agrupar leitos por setor
  const leitosPorSetor = useMemo(() => {
    const grupos: { [key: string]: { setor: any; leitos: LeitoWithData[] } } = {};
    
    leitosFiltrados.forEach((leito) => {
      const setorKey = leito.setorData?.id || 'sem-setor';
      if (!grupos[setorKey]) {
        grupos[setorKey] = {
          setor: leito.setorData || { sigla: 'Sem Setor', nomeCompleto: 'Leitos sem setor definido' },
          leitos: []
        };
      }
      grupos[setorKey].leitos.push(leito);
    });

    return Object.values(grupos);
  }, [leitosFiltrados]);

  const handleAcaoLeito = async (acao: string, leitoId: string) => {
    try {
      switch (acao) {
        case 'regular':
          // Verificar se há pacientes aguardando regulação antes de abrir o modal
          const temPacientes = await verificarPacientesAguardandoRegulacao();
          if (!temPacientes) {
            toast({
              title: "Nenhum paciente aguardando regulação no momento.",
              description: "Não há pacientes internados com regulação pendente."
            });
            return;
          }
          setLeitoSelecionado(leitoId);
          setModalRegulacaoAberto(true);
          break;
        
        case 'bloquear':
          setLeitoSelecionado(leitoId);
          setModalBloqueioAberto(true);
          break;
        
        case 'alta':
          await atualizarStatusLeito(leitoId, 'limpeza');
          toast({
            title: "Alta realizada",
            description: "Paciente recebeu alta e leito liberado para limpeza."
          });
          break;
        
        case 'remanejar':
          toast({
            title: "Funcionalidade em desenvolvimento",
            description: "O remanejamento será implementado em breve."
          });
          break;
        
        case 'ocupar':
          await atualizarStatusLeito(leitoId, 'ocupado');
          toast({
            title: "Leito ocupado",
            description: "O leito foi marcado como ocupado."
          });
          break;
        
        case 'cancelarReserva':
          await atualizarStatusLeito(leitoId, 'vago');
          toast({
            title: "Reserva cancelada",
            description: "A reserva foi cancelada e o leito liberado."
          });
          break;
        
        case 'liberar':
          await atualizarStatusLeito(leitoId, 'vago');
          toast({
            title: "Leito liberado",
            description: "O leito foi liberado e está disponível."
          });
          break;
        
        case 'detalhes':
          toast({
            title: "Funcionalidade em desenvolvimento",
            description: "Os detalhes do paciente serão exibidos em breve."
          });
          break;
        
        case 'editarMotivo':
          toast({
            title: "Funcionalidade em desenvolvimento",
            description: "A edição de motivo será implementada em breve."
          });
          break;
        
        default:
          console.warn('Ação não reconhecida:', acao);
      }
    } catch (err) {
      console.error('Erro ao executar ação:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao executar a ação.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg">Carregando mapa de leitos...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-red-500">Erro: {error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Mapa de Leitos</h1>
            <p className="text-muted-foreground">
              Visualização em tempo real da ocupação de leitos hospitalares
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {leitosFiltrados.length} leitos
          </div>
        </div>

        <IndicadoresBar leitos={leitosFiltrados} />

        <Card className="mb-6">
          <CardContent className="p-4">
            <FiltrosLeitos
              busca={filtros.busca}
              onBuscaChange={(busca) => setFiltros({ ...filtros, busca })}
              setorSelecionado={filtros.setorSelecionado}
              onSetorChange={(setor) => setFiltros({ ...filtros, setorSelecionado: setor })}
              setores={setores}
              filtrosAvancadosAbertos={filtrosAvancadosAbertos}
              onToggleFiltrosAvancados={() => setFiltrosAvancadosAbertos(!filtrosAvancadosAbertos)}
              onAbrirModal={() => setModalGerenciamentoAberto(true)}
            />

            <FiltrosAvancados
              aberto={filtrosAvancadosAbertos}
              isolamentoTipos={isolamentoTipos}
              filtros={filtros}
              onFiltroChange={setFiltros}
            />
          </CardContent>
        </Card>

        <ModalGerenciamento
          aberto={modalGerenciamentoAberto}
          onFechar={() => setModalGerenciamentoAberto(false)}
          setores={setores}
          leitos={leitos}
          onAdicionarSetor={adicionarSetor}
          onEditarSetor={editarSetor}
          onExcluirSetor={excluirSetor}
          onAdicionarLeito={adicionarLeito}
          onEditarLeito={editarLeito}
          onExcluirLeito={excluirLeito}
          onAdicionarLeitosLote={adicionarLeitosEmLote}
        />

        <ModalRegulacaoPaciente
          aberto={modalRegulacaoAberto}
          onFechar={() => setModalRegulacaoAberto(false)}
          leitoId={leitoSelecionado}
          onRegular={regularPaciente}
        />

        <ModalBloquearLeito
          aberto={modalBloqueioAberto}
          onFechar={() => setModalBloqueioAberto(false)}
          leitoId={leitoSelecionado}
          onBloquear={bloquearLeito}
        />

        <GridLeitosPorSetor
          leitosPorSetor={leitosPorSetor}
          onAcaoLeito={handleAcaoLeito}
        />
      </div>
    </Layout>
  );
};

export default MapaLeitos;
