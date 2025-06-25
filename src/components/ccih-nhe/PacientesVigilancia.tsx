
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Isolamento {
  nomeIsolamento: string;
  dataInclusao: any;
}

interface PacienteVigilancia {
  id: string;
  nomePaciente: string;
  leitoAtual?: string;
  setorAtual?: string;
  isolamentosAtivos: Isolamento[];
}

const PacientesVigilancia = () => {
  const [pacientes, setPacientes] = useState<PacienteVigilancia[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'pacientesRegulaFacil'),
      (snapshot) => {
        const pacientesData: PacienteVigilancia[] = [];
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.isolamentosAtivos && Array.isArray(data.isolamentosAtivos) && data.isolamentosAtivos.length > 0) {
            pacientesData.push({
              id: doc.id,
              nomePaciente: data.nomePaciente || 'Nome não informado',
              leitoAtual: data.leitoAtual || data.leitoAtualPaciente,
              setorAtual: data.setorAtual || data.setorAtualPaciente,
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

  const calcularTempoIsolamento = (dataInclusao: any) => {
    if (!dataInclusao) return 'Data não informada';
    
    const agora = new Date();
    const dataInicio = dataInclusao.toDate ? dataInclusao.toDate() : new Date(dataInclusao);
    const diffMs = agora.getTime() - dataInicio.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHoras = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDias > 0) {
      return `${diffDias} dia${diffDias > 1 ? 's' : ''} e ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    } else {
      return `${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    }
  };

  const removerIsolamento = async (pacienteId: string, nomePaciente: string, nomeIsolamento: string) => {
    try {
      const paciente = pacientes.find(p => p.id === pacienteId);
      if (!paciente) return;

      // Remover o isolamento específico do array
      const isolamentosAtualizados = paciente.isolamentosAtivos.filter(
        iso => iso.nomeIsolamento !== nomeIsolamento
      );

      // Atualizar o documento do paciente
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        isolamentosAtivos: isolamentosAtualizados
      });

      // Registrar log de movimentação
      await addDoc(collection(db, 'movimentacoesRegulaFacil'), {
        tipo: 'Remoção de Isolamento',
        descricao: `Paciente ${nomePaciente} teve o isolamento ${nomeIsolamento} removido em ${new Date().toLocaleString('pt-BR')}.`,
        nomePaciente,
        isolamentoRemovido: nomeIsolamento,
        dataHora: Timestamp.now()
      });

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
            <p>Não há pacientes com isolamentos ativos no momento.</p>
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
                  <div className="space-y-3 pt-2">
                    {paciente.isolamentosAtivos.map((isolamento, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{isolamento.nomeIsolamento}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {calcularTempoIsolamento(isolamento.dataInclusao)}
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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
                    ))}
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
