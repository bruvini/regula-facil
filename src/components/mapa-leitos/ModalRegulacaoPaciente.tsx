
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, MapPin } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface Paciente {
  id: string;
  nome: string;
  idade: number;
  sexo: 'M' | 'F';
  setorAtual?: any;
  regulacaoAtual?: any;
}

interface Regulacao {
  status: string;
  dataInicio?: any;
}

interface Setor {
  id: string;
  sigla: string;
  nomeCompleto: string;
}

interface ModalRegulacaoPacienteProps {
  aberto: boolean;
  onFechar: () => void;
  leitoId: string;
  onRegular: (pacienteId: string, leitoId: string) => Promise<void>;
}

const ModalRegulacaoPaciente = ({ aberto, onFechar, leitoId, onRegular }: ModalRegulacaoPacienteProps) => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (aberto) {
      setLoading(true);
      
      const q = query(
        collection(db, 'pacientesRegulaFacil'),
        where('statusInternacao', '==', 'internado')
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          const pacientesData = await Promise.all(
            snapshot.docs.map(async (pacienteDoc) => {
              const pacienteDocData = pacienteDoc.data();
              const pacienteData: Paciente = { 
                id: pacienteDoc.id, 
                nome: pacienteDocData.nome || '',
                idade: pacienteDocData.idade || 0,
                sexo: pacienteDocData.sexo || 'M',
                setorAtual: pacienteDocData.setorAtual,
                regulacaoAtual: pacienteDocData.regulacaoAtual
              };
              
              // Check if patient has active regulation with status 'aguardando'
              if (pacienteData.regulacaoAtual) {
                const regulacaoDoc = await getDoc(pacienteData.regulacaoAtual);
                if (regulacaoDoc.exists()) {
                  const regulacaoData = regulacaoDoc.data() as Regulacao;
                  if (regulacaoData.status === 'aguardando') {
                    // Buscar dados do setor atual
                    if (pacienteData.setorAtual) {
                      const setorDoc = await getDoc(pacienteData.setorAtual);
                      if (setorDoc.exists()) {
                        pacienteData.setorAtual = { id: setorDoc.id, ...setorDoc.data() } as Setor;
                      }
                    }
                    
                    // Adicionar dados da regulação
                    pacienteData.regulacaoAtual = regulacaoData;
                    
                    return pacienteData;
                  }
                }
              }
              return null;
            })
          );

          const pacientesFiltrados = pacientesData.filter(p => p !== null) as Paciente[];
          setPacientes(pacientesFiltrados);
          setLoading(false);
        } catch (error) {
          console.error('Erro ao carregar pacientes:', error);
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }
  }, [aberto]);

  const handleRegular = async (pacienteId: string) => {
    try {
      await onRegular(pacienteId, leitoId);
      onFechar();
      toast({
        title: "Paciente regulado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao regular paciente:', error);
      toast({
        title: "Erro ao regular paciente",
        variant: "destructive"
      });
    }
  };

  const calcularTempoEspera = (regulacao: any) => {
    if (!regulacao?.dataInicio) return 'N/A';
    const agora = new Date();
    const inicio = regulacao.dataInicio.toDate();
    const diffMs = agora.getTime() - inicio.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHoras}h ${diffMinutos}m`;
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Regulação de Paciente</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p>Carregando pacientes...</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Nenhum paciente aguardando regulação.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              {pacientes.length} paciente(s) aguardando regulação
            </div>
            
            {pacientes.map((paciente) => (
              <Card key={paciente.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Linha 1: Nome e dados básicos */}
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-blue-500" />
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{paciente.nome}</h3>
                          <Badge variant="outline">
                            {paciente.idade} anos
                          </Badge>
                          <Badge variant="outline">
                            {paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Linha 2: Setor de origem */}
                      {paciente.setorAtual && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Setor de origem:</span>
                          <Badge variant="secondary">
                            {paciente.setorAtual.sigla} - {paciente.setorAtual.nomeCompleto}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Linha 3: Tempo de espera */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-muted-foreground">Tempo de espera:</span>
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          {calcularTempoEspera(paciente.regulacaoAtual)}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Botão de ação */}
                    <div className="ml-4">
                      <Button 
                        onClick={() => handleRegular(paciente.id)}
                        className="min-w-[120px]"
                      >
                        Regulamentar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalRegulacaoPaciente;
