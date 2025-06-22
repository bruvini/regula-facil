
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PacienteImportado, ResultadoValidacao } from '@/types/importacao';

interface ImportacaoValidacaoProps {
  dadosValidados: PacienteImportado[];
  onVoltar: () => void;
  onProximaEtapa: () => void;
}

const ImportacaoValidacao = ({ dadosValidados, onVoltar, onProximaEtapa }: ImportacaoValidacaoProps) => {
  const [validando, setValidando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('');
  const [resultado, setResultado] = useState<ResultadoValidacao | null>(null);
  const { toast } = useToast();

  const validarDados = async () => {
    setValidando(true);
    setProgresso(0);
    
    try {
      setMensagemProgresso('Carregando dados do banco...');
      setProgresso(10);

      // Buscar setores e leitos do banco
      const setoresSnapshot = await getDocs(collection(db, 'setoresRegulaFacil'));
      const setoresDB = setoresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      setProgresso(25);
      const leitosSnapshot = await getDocs(collection(db, 'leitosRegulaFacil'));
      const leitosDB = leitosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      setProgresso(40);
      setMensagemProgresso('Buscando pacientes existentes...');
      
      // Buscar pacientes existentes
      const pacientesSnapshot = await getDocs(collection(db, 'pacientesRegulaFacil'));
      const pacientesExistentes = pacientesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      setProgresso(60);
      setMensagemProgresso('Validando dados da planilha...');

      const pacientesNovos: PacienteImportado[] = [];
      const pacientesMudancaLeito: any[] = [];
      const erros = {
        setoresNaoEncontrados: [] as string[],
        leitosNaoEncontrados: [] as string[]
      };

      // Validar cada paciente da planilha
      for (const pacientePlanilha of dadosValidados) {
        // Validar setor
        const setorEncontrado = setoresDB.find((s: any) => 
          s.nomeCompleto === pacientePlanilha.setorAtualPaciente
        );
        if (!setorEncontrado) {
          if (!erros.setoresNaoEncontrados.includes(pacientePlanilha.setorAtualPaciente)) {
            erros.setoresNaoEncontrados.push(pacientePlanilha.setorAtualPaciente);
          }
          continue;
        }

        // Validar leito
        const leitoEncontrado = leitosDB.find((l: any) => 
          l.codigo === pacientePlanilha.leitoAtualPaciente ||
          l.codigo === pacientePlanilha.leitoAtualPaciente.replace(/^[A-Z\s]+/, '').trim()
        );
        if (!leitoEncontrado) {
          if (!erros.leitosNaoEncontrados.includes(pacientePlanilha.leitoAtualPaciente)) {
            erros.leitosNaoEncontrados.push(pacientePlanilha.leitoAtualPaciente);
          }
          continue;
        }

        // Verificar se paciente já existe
        const pacienteExistente = pacientesExistentes.find((p: any) => 
          p.nomePaciente?.toLowerCase() === pacientePlanilha.nomePaciente.toLowerCase()
        );

        if (!pacienteExistente) {
          pacientesNovos.push(pacientePlanilha);
        } else {
          // Verificar se mudou de leito
          if (pacienteExistente.leitoAtualPaciente !== pacientePlanilha.leitoAtualPaciente) {
            pacientesMudancaLeito.push({
              paciente: {
                id: pacienteExistente.id,
                nome: pacienteExistente.nomePaciente,
                leitoAtual: pacienteExistente.leitoAtualPaciente,
                setorAtual: pacienteExistente.setorAtualPaciente
              },
              novoLeito: pacientePlanilha.leitoAtualPaciente,
              novoSetor: pacientePlanilha.setorAtualPaciente,
              tipo: 'mudanca_leito' as const
            });
          }
        }
      }

      setProgresso(80);
      setMensagemProgresso('Identificando pacientes removidos...');

      // Identificar pacientes que não estão na planilha
      const nomesPlanilha = dadosValidados.map(p => p.nomePaciente.toLowerCase());
      const pacientesRemovidos = pacientesExistentes
        .filter((p: any) => p.statusInternacao === 'internado')
        .filter((p: any) => !nomesPlanilha.includes(p.nomePaciente?.toLowerCase() || ''))
        .map((p: any) => ({
          id: p.id,
          nome: p.nomePaciente,
          leitoAtual: p.leitoAtualPaciente,
          setorAtual: p.setorAtualPaciente
        }));

      setProgresso(100);
      setMensagemProgresso('Validação concluída!');

      const resultadoValidacao: ResultadoValidacao = {
        pacientesNovos,
        pacientesMudancaLeito,
        pacientesRemovidos,
        erros
      };

      setResultado(resultadoValidacao);

    } catch (error) {
      console.error('Erro na validação:', error);
      toast({
        title: "Erro na validação",
        description: "Ocorreu um erro ao validar os dados.",
        variant: "destructive"
      });
    } finally {
      setValidando(false);
      setProgresso(0);
      setMensagemProgresso('');
    }
  };

  useEffect(() => {
    validarDados();
  }, []);

  const copiarErros = () => {
    if (!resultado) return;
    
    const texto = [
      'SETORES NÃO ENCONTRADOS:',
      ...resultado.erros.setoresNaoEncontrados,
      '',
      'LEITOS NÃO ENCONTRADOS:',
      ...resultado.erros.leitosNaoEncontrados
    ].join('\n');

    navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado para área de transferência!"
    });
  };

  const temErros = resultado && (
    resultado.erros.setoresNaoEncontrados.length > 0 || 
    resultado.erros.leitosNaoEncontrados.length > 0
  );

  return (
    <div className="space-y-6">
      {validando && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{mensagemProgresso}</span>
            <span>{progresso}%</span>
          </div>
          <Progress value={progresso} className="w-full" />
        </div>
      )}

      {resultado && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pacientes Novos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{resultado.pacientesNovos.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Mudanças de Leito</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{resultado.pacientesMudancaLeito.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pacientes Removidos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{resultado.pacientesRemovidos.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Erros Críticos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {resultado.erros.setoresNaoEncontrados.length + resultado.erros.leitosNaoEncontrados.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Erros encontrados */}
          {temErros && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Erros críticos encontrados que precisam ser corrigidos:</p>
                  
                  {resultado.erros.setoresNaoEncontrados.length > 0 && (
                    <div>
                      <p className="font-medium text-sm">Setores não encontrados ({resultado.erros.setoresNaoEncontrados.length}):</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {resultado.erros.setoresNaoEncontrados.map((setor, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {setor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {resultado.erros.leitosNaoEncontrados.length > 0 && (
                    <div>
                      <p className="font-medium text-sm">Leitos não encontrados ({resultado.erros.leitosNaoEncontrados.length}):</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {resultado.erros.leitosNaoEncontrados.map((leito, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {leito}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={copiarErros}
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Lista de Erros
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!temErros && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <p className="font-medium text-green-800">Validação concluída com sucesso!</p>
                <p className="text-sm text-green-700 mt-1">
                  Todos os dados foram validados e estão prontos para importação.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Botões de ação */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onVoltar}>
              Voltar
            </Button>
            
            <Button 
              onClick={onProximaEtapa} 
              disabled={!!temErros}
            >
              Prosseguir com Importação
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ImportacaoValidacao;
