
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, MapPin, Calendar, CheckCircle } from "lucide-react";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface Paciente {
  id: string;
  nomePaciente: string;
  leitoAtualPaciente: string;
  setorAtualPaciente: string;
  isolamentosAtivos?: any[];
}

interface Isolamento {
  id: string;
  nomeIsolamento: string;
  descricaoIsolamento?: string;
}

interface LeitoData {
  codigo?: string;
  [key: string]: any;
}

interface SetorData {
  sigla?: string;
  [key: string]: any;
}

interface ModalIncluirIsolamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModalIncluirIsolamento = ({ open, onOpenChange }: ModalIncluirIsolamentoProps) => {
  const [etapa, setEtapa] = useState<'selecionar-paciente' | 'selecionar-isolamentos'>('selecionar-paciente');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isolamentos, setIsolamentos] = useState<Isolamento[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [isolamentosSelecionados, setIsolamentosSelecionados] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carregar pacientes internados
  useEffect(() => {
    if (!open) return;

    const q = query(
      collection(db, 'pacientesRegulaFacil'),
      where('statusInternacao', '==', 'internado')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const pacientesData = await Promise.all(
          snapshot.docs.map(async (pacienteDoc) => {
            const pacienteData = pacienteDoc.data();

            // Buscar dados do leito e setor com tipagem adequada
            let leitoInfo = '';
            let setorInfo = '';

            if (pacienteData.leitoAtualPaciente) {
              const leitoDoc = await getDoc(pacienteData.leitoAtualPaciente);
              if (leitoDoc.exists()) {
                const leitoData = leitoDoc.data() as LeitoData;
                leitoInfo = leitoData?.codigo || '';
              }
            }

            if (pacienteData.setorAtualPaciente) {
              const setorDoc = await getDoc(pacienteData.setorAtualPaciente);
              if (setorDoc.exists()) {
                const setorData = setorDoc.data() as SetorData;
                setorInfo = setorData?.sigla || '';
              }
            }

            return {
              id: pacienteDoc.id,
              nomePaciente: pacienteData.nomePaciente || '',
              leitoAtualPaciente: leitoInfo,
              setorAtualPaciente: setorInfo,
              isolamentosAtivos: pacienteData.isolamentosAtivos || []
            };
          })
        );

        setPacientes(pacientesData);
      } catch (error) {
        console.error('Erro ao carregar pacientes:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar pacientes internados",
          variant: "destructive",
        });
      }
    });

    return () => unsubscribe();
  }, [open, toast]);

  // Carregar isolamentos disponíveis
  useEffect(() => {
    if (!open || etapa !== 'selecionar-isolamentos') return;

    const unsubscribe = onSnapshot(
      collection(db, 'isolamentosRegulaFacil'),
      (snapshot) => {
        const isolamentosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Isolamento[];
        setIsolamentos(isolamentosData);
      },
      (error) => {
        console.error('Erro ao carregar isolamentos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar isolamentos",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [open, etapa, toast]);

  // Filtrar pacientes pela busca
  const pacientesFiltrados = pacientes.filter(paciente =>
    paciente.nomePaciente.toLowerCase().includes(busca.toLowerCase()) ||
    paciente.leitoAtualPaciente.toLowerCase().includes(busca.toLowerCase())
  );

  const selecionarPaciente = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setEtapa('selecionar-isolamentos');
  };

  const voltarParaPacientes = () => {
    setEtapa('selecionar-paciente');
    setIsolamentosSelecionados([]);
  };

  const toggleIsolamento = (isolamentoId: string) => {
    setIsolamentosSelecionados(prev =>
      prev.includes(isolamentoId)
        ? prev.filter(id => id !== isolamentoId)
        : [...prev, isolamentoId]
    );
  };

  const salvarIsolamentos = async () => {
    if (!pacienteSelecionado || isolamentosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um isolamento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Obter isolamentos selecionados
      const isolamentosSelecionadosData = isolamentos.filter(iso => 
        isolamentosSelecionados.includes(iso.id)
      );

      // Preparar novos isolamentos para adicionar
      const novosIsolamentos = isolamentosSelecionadosData.map(iso => ({
        nomeIsolamento: iso.nomeIsolamento,
        dataInclusao: Timestamp.now()
      }));

      // Atualizar paciente
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteSelecionado.id);
      
      // Verificar isolamentos existentes para evitar duplicatas
      const isolamentosExistentes = pacienteSelecionado.isolamentosAtivos || [];
      const nomesExistentes = isolamentosExistentes.map((iso: any) => iso.nomeIsolamento);
      
      const isolamentosParaAdicionar = novosIsolamentos.filter(novo => 
        !nomesExistentes.includes(novo.nomeIsolamento)
      );

      if (isolamentosParaAdicionar.length === 0) {
        toast({
          title: "Aviso",
          description: "Todos os isolamentos selecionados já estão ativos para este paciente",
          variant: "default",
        });
        setLoading(false);
        return;
      }

      await updateDoc(pacienteRef, {
        isolamentosAtivos: [...isolamentosExistentes, ...isolamentosParaAdicionar]
      });

      // Gerar log na coleção de movimentações
      await addDoc(collection(db, 'movimentacoesRegulaFacil'), {
        tipo: "Inclusão de Isolamento",
        nomePaciente: pacienteSelecionado.nomePaciente,
        leitoAtualPaciente: pacienteSelecionado.leitoAtualPaciente,
        setorAtualPaciente: pacienteSelecionado.setorAtualPaciente,
        isolamentosIncluidos: isolamentosParaAdicionar.map(iso => iso.nomeIsolamento),
        dataHora: Timestamp.now()
      });

      toast({
        title: "Sucesso",
        description: `${isolamentosParaAdicionar.length} isolamento(s) incluído(s) com sucesso`,
      });

      // Fechar modal e resetar estados
      onOpenChange(false);
      setEtapa('selecionar-paciente');
      setPacienteSelecionado(null);
      setIsolamentosSelecionados([]);
      setBusca("");
    } catch (error) {
      console.error('Erro ao salvar isolamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar isolamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setEtapa('selecionar-paciente');
    setPacienteSelecionado(null);
    setIsolamentosSelecionados([]);
    setBusca("");
  };

  useEffect(() => {
    if (!open) {
      resetModal();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {etapa === 'selecionar-paciente' ? 'Selecionar Paciente' : 'Selecionar Isolamentos'}
          </DialogTitle>
          <DialogDescription>
            {etapa === 'selecionar-paciente' 
              ? 'Selecione o paciente para incluir em isolamento'
              : `Selecione os isolamentos para o paciente: ${pacienteSelecionado?.nomePaciente}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {etapa === 'selecionar-paciente' && (
            <>
              {/* Busca */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar Paciente</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome do paciente ou leito..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Lista de pacientes */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pacientesFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p>Nenhum paciente internado encontrado</p>
                  </div>
                ) : (
                  pacientesFiltrados.map((paciente) => (
                    <Card 
                      key={paciente.id} 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => selecionarPaciente(paciente)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{paciente.nomePaciente}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {paciente.leitoAtualPaciente} - {paciente.setorAtualPaciente}
                              </div>
                              {paciente.isolamentosAtivos && paciente.isolamentosAtivos.length > 0 && (
                                <Badge variant="outline">
                                  {paciente.isolamentosAtivos.length} isolamento(s) ativo(s)
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Selecionar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}

          {etapa === 'selecionar-isolamentos' && (
            <>
              {/* Paciente selecionado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Paciente Selecionado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{pacienteSelecionado?.nomePaciente}</h4>
                      <p className="text-sm text-muted-foreground">
                        {pacienteSelecionado?.leitoAtualPaciente} - {pacienteSelecionado?.setorAtualPaciente}
                      </p>
                    </div>
                    <Button variant="outline" onClick={voltarParaPacientes}>
                      Trocar Paciente
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Seleção de isolamentos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Isolamentos Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  {isolamentos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum isolamento cadastrado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {isolamentos.map((isolamento) => (
                        <div key={isolamento.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            id={isolamento.id}
                            checked={isolamentosSelecionados.includes(isolamento.id)}
                            onCheckedChange={() => toggleIsolamento(isolamento.id)}
                          />
                          <div className="flex-1">
                            <label htmlFor={isolamento.id} className="font-medium cursor-pointer">
                              {isolamento.nomeIsolamento}
                            </label>
                            {isolamento.descricaoIsolamento && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {isolamento.descricaoIsolamento}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Botões de ação */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={voltarParaPacientes}>
                  Voltar
                </Button>
                <Button 
                  onClick={salvarIsolamentos} 
                  disabled={loading || isolamentosSelecionados.length === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Isolamentos"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalIncluirIsolamento;
