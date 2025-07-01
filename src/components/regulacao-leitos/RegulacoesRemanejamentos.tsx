
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Eye, UserCog, Building2 } from "lucide-react";
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
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Regulações por Setor
              </div>
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
                  <div key={setorId} className="border rounded-lg p-4 bg-gray-50/50">
                    {/* Cabeçalho do Setor */}
                    <div className="mb-4 pb-2 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {grupo.setor.sigla}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {grupo.setor.nomeCompleto}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {grupo.pacientes.length} paciente{grupo.pacientes.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Lista de Pacientes do Setor */}
                    <div className="space-y-3">
                      {grupo.pacientes.map((paciente) => (
                        <div key={paciente.id} className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <User className="h-5 w-5 text-blue-500" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {paciente.nome}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {paciente.sexo === 'F' ? 'Feminino' : 'Masculino'} • {paciente.idade} anos
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerDetalhes(paciente)}
                                className="h-8"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Detalhes
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRegularPaciente(paciente)}
                                className="h-8"
                              >
                                <UserCog className="w-3 h-3 mr-1" />
                                Regular
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
