
import { useState, useMemo } from 'react';
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMapaLeitos } from '@/hooks/useMapaLeitos';
import FiltrosMapaLeitos from '@/components/mapa-leitos/FiltrosMapaLeitos';
import CardLeito from '@/components/mapa-leitos/CardLeito';
import { LeitoWithData } from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';

const MapaLeitos = () => {
  const { leitos, setores, loading, error, atualizarStatusLeito } = useMapaLeitos();
  const { toast } = useToast();
  
  const [filtros, setFiltros] = useState({
    busca: '',
    setorSelecionado: 'todos',
    statusSelecionados: [] as string[],
    tipoLeito: 'todos',
    apenasPC: false
  });

  // Filtrar leitos
  const leitosFiltrados = useMemo(() => {
    return leitos.filter((leito) => {
      // Filtro de busca
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        const matchCodigo = leito.codigo.toLowerCase().includes(busca);
        const matchSetor = leito.setorData?.sigla.toLowerCase().includes(busca) || 
                          leito.setorData?.nomeCompleto.toLowerCase().includes(busca);
        const matchStatus = leito.status.toLowerCase().includes(busca);
        
        if (!matchCodigo && !matchSetor && !matchStatus) {
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
          // TODO: Implementar modal de regulação
          toast({
            title: "Funcionalidade em desenvolvimento",
            description: "A regulação de pacientes será implementada em breve."
          });
          break;
        
        case 'bloquear':
          await atualizarStatusLeito(leitoId, 'bloqueado', 'Bloqueado pelo usuário');
          toast({
            title: "Leito bloqueado",
            description: "O leito foi bloqueado com sucesso."
          });
          break;
        
        case 'alta':
          await atualizarStatusLeito(leitoId, 'limpeza');
          toast({
            title: "Alta realizada",
            description: "Paciente recebeu alta e leito liberado para limpeza."
          });
          break;
        
        case 'remanejar':
          // TODO: Implementar modal de remanejamento
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
          // TODO: Implementar modal de detalhes
          toast({
            title: "Funcionalidade em desenvolvimento",
            description: "Os detalhes do paciente serão exibidos em breve."
          });
          break;
        
        case 'editarMotivo':
          // TODO: Implementar modal de edição de motivo
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

  const handleGerenciarSetores = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O gerenciamento de setores será implementado em breve."
    });
  };

  const handleGerenciarLeitos = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O gerenciamento de leitos será implementado em breve."
    });
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

        <FiltrosMapaLeitos
          setores={setores}
          filtros={filtros}
          onFiltroChange={setFiltros}
          onGerenciarSetores={handleGerenciarSetores}
          onGerenciarLeitos={handleGerenciarLeitos}
        />

        {leitosPorSetor.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">
                Nenhum leito encontrado com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {leitosPorSetor.map((grupo) => (
              <Card key={grupo.setor.id || 'sem-setor'} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <span className="text-xl">{grupo.setor.sigla}</span>
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        {grupo.setor.nomeCompleto}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {grupo.leitos.length} leitos
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {grupo.leitos.map((leito) => (
                      <CardLeito
                        key={leito.id}
                        leito={leito}
                        onAcao={handleAcaoLeito}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MapaLeitos;
