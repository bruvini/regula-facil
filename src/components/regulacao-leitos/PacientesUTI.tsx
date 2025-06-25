
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
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp, deleteField, addDoc, collection } from "firebase/firestore";

const PacientesUTI = () => {
  const { pacientesUTI, leitosUTIVagos, loading, carregarLeitosUTIVagos } = usePacientesUTI();
  const { toast } = useToast();
  
  const [modalCancelamentoAberto, setModalCancelamentoAberto] = useState(false);
  const [modalTransferenciaAberto, setModalTransferenciaAberto] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [tipoCancelamento, setTipoCancelamento] = useState('');
  const [destinoTransferencia, setDestinoTransferencia] = useState('');
  const [dataTransferencia, setDataTransferencia] = useState('');
  const [motivoOutro, setMotivoOutro] = useState('');
  const [leitoSelecionado, setLeitoSelecionado] = useState('');
  const [modalCancelarReservaAberto, setModalCancelarReservaAberto] = useState(false);
  const [motivoCancelarReserva, setMotivoCancelarReserva] = useState('');

  // Só renderizar se houver pacientes aguardando UTI
  if (loading || pacientesUTI.length === 0) {
    return null;
  }


  const registrarLogMovimentacao = async (descricao: string) => {
    try {
      await addDoc(collection(db, 'logsMovimentacoesRegulaFacil'), {
        descricao,
        timestamp: Timestamp.now()
      });
    } catch (err) {
      console.error('Erro ao registrar log:', err);
    }
  };

  const handleConfirmarCancelamento = async () => {
    if (!pacienteSelecionado || !tipoCancelamento) return;

    try {
      const tempo = pacienteSelecionado.tempoEspera;
      const agora = new Date().toLocaleString('pt-BR');
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteSelecionado.id);
      const leitoAtualRef = doc(db, 'leitosRegulaFacil', pacienteSelecionado.leitoAtual.id);

      let descricao = '';

      if (tipoCancelamento === 'ALTA' || tipoCancelamento === 'OBITO') {
        descricao = `Pedido de UTI cancelado para o paciente ${pacienteSelecionado.nome}, setor ${pacienteSelecionado.setorAtual.sigla}, após ${tempo} por motivo: ${tipoCancelamento === 'ALTA' ? 'Alta' : 'Óbito'} em ${agora}.`;
        await updateDoc(leitoAtualRef, { status: 'vago', dataUltimaAtualizacaoStatus: Timestamp.now() });
      } else if (tipoCancelamento === 'TRANSFERENCIA') {
        descricao = `Pedido de UTI cancelado para ${pacienteSelecionado.nome} após transferência para ${destinoTransferencia} em ${dataTransferencia} após ${tempo}.`;
        await updateDoc(leitoAtualRef, { status: 'vago', dataUltimaAtualizacaoStatus: Timestamp.now() });
      } else {
        descricao = `Pedido de UTI cancelado para ${pacienteSelecionado.nome} após ${tempo} por motivo: ${motivoOutro}.`;
      }

      if (pacienteSelecionado.leitoDestino) {
        const leitoDestinoRef = doc(db, 'leitosRegulaFacil', pacienteSelecionado.leitoDestino.id);
        await updateDoc(leitoDestinoRef, { status: 'vago', dataUltimaAtualizacaoStatus: Timestamp.now() });
        await updateDoc(pacienteRef, {
          leitoDestino: deleteField(),
          setorDestino: deleteField()
        });
      }

      await updateDoc(pacienteRef, {
        aguardaUTI: deleteField(),
        dataPedidoUTI: deleteField()
      });

      await registrarLogMovimentacao(descricao);

      setModalCancelamentoAberto(false);
      setTipoCancelamento('');
      setDestinoTransferencia('');
      setDataTransferencia('');
      setMotivoOutro('');
      setPacienteSelecionado(null);
    } catch (err) {
      console.error('Erro ao cancelar pedido UTI:', err);
      toast({ title: 'Erro ao cancelar', description: 'Não foi possível cancelar.', variant: 'destructive' });
    }
  };

  const handleDarLeitoUTI = async (paciente: any) => {
    setPacienteSelecionado(paciente);
    await carregarLeitosUTIVagos();
    setModalTransferenciaAberto(true);
  };

  const handleConfirmarTransferencia = async () => {
    if (!pacienteSelecionado || !leitoSelecionado) return;

    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteSelecionado.id);
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoSelecionado);

      await updateDoc(pacienteRef, {
        leitoDestino: leitoRef,
        setorDestino: doc(db, 'setoresRegulaFacil', '7UKUgMtFvxAdCSxLmea7')
      });

      await updateDoc(leitoRef, {
        status: 'reservado',
        dataUltimaAtualizacaoStatus: Timestamp.now()
      });

      toast({ title: 'Leito reservado', description: 'Reserva realizada com sucesso' });

      setModalTransferenciaAberto(false);
      setLeitoSelecionado('');
      setPacienteSelecionado(null);
    } catch (err) {
      console.error('Erro ao reservar leito:', err);
      toast({ title: 'Erro', description: 'Não foi possível reservar', variant: 'destructive' });
    }
  };

  const handleCancelarReserva = async () => {
    if (!pacienteSelecionado || !pacienteSelecionado.leitoDestino) return;

    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteSelecionado.id);
      const leitoRef = doc(db, 'leitosRegulaFacil', pacienteSelecionado.leitoDestino.id);

      await updateDoc(leitoRef, { status: 'vago', dataUltimaAtualizacaoStatus: Timestamp.now() });

      await updateDoc(pacienteRef, {
        leitoDestino: deleteField(),
        setorDestino: deleteField()
      });

      await registrarLogMovimentacao(
        `Reserva de leito ${pacienteSelecionado.leitoDestino.codigo} para paciente ${pacienteSelecionado.nome} cancelada. Motivo: ${motivoCancelarReserva}.`
      );

      setModalCancelarReservaAberto(false);
      setMotivoCancelarReserva('');
      setPacienteSelecionado(null);
    } catch (err) {
      console.error('Erro ao cancelar reserva:', err);
      toast({ title: 'Erro', description: 'Não foi possível cancelar a reserva', variant: 'destructive' });
    }
  };

  const handleConfirmarTransferenciaFinal = async (paciente: any) => {
    if (!paciente || !paciente.leitoDestino) return;

    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
      const antigoLeitoRef = doc(db, 'leitosRegulaFacil', paciente.leitoAtual.id);
      const novoLeitoRef = doc(db, 'leitosRegulaFacil', paciente.leitoDestino.id);

      await updateDoc(pacienteRef, {
        leitoAtualPaciente: novoLeitoRef,
        setorAtualPaciente: doc(db, 'setoresRegulaFacil', '7UKUgMtFvxAdCSxLmea7'),
        leitoDestino: deleteField(),
        setorDestino: deleteField(),
        aguardaUTI: deleteField(),
        dataPedidoUTI: deleteField()
      });

      await updateDoc(antigoLeitoRef, { status: 'limpeza', dataUltimaAtualizacaoStatus: Timestamp.now() });
      await updateDoc(novoLeitoRef, { status: 'ocupado', dataUltimaAtualizacaoStatus: Timestamp.now() });

      await registrarLogMovimentacao(
        `Transferência para leito ${paciente.leitoDestino.codigo} confirmada para paciente ${paciente.nome} após ${paciente.tempoEspera} aguardando UTI.`
      );

      setPacienteSelecionado(null);
    } catch (err) {
      console.error('Erro ao confirmar transferência:', err);
      toast({ title: 'Erro', description: 'Não foi possível confirmar', variant: 'destructive' });
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
                        onClick={() => {
                          setPacienteSelecionado(paciente);
                          setModalCancelamentoAberto(true);
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancelar pedido
                      </Button>
                      {!paciente.leitoDestino ? (
                        <Button size="sm" onClick={() => handleDarLeitoUTI(paciente)}>
                          <Bed className="w-4 h-4 mr-1" />
                          Dar leito na UTI
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPacienteSelecionado(paciente);
                              setModalCancelarReservaAberto(true);
                            }}
                          >
                            Cancelar reserva
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmarTransferenciaFinal(paciente)}
                          >
                            Confirmar transferência
                          </Button>
                        </>
                      )}
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
              <Select value={tipoCancelamento} onValueChange={setTipoCancelamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="OBITO">Óbito</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoCancelamento === 'TRANSFERENCIA' && (
              <div className="space-y-2">
                <Label>Para onde foi transferido?</Label>
                <Input value={destinoTransferencia} onChange={(e) => setDestinoTransferencia(e.target.value)} />
                <Label>Data/Hora da transferência</Label>
                <Input type="datetime-local" value={dataTransferencia} onChange={(e) => setDataTransferencia(e.target.value)} />
              </div>
            )}

            {tipoCancelamento === 'OUTROS' && (
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Input value={motivoOutro} onChange={(e) => setMotivoOutro(e.target.value)} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setModalCancelamentoAberto(false);
                  setTipoCancelamento('');
                  setDestinoTransferencia('');
                  setDataTransferencia('');
                  setMotivoOutro('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmarCancelamento}
                disabled={!tipoCancelamento || (tipoCancelamento === 'TRANSFERENCIA' && (!destinoTransferencia || !dataTransferencia)) || (tipoCancelamento === 'OUTROS' && !motivoOutro)}
              >
                Confirmar cancelamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal cancelar reserva */}
      <Dialog open={modalCancelarReservaAberto} onOpenChange={setModalCancelarReservaAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Reserva de UTI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Qual o motivo do cancelamento da reserva?</p>
            <Input value={motivoCancelarReserva} onChange={(e) => setMotivoCancelarReserva(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setModalCancelarReservaAberto(false); setMotivoCancelarReserva(''); }}>Cancelar</Button>
              <Button onClick={handleCancelarReserva} disabled={!motivoCancelarReserva.trim()}>Confirmar</Button>
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
