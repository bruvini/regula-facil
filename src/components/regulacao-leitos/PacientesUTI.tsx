
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, User, ChevronDown, ChevronUp, X, Hospital } from "lucide-react";

interface Paciente {
  id: string;
  nomePaciente: string;
  sexoPaciente: string;
  dataPedidoUTI: any;
  setorAtualPaciente?: any;
  leitoAtualPaciente?: any;
  setorNome?: string;
  leitoCodigo?: string;
}

const PacientesUTI = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Calcular tempo de espera
  const calcularTempoEspera = (dataPedido: any) => {
    if (!dataPedido) return '0h 0min';

    const agora = new Date();
    const inicio = dataPedido.toDate ? dataPedido.toDate() : new Date(dataPedido);
    const diff = agora.getTime() - inicio.getTime();

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${horas}h ${minutos}min`;
  };

  useEffect(() => {
    const q = query(
      collection(db, "pacientesRegulaFacil"),
      where("aguardaUTI", "==", true)
    );

    const unsubscribe = onSnapshot(q, async snapshot => {
      const dados = await Promise.all(
        snapshot.docs.map(async docRef => {
          const data = docRef.data() as any;
          
          // Buscar dados do setor
          let setorNome = '';
          if (data.setorAtualPaciente) {
            try {
              const setorDoc = await getDoc(data.setorAtualPaciente);
              if (setorDoc.exists()) {
                const setorData = setorDoc.data() as { sigla?: string; nomeCompleto?: string };
                setorNome = setorData?.sigla || setorData?.nomeCompleto || '';
              }
            } catch (error) {
              console.error('Erro ao buscar setor:', error);
            }
          }

          // Buscar dados do leito
          let leitoCodigo = '';
          if (data.leitoAtualPaciente) {
            try {
              const leitoDoc = await getDoc(data.leitoAtualPaciente);
              if (leitoDoc.exists()) {
                const leitoData = leitoDoc.data() as { codigo?: string };
                leitoCodigo = leitoData?.codigo || '';
              }
            } catch (error) {
              console.error('Erro ao buscar leito:', error);
            }
          }

          return {
            id: docRef.id,
            nomePaciente: data.nomePaciente,
            sexoPaciente: data.sexoPaciente,
            dataPedidoUTI: data.dataPedidoUTI,
            setorAtualPaciente: data.setorAtualPaciente,
            leitoAtualPaciente: data.leitoAtualPaciente,
            setorNome,
            leitoCodigo,
          } as Paciente;
        })
      );
      setPacientes(dados);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Atualizar tempo de espera a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setPacientes(prev => [...prev]); // Force re-render to update time
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null;
  }

  // Só renderiza o card se houver pacientes aguardando UTI
  if (pacientes.length === 0) {
    return null;
  }

  const handleCancelarPedido = (pacienteId: string) => {
    // Ação será implementada posteriormente
    console.log('Cancelar pedido UTI para paciente:', pacienteId);
  };

  const handleInformarLeito = (pacienteId: string) => {
    // Ação será implementada posteriormente
    console.log('Informar leito para paciente:', pacienteId);
  };

  return (
    <TooltipProvider>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <CardTitle className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded -m-2">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Pacientes aguardando UTI
                  <Badge variant="secondary">
                    {pacientes.length}
                  </Badge>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pacientes.map(paciente => (
                  <div key={paciente.id} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-base mb-1">
                          {paciente.nomePaciente}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {paciente.sexoPaciente === 'F' ? 'Feminino' : 'Masculino'}
                        </div>
                        {(paciente.setorNome || paciente.leitoCodigo) && (
                          <div className="text-sm text-gray-600 mb-2">
                            {paciente.setorNome && paciente.leitoCodigo ? 
                              `${paciente.setorNome} - Leito ${paciente.leitoCodigo}` :
                              paciente.setorNome || `Leito ${paciente.leitoCodigo}`
                            }
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          Aguardando há {calcularTempoEspera(paciente.dataPedidoUTI)}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelarPedido(paciente.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Cancelar pedido de UTI
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInformarLeito(paciente.id)}
                              className="h-8 w-8 p-0 hover:bg-green-100"
                            >
                              <Hospital className="h-4 w-4 text-green-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Informar leito recebido
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
};

export default PacientesUTI;
