
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Eye, UserCog } from "lucide-react";
import { usePacientesRegulacao } from "@/hooks/usePacientesRegulacao";
import ModalDetalhesPaciente from "./ModalDetalhesPaciente";
import { useToast } from "@/hooks/use-toast";

const RegulacoesRemanejamentos = () => {
  const { pacientesPorSetor, loading } = usePacientesRegulacao();
  const { toast } = useToast();
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);

  const handleVerDetalhes = (paciente: any) => {
    setPacienteSelecionado(paciente.dadosCompletos);
    setModalDetalhesAberto(true);
  };

  const handleRegularPaciente = (paciente: any) => {
    toast({
      title: "Regulação em desenvolvimento",
      description: `Regulação do paciente ${paciente.nome} será implementada em breve.`,
      duration: 3000
    });
  };

  const totalPacientesRegulacao = Object.values(pacientesPorSetor).reduce(
    (total, grupo) => total + grupo.pacientes.length, 
    0
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regulações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Regulações
              {totalPacientesRegulacao > 0 && (
                <Badge variant="destructive">{totalPacientesRegulacao}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Carregando pacientes aguardando regulação...
              </div>
            ) : totalPacientesRegulacao === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Nenhum paciente aguardando regulação no momento
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(pacientesPorSetor).map(([setorId, grupo]) => (
                  <div key={setorId}>
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg">
                        {grupo.setor.sigla} - {grupo.setor.nomeCompleto}
                      </h3>
                      <Badge variant="outline" className="mt-1">
                        {grupo.pacientes.length} paciente{grupo.pacientes.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grupo.pacientes.map((paciente) => (
                          <TableRow key={paciente.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                  {paciente.nome} ({paciente.sexo} - {paciente.idade} anos)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerDetalhes(paciente)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Detalhes
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleRegularPaciente(paciente)}
                                >
                                  <UserCog className="w-4 h-4 mr-1" />
                                  Regular Paciente
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Remanejamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Remanejamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Conteúdo dos remanejamentos será desenvolvido
            </div>
          </CardContent>
        </Card>
      </div>

      <ModalDetalhesPaciente
        aberto={modalDetalhesAberto}
        onFechar={() => setModalDetalhesAberto(false)}
        paciente={pacienteSelecionado}
      />
    </>
  );
};

export default RegulacoesRemanejamentos;
