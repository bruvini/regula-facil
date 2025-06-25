
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download } from "lucide-react";
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ModalPassagemPlantaoProps {
  aberto: boolean;
  onFechar: () => void;
}

interface PacientePassagem {
  id: string;
  nome: string;
  leitoAtual: string;
  setorAtual: string;
  isolamentosAtivos?: string[];
  aguardaUTI?: boolean;
  leitoDestino?: any;
}

interface DadosSetor {
  isolamentos: PacientePassagem[];
  aguardandoUTI: PacientePassagem[];
  totalPacientes: number;
  pacientesUTI: number;
}

const ModalPassagemPlantao = ({ aberto, onFechar }: ModalPassagemPlantaoProps) => {
  const [dadosPorSetor, setDadosPorSetor] = useState<{ [setor: string]: DadosSetor }>({});
  const [loading, setLoading] = useState(false);

  const setoresAltaPrioridade = [
    'CC - RECUPERAÇÃO',
    'UNID. AVC AGUDO', 
    'SALA LARANJA',
    'PS DECISÃO CIRURGICA',
    'SALA DE EMERGENCIA',
    'PS DECISÃO CLINICA'
  ];

  const buscarDadosPassagem = async () => {
    setLoading(true);
    try {
      const pacientesSnapshot = await getDocs(collection(db, 'pacientesRegulaFacil'));
      const dadosAgrupados: { [setor: string]: DadosSetor } = {};

      await Promise.all(
        pacientesSnapshot.docs.map(async (pacienteDoc) => {
          const pacienteData = pacienteDoc.data();
          
          let nomeSetor = 'Setor Desconhecido';
          
          // Buscar nome do setor
          if (pacienteData.setorAtualPaciente) {
            try {
              let setorDoc;
              if (typeof pacienteData.setorAtualPaciente === 'string') {
                setorDoc = await getDoc(doc(db, 'setores', pacienteData.setorAtualPaciente));
              } else if (pacienteData.setorAtualPaciente.get) {
                setorDoc = await getDoc(pacienteData.setorAtualPaciente);
              }
              
              if (setorDoc && setorDoc.exists()) {
                const setorData = setorDoc.data();
                nomeSetor = setorData?.nomeCompleto || setorData?.sigla || 'Setor Desconhecido';
              }
            } catch (error) {
              console.error('Erro ao buscar setor:', error);
            }
          }

          if (!dadosAgrupados[nomeSetor]) {
            dadosAgrupados[nomeSetor] = {
              isolamentos: [],
              aguardandoUTI: [],
              totalPacientes: 0,
              pacientesUTI: 0
            };
          }

          const paciente: PacientePassagem = {
            id: pacienteDoc.id,
            nome: pacienteData.nomePaciente || 'Nome não informado',
            leitoAtual: pacienteData.leitoAtualPaciente || 'Leito não informado',
            setorAtual: nomeSetor,
            isolamentosAtivos: pacienteData.isolamentosAtivos,
            aguardaUTI: pacienteData.aguardaUTI,
            leitoDestino: pacienteData.leitoDestino
          };

          // Contar total de pacientes
          dadosAgrupados[nomeSetor].totalPacientes++;

          // Verificar isolamentos
          if (paciente.isolamentosAtivos && paciente.isolamentosAtivos.length > 0) {
            dadosAgrupados[nomeSetor].isolamentos.push(paciente);
          }

          // Verificar aguardando UTI (sem leito destino)
          if (paciente.aguardaUTI === true && !paciente.leitoDestino) {
            dadosAgrupados[nomeSetor].aguardandoUTI.push(paciente);
            dadosAgrupados[nomeSetor].pacientesUTI++;
          }
        })
      );

      setDadosPorSetor(dadosAgrupados);
    } catch (error) {
      console.error('Erro ao buscar dados para passagem de plantão:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aberto) {
      buscarDadosPassagem();
    }
  }, [aberto]);

  const gerarPDF = () => {
    const conteudoPDF = Object.keys(dadosPorSetor)
      .sort()
      .map(setor => {
        const dados = dadosPorSetor[setor];
        let secaoSetor = `--- ${setor.toUpperCase()} ---\n\n`;

        // Isolamentos
        if (dados.isolamentos.length > 0) {
          secaoSetor += 'ISOLAMENTOS:\n';
          dados.isolamentos.forEach(paciente => {
            secaoSetor += `${paciente.leitoAtual} - ${paciente.nome} - [${paciente.isolamentosAtivos?.join(', ')}]\n`;
          });
          secaoSetor += '\n';
        }

        // Aguardando UTI
        if (dados.aguardandoUTI.length > 0) {
          secaoSetor += 'AGUARDANDO UTI:\n';
          dados.aguardandoUTI.forEach(paciente => {
            secaoSetor += `${paciente.leitoAtual} - ${paciente.nome}\n`;
          });
          secaoSetor += '\n';
        }

        // Quadro de setores de alta prioridade
        if (setoresAltaPrioridade.includes(setor)) {
          secaoSetor += `TOTAL DE PACIENTES: ${dados.totalPacientes}\n`;
          secaoSetor += `AGUARDANDO UTI: ${dados.pacientesUTI}\n\n`;
        }

        return secaoSetor;
      }).join('\n');

    const dataHora = new Date().toLocaleString('pt-BR');
    const conteudoCompleto = `PASSAGEM DE PLANTÃO - RegulaFácil\nGerado em: ${dataHora}\n\n${conteudoPDF}`;

    const blob = new Blob([conteudoCompleto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `passagem-plantao-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Abrir em nova aba para visualização
    const novaJanela = window.open();
    if (novaJanela) {
      novaJanela.document.write(`<pre style="font-family: monospace; padding: 20px;">${conteudoCompleto}</pre>`);
      novaJanela.document.title = 'Passagem de Plantão';
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Passagem de Plantão
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">Carregando dados...</div>
          ) : (
            <div className="space-y-6">
              {Object.keys(dadosPorSetor).sort().map(setor => {
                const dados = dadosPorSetor[setor];
                const temDados = dados.isolamentos.length > 0 || dados.aguardandoUTI.length > 0;
                const ehAltaPrioridade = setoresAltaPrioridade.includes(setor);

                if (!temDados && !ehAltaPrioridade) return null;

                return (
                  <div key={setor} className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-4 text-blue-700">
                      {setor}
                    </h3>

                    {/* Isolamentos */}
                    {dados.isolamentos.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2 text-red-600">ISOLAMENTOS:</h4>
                        <div className="space-y-1">
                          {dados.isolamentos.map(paciente => (
                            <div key={paciente.id} className="text-sm">
                              <span className="font-medium">{paciente.leitoAtual}</span> - {paciente.nome} - 
                              <span className="text-red-500"> [{paciente.isolamentosAtivos?.join(', ')}]</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Leitos Regulados */}
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-gray-500">LEITOS REGULADOS:</h4>
                      <p className="text-sm text-gray-400 italic">Em desenvolvimento</p>
                    </div>

                    {/* A Remanejar */}
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-gray-500">A REMANEJAR:</h4>
                      <p className="text-sm text-gray-400 italic">Em desenvolvimento</p>
                    </div>

                    {/* Aguardando UTI */}
                    {dados.aguardandoUTI.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2 text-orange-600">AGUARDANDO UTI:</h4>
                        <div className="space-y-1">
                          {dados.aguardandoUTI.map(paciente => (
                            <div key={paciente.id} className="text-sm">
                              <span className="font-medium">{paciente.leitoAtual}</span> - {paciente.nome}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quadro de Setores de Alta Prioridade */}
                    {ehAltaPrioridade && (
                      <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                        <h4 className="font-semibold mb-2 text-yellow-700">QUADRO DE ALTA PRIORIDADE:</h4>
                        <div className="text-sm space-y-1">
                          <div>Total de pacientes: <span className="font-medium">{dados.totalPacientes}</span></div>
                          <div>Aguardando UTI: <span className="font-medium text-orange-600">{dados.pacientesUTI}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onFechar}>
            Fechar
          </Button>
          <Button onClick={gerarPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Gerar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalPassagemPlantao;
