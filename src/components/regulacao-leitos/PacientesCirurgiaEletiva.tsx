
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCirurgiasEletivas } from "@/hooks/useCirurgiasEletivas";
import { useMapaLeitos } from "@/hooks/useMapaLeitos";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bed, Info, Calendar } from "lucide-react";

const PacientesCirurgiaEletiva = () => {
  const { pacientesCirurgiaEletiva, loading, reservarLeito, cancelarReserva, confirmarInternacao } = useCirurgiasEletivas();
  const { setores, leitos } = useMapaLeitos();
  const { toast } = useToast();
  
  const [modalReservaAberto, setModalReservaAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [setorSelecionado, setSetorSelecionado] = useState("");
  const [leitoSelecionado, setLeitoSelecionado] = useState("");

  // Só mostrar o bloco se houver pacientes
  if (!loading && pacientesCirurgiaEletiva.length === 0) {
    return null;
  }

  const setoresComLeitosVagos = setores.filter(setor => {
    return leitos.some(leito => 
      leito.setorData?.id === setor.id && leito.status === 'vago'
    );
  });

  const leitosVagosDoSetor = leitos.filter(leito => 
    leito.setorData?.id === setorSelecionado && leito.status === 'vago'
  );

  const handleReservarLeito = async () => {
    if (!pacienteSelecionado || !leitoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um leito",
        variant: "destructive"
      });
      return;
    }

    try {
      await reservarLeito(
        pacienteSelecionado.id,
        leitoSelecionado,
        pacienteSelecionado.nomePaciente,
        pacienteSelecionado.medicoSolicitante
      );

      toast({
        title: "Sucesso",
        description: "Leito reservado com sucesso"
      });

      setModalReservaAberto(false);
      setSetorSelecionado("");
      setLeitoSelecionado("");
      setPacienteSelecionado(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reservar leito",
        variant: "destructive"
      });
    }
  };

  const handleCancelarReserva = async (paciente: any) => {
    try {
      // Buscar o ID do leito pelo código
      const leitoEncontrado = leitos.find(leito => leito.codigo === paciente.leitoReservado);
      if (!leitoEncontrado) {
        toast({
          title: "Erro",
          description: "Leito não encontrado",
          variant: "destructive"
        });
        return;
      }

      await cancelarReserva(paciente.id, leitoEncontrado.id);
      toast({
        title: "Sucesso",
        description: "Reserva cancelada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar reserva",
        variant: "destructive"
      });
    }
  };

  const handleConfirmarInternacao = async (paciente: any) => {
    try {
      await confirmarInternacao(paciente.id);
      toast({
        title: "Sucesso",
        description: "Internação confirmada"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao confirmar internação",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pacientes Aguardando Vaga para Cirurgia Eletiva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Pacientes Aguardando Vaga para Cirurgia Eletiva
          <Badge variant="secondary">{pacientesCirurgiaEletiva.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Internação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Leito Reservado</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pacientesCirurgiaEletiva.map((paciente) => (
              <TableRow key={paciente.id}>
                <TableCell className="font-medium">{paciente.nomePaciente}</TableCell>
                <TableCell>{paciente.idade} anos</TableCell>
                <TableCell>{paciente.sexoPaciente === 'M' ? 'Masculino' : 'Feminino'}</TableCell>
                <TableCell>{format(paciente.dataPrevistaInternacao, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                <TableCell>
                  <Badge variant={paciente.statusSolicitacao === 'LEITO_RESERVADO' ? 'default' : 'secondary'}>
                    {paciente.statusSolicitacao === 'LEITO_RESERVADO' ? 'Leito Reservado' : 'Pendente Leito'}
                  </Badge>
                </TableCell>
                <TableCell>{paciente.leitoReservado || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog open={modalDetalhesAberto && pacienteSelecionado?.id === paciente.id} onOpenChange={(open) => {
                      setModalDetalhesAberto(open);
                      if (!open) setPacienteSelecionado(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPacienteSelecionado(paciente)}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Paciente</DialogTitle>
                        </DialogHeader>
                        {pacienteSelecionado && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Nome</Label>
                                <p className="font-medium">{pacienteSelecionado.nomePaciente}</p>
                              </div>
                              <div>
                                <Label>Idade</Label>
                                <p>{pacienteSelecionado.idade} anos</p>
                              </div>
                              <div>
                                <Label>Data de Nascimento</Label>
                                <p>{format(pacienteSelecionado.dataNascimentoPaciente, "dd/MM/yyyy")}</p>
                              </div>
                              <div>
                                <Label>Sexo</Label>
                                <p>{pacienteSelecionado.sexoPaciente === 'M' ? 'Masculino' : 'Feminino'}</p>
                              </div>
                              <div>
                                <Label>Data Prevista Internação</Label>
                                <p>{format(pacienteSelecionado.dataPrevistaInternacao, "dd/MM/yyyy")}</p>
                              </div>
                              <div>
                                <Label>Data Prevista Cirurgia</Label>
                                <p>{format(pacienteSelecionado.dataPrevistaCirurgia, "dd/MM/yyyy")}</p>
                              </div>
                              <div>
                                <Label>Médico Solicitante</Label>
                                <p>{pacienteSelecionado.medicoSolicitante}</p>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <p>{pacienteSelecionado.statusSolicitacao === 'LEITO_RESERVADO' ? 'Leito Reservado' : 'Pendente Leito'}</p>
                              </div>
                            </div>
                            <div>
                              <Label>Procedimento Cirúrgico</Label>
                              <p>{pacienteSelecionado.procedimentoCirurgico}</p>
                            </div>
                            {pacienteSelecionado.preparacaoProcedimento?.length > 0 && (
                              <div>
                                <Label>Preparação do Procedimento</Label>
                                <ul className="list-disc list-inside space-y-1 mt-1">
                                  {pacienteSelecionado.preparacaoProcedimento.map((item: string, index: number) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {paciente.statusSolicitacao === 'PENDENTE_LEITO' ? (
                      <Dialog open={modalReservaAberto && pacienteSelecionado?.id === paciente.id} onOpenChange={(open) => {
                        setModalReservaAberto(open);
                        if (!open) {
                          setPacienteSelecionado(null);
                          setSetorSelecionado("");
                          setLeitoSelecionado("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => setPacienteSelecionado(paciente)}
                          >
                            <Bed className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reservar Leito</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Paciente</Label>
                              <p className="font-medium">{paciente.nomePaciente}</p>
                            </div>
                            
                            <div>
                              <Label htmlFor="setor">Setor</Label>
                              <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um setor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {setoresComLeitosVagos.map((setor) => (
                                    <SelectItem key={setor.id} value={setor.id}>
                                      {setor.sigla} - {setor.nomeCompleto}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {setorSelecionado && (
                              <div>
                                <Label htmlFor="leito">Leito</Label>
                                <Select value={leitoSelecionado} onValueChange={setLeitoSelecionado}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um leito" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {leitosVagosDoSetor.map((leito) => (
                                      <SelectItem key={leito.id} value={leito.id}>
                                        {leito.codigo} - {leito.tipo}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setModalReservaAberto(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={handleReservarLeito} disabled={!leitoSelecionado}>
                                Reservar Leito
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCancelarReserva(paciente)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleConfirmarInternacao(paciente)}
                        >
                          Confirmar
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PacientesCirurgiaEletiva;
