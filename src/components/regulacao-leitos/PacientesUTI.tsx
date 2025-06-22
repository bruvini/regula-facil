
import { useState } from 'react';
import { Card, CardContent, CardHeader,CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, User, MapPin, XCircle, Bed } from "lucide-react";
import { usePacientesUTI } from "@/hooks/usePacientesUTI";
import { useAcoesLeito } from "@/hooks/useAcoesLeito";
import { useToast } from "@/hooks/use-toast";

const PacientesUTI = () => {
  const { pacientesUTI, leitosUTIVagos, loading, carregarLeitosUTIVagos } = usePacientesUTI();
  const { cancelarPedidoUTI } = useAcoesLeito();
  const { toast } = useToast();
  
  const [modalCancelamentoAberto, setModalCancelamentoAberto] = useState(false);
  const [modalTransferenciaAberto, setModalTransferenciaAberto] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [leitoSelecionado, setLeitoSelecionado] = useState('');

  // Só renderizar se houver pacientes aguardando UTI
  if (loading || pacientesUTI.length === 0) {
    return null;
  }

  const handleCancelarPedido = (paciente: any) => {
    setPacienteSelecionado(paciente);
    setModalCancelamentoAberto(true);
  };

  const handleConfirmarCancelamento = async () => {
    if (pacienteSelecionado && motivoCancelamento.trim()) {
      const sucesso = await cancelarPedidoUTI(
        pacienteSelecionado.id,
        pacienteSelecionado.nome,
        motivoCancelamento
      );
      
      if (sucesso) {
        setModalCancelamentoAberto(false);
        setMotivoCancelamento('');
        setPacienteSelecionado(null);
      }
    }
  };

  const handleDarLeitoUTI = async (paciente: any) => {
    setPacienteSelecionado(paciente);
    await carregarLeitosUTIVagos();
    setModalTransferenciaAberto(true);
  };

  const handleConfirmarTransferencia = () => {
    if (leitoSelecionado) {
      toast({
        title: "Transferência em desenvolvimento",
        description: "Esta funcionalidade será implementada em breve.",
        duration: 3000
      });
      setModalTransferenciaAberto(false);
      setLeitoSelecionado('');
      setPacienteSelecionado(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Pacientes Aguardando UTI
            <Badge variant="destructive">{pacientesUTI.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pacientesUTI.map((paciente) => (
              <Card key={paciente.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Nome do paciente */}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <h3 className="font-semibold">{paciente.nome}</h3>
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          <Clock className="w-3 h-3 mr-1" />
                          {paciente.tempoEspera}
                        </Badge>
                      </div>
                      
                      {/* Setor e leito atual */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>Setor:</span>
                          <Badge variant="secondary">
                            {paciente.setorAtual?.sigla} - {paciente.setorAtual?.nomeCompleto}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          <span>Leito:</span>
                          <Badge variant="outline">
                            {paciente.leitoAtual?.codigo}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botões de ação */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelarPedido(paciente)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancelar pedido
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDarLeitoUTI(paciente)}
                      >
                        <Bed className="w-4 h-4 mr-1" />
                        Dar leito na UTI
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de cancelamento */}
      <Dialog open={modalCancelamentoAberto} onOpenChange={setModalCancelamentoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Pedido de UTI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja cancelar o pedido de UTI para{' '}
              <strong>{pacienteSelecionado?.nome}</strong>?
            </p>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo do cancelamento</Label>
              <Input
                id="motivo"
                placeholder="Digite o motivo do cancelamento..."
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setModalCancelamentoAberto(false);
                  setMotivoCancelamento('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmarCancelamento}
                disabled={!motivoCancelamento.trim()}
              >
                Confirmar cancelamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de transferência */}
      <Dialog open={modalTransferenciaAberto} onOpenChange={setModalTransferenciaAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir para UTI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione um leito vago na UTI para{' '}
              <strong>{pacienteSelecionado?.nome}</strong>:
            </p>
            
            {leitosUTIVagos.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Nenhum leito vago disponível na UTI no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="leito">Leito de destino</Label>
                <Select value={leitoSelecionado} onValueChange={setLeitoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um leito" />
                  </SelectTrigger>
                  <SelectContent>
                    {leitosUTIVagos.map((leito) => (
                      <SelectItem key={leito.id} value={leito.id}>
                        {leito.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setModalTransferenciaAberto(false);
                  setLeitoSelecionado('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarTransferencia}
                disabled={!leitoSelecionado || leitosUTIVagos.length === 0}
              >
                Confirmar transferência
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PacientesUTI;
