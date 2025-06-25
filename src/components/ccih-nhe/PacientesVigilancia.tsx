
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, Timestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RegraLiberacao {
  textoRegra: string;
  operadorLogico: 'E' | 'OU' | null;
}

interface IsolamentoRegulaFacil {
  id: string;
  nomeIsolamento: string;
  regrasLiberacaoIsolamento?: RegraLiberacao[];
}

interface Isolamento {
  nomeIsolamento: string;
  dataInclusao: any;
}

interface PacienteVigilancia {
  id: string;
  nomePaciente: string;
  leitoAtual?: string;
  setorAtual?: string;
  statusInternacao: string;
  isolamentosAtivos: Isolamento[];
}

const PacientesVigilancia = () => {
  const [pacientes, setPacientes] = useState<PacienteVigilancia[]>([]);
  const [isolamentosRegulaFacil, setIsolamentosRegulaFacil] = useState<IsolamentoRegulaFacil[]>([]);
  const [regrasChecadas, setRegrasChecadas] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Carregar isolamentos da coleção regulaFacil
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'isolamentosRegulaFacil'),
      (snapshot) => {
        const isolamentosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as IsolamentoRegulaFacil[];
        setIsolamentosRegulaFacil(isolamentosData);
      },
      (error) => {
        console.error('Erro ao carregar isolamentos:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Carregar pacientes internados com isolamentos ativos
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'pacientesRegulaFacil'),
      (snapshot) => {
        const pacientesData: PacienteVigilancia[] = [];
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (
            data.statusInternacao === 'internado' && 
            data.isolamentosAtivos && 
            Array.isArray(data.isolamentosAtivos) && 
            data.isolamentosAtivos.length > 0
          ) {
            pacientesData.push({
              id: doc.id,
              nomePaciente: data.nomePaciente || 'Nome não informado',
              leitoAtual: data.leitoAtual || data.leitoAtualPaciente,
              setorAtual: data.setorAtual || data.setorAtualPaciente,
              statusInternacao: data.statusInternacao,
              isolamentosAtivos: data.isolamentosAtivos
            });
          }
        });
        
        setPacientes(pacientesData);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar pacientes em vigilância:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Carregar estados dos checkboxes do Firestore
  useEffect(() => {
    if (pacientes.length > 0) {
      const carregarRegrasChecadas = async () => {
        const regrasCarregadas: {[key: string]: boolean} = {};
        
        for (const paciente of pacientes) {
          for (const isolamento of paciente.isolamentosAtivos) {
            try {
              const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
              const pacienteDoc = await pacienteRef.get();
              
              if (pacienteDoc.exists()) {
                const dados = pacienteDoc.data();
                const regrasStorage = dados[`regrasChecadas_${isolamento.nomeIsolamento}`];
                
                if (regrasStorage) {
                  Object.assign(regrasCarregadas, regrasStorage);
                }
              }
            } catch (error) {
              console.error('Erro ao carregar regras checadas:', error);
            }
          }
        }
        
        setRegrasChecadas(regrasCarregadas);
      };
      
      carregarRegrasChecadas();
    }
  }, [pacientes]);

  // Salvar estados dos checkboxes no Firestore
  const salvarRegrasChecadas = async (pacienteId: string, nomeIsolamento: string, novasRegras: {[key: string]: boolean}) => {
    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        [`regrasChecadas_${nomeIsolamento}`]: novasRegras
      });
      
      setRegrasChecadas(prevRegras => ({ ...prevRegras, ...novasRegras }));
    } catch (error) {
      console.error('Erro ao salvar regras checadas:', error);
    }
  };

  const calcularTempoIsolamento = (dataInclusao: any) => {
    if (!dataInclusao) return 'Data não informada';
    
    const agora = new Date();
    const dataInicio = dataInclusao.toDate ? dataInclusao.toDate() : new Date(dataInclusao);
    const diffMs = agora.getTime() - dataInicio.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHoras = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDias > 0) {
      return `há ${diffDias} dia${diffDias > 1 ? 's' : ''} e ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    } else {
      return `há ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    }
  };

  const obterRegrasIsolamento = (nomeIsolamento: string): RegraLiberacao[] => {
    const isolamento = isolamentosRegulaFacil.find(iso => iso.nomeIsolamento === nomeIsolamento);
    return isolamento?.regrasLiberacaoIsolamento || [];
  };

  const gerarChaveRegra = (pacienteId: string, nomeIsolamento: string, indiceRegra: number) => {
    return `${pacienteId}_${nomeIsolamento}_${indiceRegra}`;
  };

  const handleToggleRegra = async (pacienteId: string, nomeIsolamento: string, chaveRegra: string, checked: boolean) => {
    const regras = obterRegrasIsolamento(nomeIsolamento);
    const novasRegras = { ...regrasChecadas, [chaveRegra]: checked };
    
    // Criar objeto com apenas as regras deste isolamento para salvar no Firestore
    const regrasIsolamento: {[key: string]: boolean} = {};
    regras.forEach((_, index) => {
      const chave = gerarChaveRegra(pacienteId, nomeIsolamento, index);
      regrasIsolamento[chave] = novasRegras[chave] || false;
    });
    
    await salvarRegrasChecadas(pacienteId, nomeIsolamento, regrasIsolamento);
  };

  const verificarRegrasAtendidas = (pacienteId: string, nomeIsolamento: string, regras: RegraLiberacao[]): boolean => {
    if (regras.length === 0) return true;

    // Verificar se há pelo menos uma regra "OU"
    const temRegraOU = regras.some(regra => regra.operadorLogico === 'OU');
    
    if (temRegraOU) {
      // Se há regras "OU", basta uma estar marcada
      return regras.some((regra, index) => {
        const chaveRegra = gerarChaveRegra(pacienteId, nomeIsolamento, index);
        return regrasChecadas[chaveRegra] === true;
      });
    } else {
      // Se só há regras "E" (ou sem operador), todas devem estar marcadas
      return regras.every((regra, index) => {
        const chaveRegra = gerarChaveRegra(pacienteId, nomeIsolamento, index);
        return regrasChecadas[chaveRegra] === true;
      });
    }
  };

  const obterRegrasCumpridas = (pacienteId: string, nomeIsolamento: string, regras: RegraLiberacao[]): string[] => {
    return regras.filter((regra, index) => {
      const chaveRegra = gerarChaveRegra(pacienteId, nomeIsolamento, index);
      return regrasChecadas[chaveRegra] === true;
    }).map(regra => regra.textoRegra);
  };

  const removerIsolamento = async (pacienteId: string, nomePaciente: string, nomeIsolamento: string) => {
    try {
      const paciente = pacientes.find(p => p.id === pacienteId);
      if (!paciente) return;

      const regras = obterRegrasIsolamento(nomeIsolamento);
      const regrasCumpridas = obterRegrasCumpridas(pacienteId, nomeIsolamento, regras);

      // Remover o isolamento específico do array
      const isolamentosAtualizados = paciente.isolamentosAtivos.filter(
        iso => iso.nomeIsolamento !== nomeIsolamento
      );

      // Atualizar o documento do paciente
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        isolamentosAtivos: isolamentosAtualizados,
        [`regrasChecadas_${nomeIsolamento}`]: null // Limpar regras salvas
      });

      // Registrar log de movimentação detalhado
      const descricaoLog = `Paciente ${nomePaciente} teve o isolamento ${nomeIsolamento} removido em ${new Date().toLocaleString('pt-BR')}. Regras cumpridas: ${regrasCumpridas.length > 0 ? regrasCumpridas.join(', ') : 'Nenhuma regra específica'}.`;

      await addDoc(collection(db, 'movimentacoesRegulaFacil'), {
        tipo: 'Remoção de Isolamento',
        descricao: descricaoLog,
        nomePaciente,
        isolamentoRemovido: nomeIsolamento,
        regrasCumpridas,
        dataHora: Timestamp.now()
      });

      // Limpar regras checadas para este isolamento do estado local
      const novasRegras = { ...regrasChecadas };
      regras.forEach((_, index) => {
        const chaveRegra = gerarChaveRegra(pacienteId, nomeIsolamento, index);
        delete novasRegras[chaveRegra];
      });
      setRegrasChecadas(novasRegras);

      toast({
        title: "Isolamento removido",
        description: `O isolamento ${nomeIsolamento} foi removido do paciente ${nomePaciente}.`,
        duration: 3000
      });

    } catch (error) {
      console.error('Erro ao remover isolamento:', error);
      toast({
        title: "Erro ao remover isolamento",
        description: "Ocorreu um erro ao processar a remoção.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Pacientes em Vigilância
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p>Carregando pacientes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Pacientes em Vigilância
          <Badge variant="secondary" className="ml-2">
            {pacientes.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pacientes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg mb-2">Nenhum paciente em vigilância</p>
            <p>Não há pacientes internados com isolamentos ativos no momento.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {pacientes.map((paciente) => (
              <AccordionItem key={paciente.id} value={paciente.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <div className="font-medium">{paciente.nomePaciente}</div>
                      <div className="text-sm text-muted-foreground">
                        {paciente.setorAtual} - Leito {paciente.leitoAtual}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {paciente.isolamentosAtivos.length} isolamento{paciente.isolamentosAtivos.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {paciente.isolamentosAtivos.map((isolamento, index) => {
                      const regras = obterRegrasIsolamento(isolamento.nomeIsolamento);
                      const regrasAtendidas = verificarRegrasAtendidas(paciente.id, isolamento.nomeIsolamento, regras);
                      const temRegraOU = regras.some(regra => regra.operadorLogico === 'OU');
                      
                      return (
                        <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="font-medium text-lg mb-1">{isolamento.nomeIsolamento}</div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                                <Clock className="h-4 w-4" />
                                {calcularTempoIsolamento(isolamento.dataInclusao)}
                              </div>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={!regrasAtendidas}
                                  className={`${regrasAtendidas 
                                    ? 'text-red-600 hover:text-red-700 border-red-200 hover:border-red-300' 
                                    : 'text-gray-400 border-gray-200 cursor-not-allowed'
                                  }`}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remover
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover o isolamento <strong>{isolamento.nomeIsolamento}</strong> do paciente <strong>{paciente.nomePaciente}</strong>?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removerIsolamento(paciente.id, paciente.nomePaciente, isolamento.nomeIsolamento)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Remover Isolamento
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>

                          {/* Regras de Liberação */}
                          {regras.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1">
                                  {regrasAtendidas ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className="text-sm font-medium">
                                    Regras de Liberação {regrasAtendidas ? '(Atendidas)' : '(Pendentes)'}
                                  </span>
                                  {temRegraOU && (
                                    <Badge variant="secondary" className="text-xs ml-2">
                                      Lógica OU: basta uma regra
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {regras.map((regra, regraIndex) => {
                                  const chaveRegra = gerarChaveRegra(paciente.id, isolamento.nomeIsolamento, regraIndex);
                                  const isChecked = regrasChecadas[chaveRegra] || false;
                                  
                                  return (
                                    <div key={regraIndex} className="space-y-2">
                                      <div className="flex items-start gap-3 p-2 bg-white rounded border">
                                        <Checkbox
                                          id={chaveRegra}
                                          checked={isChecked}
                                          onCheckedChange={(checked) => 
                                            handleToggleRegra(paciente.id, isolamento.nomeIsolamento, chaveRegra, checked as boolean)
                                          }
                                          className="mt-1"
                                        />
                                        <div className="flex-1">
                                          <label 
                                            htmlFor={chaveRegra} 
                                            className={`text-sm cursor-pointer ${isChecked ? 'line-through text-muted-foreground' : ''}`}
                                          >
                                            {regra.textoRegra}
                                          </label>
                                        </div>
                                      </div>
                                      
                                      {regraIndex < regras.length - 1 && regra.operadorLogico && (
                                        <div className="text-center">
                                          <Badge 
                                            variant={regra.operadorLogico === 'OU' ? 'secondary' : 'outline'}
                                            className="text-xs"
                                          >
                                            {regra.operadorLogico}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {regras.length === 0 && (
                            <div className="text-sm text-muted-foreground bg-white p-3 rounded border">
                              Nenhuma regra de liberação cadastrada para este isolamento.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default PacientesVigilancia;
