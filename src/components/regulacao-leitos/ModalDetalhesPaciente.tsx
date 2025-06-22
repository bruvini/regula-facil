
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ModalDetalhesPacienteProps {
  aberto: boolean;
  onFechar: () => void;
  paciente: any;
}

const ModalDetalhesPaciente = ({ aberto, onFechar, paciente }: ModalDetalhesPacienteProps) => {
  if (!paciente) return null;

  const formatarData = (data: any) => {
    if (!data) return 'Não informado';
    
    try {
      if (data.toDate) {
        return format(data.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
      }
      if (typeof data === 'string') {
        return data;
      }
      return format(new Date(data), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const formatarBoolean = (valor: any) => {
    if (typeof valor === 'boolean') {
      return valor ? 'Sim' : 'Não';
    }
    return 'Não informado';
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detalhes do Paciente - {paciente.nomePaciente}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Informações Básicas */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Informações Básicas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nome:</span> {paciente.nomePaciente || 'Não informado'}
                </div>
                <div>
                  <span className="font-medium">Sexo:</span> {paciente.sexoPaciente || 'Não informado'}
                </div>
                <div>
                  <span className="font-medium">Data de Nascimento:</span> {formatarData(paciente.dataNascimentoPaciente)}
                </div>
                <div>
                  <span className="font-medium">CPF:</span> {paciente.cpfPaciente || 'Não informado'}
                </div>
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Status</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status Internação:</span> 
                  <Badge variant="outline" className="ml-2">
                    {paciente.statusInternacao || 'Não informado'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Status Regulação:</span>
                  <Badge variant="outline" className="ml-2">
                    {paciente.statusRegulacao || 'Não informado'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Aguarda UTI:</span> {formatarBoolean(paciente.aguardaUTI)}
                </div>
                {paciente.dataPedidoUTI && (
                  <div>
                    <span className="font-medium">Data Pedido UTI:</span> {formatarData(paciente.dataPedidoUTI)}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Informações Médicas */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Informações Médicas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Especialidade:</span> {paciente.especialidade || 'Não informado'}
                </div>
                <div>
                  <span className="font-medium">Médico Responsável:</span> {paciente.medicoResponsavel || 'Não informado'}
                </div>
                {paciente.isolamentosAtivos && paciente.isolamentosAtivos.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium">Isolamentos Ativos:</span>
                    <div className="flex gap-2 mt-1">
                      {paciente.isolamentosAtivos.map((isolamento: string, index: number) => (
                        <Badge key={index} variant="destructive">
                          {isolamento}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Datas */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Datas Importantes</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Data Internação:</span> {formatarData(paciente.dataInternacao)}
                </div>
                <div>
                  <span className="font-medium">Data Cadastro:</span> {formatarData(paciente.dataCadastroPaciente)}
                </div>
                {paciente.dataUltimaAtualizacao && (
                  <div>
                    <span className="font-medium">Última Atualização:</span> {formatarData(paciente.dataUltimaAtualizacao)}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Outros Dados */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Outros Dados</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(paciente)
                  .filter(([key]) => 
                    !['nomePaciente', 'sexoPaciente', 'dataNascimentoPaciente', 'cpfPaciente', 
                      'statusInternacao', 'statusRegulacao', 'aguardaUTI', 'dataPedidoUTI',
                      'especialidade', 'medicoResponsavel', 'isolamentosAtivos',
                      'dataInternacao', 'dataCadastroPaciente', 'dataUltimaAtualizacao',
                      'setorAtualPaciente', 'leitoAtualPaciente'].includes(key)
                  )
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-right max-w-xs break-words">
                        {typeof value === 'object' && value !== null 
                          ? JSON.stringify(value) 
                          : String(value || 'Não informado')
                        }
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ModalDetalhesPaciente;
