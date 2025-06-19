
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';
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
              const pacienteData = { id: pacienteDoc.id, ...pacienteDoc.data() } as Paciente;
              
              // Check if patient has active regulation with status 'aguardando'
              if (pacienteData.regulacaoAtual) {
                const regulacaoDoc = await getDoc(pacienteData.regulacaoAtual);
                if (regulacaoDoc.exists()) {
                  const regulacaoData = regulacaoDoc.data() as Regulacao;
                  if (regulacaoData.status === 'aguardando') {
                    return pacienteData;
                  }
                }
              }
              return null;
            })
          );

          const pacientesFiltrados = pacientesData.filter(p => p !== null) as Paciente[];
          setPacientes(pacientesFiltrados);
          
          if (pacientesFiltrados.length === 0) {
            toast({
              title: "Nenhum paciente aguardando regulação no momento.",
            });
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Erro ao carregar pacientes:', error);
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }
  }, [aberto, toast]);

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
            {pacientes.map((paciente) => (
              <Card key={paciente.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <h3 className="font-medium">{paciente.nome}</h3>
                        <Badge variant="outline">
                          {paciente.idade} anos - {paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Tempo de espera: {calcularTempoEspera(paciente.regulacaoAtual)}
                        </div>
                      </div>
                    </div>
                    
                    <Button onClick={() => handleRegular(paciente.id)}>
                      Regulamentar
                    </Button>
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
