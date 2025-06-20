
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertTriangle, Copy, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PacienteImportado {
  nomePaciente: string;
  dataNascimentoPaciente: string;
  sexoPaciente: 'M' | 'F';
  dataInternacaoPaciente: string;
  setorAtualPaciente: string;
  leitoAtualPaciente: string;
  especialidadePaciente: string;
  statusRegulacao: 'AGUARDANDO_REGULACAO' | null;
}

interface ErrosValidacao {
  setoresNaoEncontrados: string[];
  leitosNaoEncontrados: string[];
  pacientesComTeste: string[];
}

interface ModalImportarPacientesProps {
  aberto: boolean;
  onFechar: () => void;
}

const ModalImportarPacientes = ({ aberto, onFechar }: ModalImportarPacientesProps) => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [processando, setProcessando] = useState(false);
  const [dadosValidados, setDadosValidados] = useState<PacienteImportado[]>([]);
  const [erros, setErros] = useState<ErrosValidacao>({
    setoresNaoEncontrados: [],
    leitosNaoEncontrados: [],
    pacientesComTeste: []
  });
  const [estatisticas, setEstatisticas] = useState({
    totalRegistros: 0,
    pacientesAguardandoRegulacao: 0,
    totalErros: 0
  });
  const [etapa, setEtapa] = useState<'upload' | 'validacao' | 'sucesso'>('upload');
  const { toast } = useToast();

  const setoresRegulacao = [
    'CC - RECUPERAÇÃO',
    'CC - PRE OPERATORIO', 
    'CC - SALAS CIRURGICAS',
    'PS DECISÃO CIRURGICA',
    'PS DECISÃO CLINICA'
  ];

  const handleUploadArquivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setArquivo(file);
    }
  };

  const processarArquivo = async () => {
    if (!arquivo) return;

    setProcessando(true);
    try {
      // Ler arquivo Excel
      const arrayBuffer = await arquivo.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Pular as 3 primeiras linhas e processar a partir da linha 4
      const linhasProcessar = dados.slice(3);
      
      // Buscar setores e leitos do banco
      const setoresSnapshot = await getDocs(collection(db, 'setoresRegulaFacil'));
      const setoresDB = setoresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      const leitosSnapshot = await getDocs(collection(db, 'leitosRegulaFacil'));
      const leitosDB = leitosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      const pacientesValidos: PacienteImportado[] = [];
      const errosEncontrados: ErrosValidacao = {
        setoresNaoEncontrados: [],
        leitosNaoEncontrados: [],
        pacientesComTeste: []
      };

      for (const linha of linhasProcessar) {
        // Ignorar linhas vazias
        if (!linha[0] || linha[0].toString().trim() === '') continue;

        const nomePaciente = linha[0]?.toString().trim();
        
        // Ignorar pacientes com "teste" no nome
        if (nomePaciente?.toLowerCase().includes('teste')) {
          errosEncontrados.pacientesComTeste.push(nomePaciente);
          continue;
        }

        const setorPaciente = linha[4]?.toString().trim();
        const leitoPaciente = linha[6]?.toString().trim();

        // Validar setor
        const setorEncontrado = setoresDB.find((s: any) => s.nomeCompleto === setorPaciente);
        if (!setorEncontrado) {
          if (!errosEncontrados.setoresNaoEncontrados.includes(setorPaciente)) {
            errosEncontrados.setoresNaoEncontrados.push(setorPaciente);
          }
          continue;
        }

        // Validar leito
        let leitoEncontrado = null;
        
        // Primeiro, tentar encontrar o leito exato
        leitoEncontrado = leitosDB.find((l: any) => l.codigo === leitoPaciente);
        
        // Se não encontrou, tentar extrair apenas os números/código do leito
        if (!leitoEncontrado && leitoPaciente) {
          // Remover possível sigla do setor do início
          const codigoLeitoLimpo = leitoPaciente.replace(/^[A-Z\s]+/, '').trim();
          leitoEncontrado = leitosDB.find((l: any) => l.codigo === codigoLeitoLimpo);
        }

        if (!leitoEncontrado) {
          if (!errosEncontrados.leitosNaoEncontrados.includes(leitoPaciente)) {
            errosEncontrados.leitosNaoEncontrados.push(leitoPaciente);
          }
          continue;
        }

        // Determinar status de regulação
        const statusRegulacao = setoresRegulacao.includes(setorPaciente) 
          ? 'AGUARDANDO_REGULACAO' as const
          : null;

        const paciente: PacienteImportado = {
          nomePaciente,
          dataNascimentoPaciente: linha[1]?.toString().trim() || '',
          sexoPaciente: linha[2]?.toString().trim() as 'M' | 'F',
          dataInternacaoPaciente: linha[3]?.toString().trim() || '',
          setorAtualPaciente: setorPaciente,
          leitoAtualPaciente: leitoPaciente,
          especialidadePaciente: linha[7]?.toString().trim() || '',
          statusRegulacao
        };

        pacientesValidos.push(paciente);
      }

      // Calcular estatísticas
      const totalErros = errosEncontrados.setoresNaoEncontrados.length + 
                        errosEncontrados.leitosNaoEncontrados.length + 
                        errosEncontrados.pacientesComTeste.length;

      const pacientesAguardando = pacientesValidos.filter(p => p.statusRegulacao === 'AGUARDANDO_REGULACAO').length;

      setDadosValidados(pacientesValidos);
      setErros(errosEncontrados);
      setEstatisticas({
        totalRegistros: pacientesValidos.length,
        pacientesAguardandoRegulacao: pacientesAguardando,
        totalErros
      });

      setEtapa('validacao');
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique se o arquivo está no formato correto.",
        variant: "destructive"
      });
    } finally {
      setProcessando(false);
    }
  };

  const salvarPacientes = async () => {
    if (estatisticas.totalErros > 0) {
      toast({
        title: "Existem erros que precisam ser resolvidos",
        description: "Corrija os problemas encontrados antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    setProcessando(true);
    try {
      // Salvar cada paciente no banco
      for (const paciente of dadosValidados) {
        await addDoc(collection(db, 'pacientesRegulaFacil'), {
          ...paciente,
          statusInternacao: 'internado',
          dataCriacao: new Date()
        });
      }

      setEtapa('sucesso');
      toast({
        title: "Pacientes importados com sucesso!",
        description: `${dadosValidados.length} pacientes foram importados.`
      });
    } catch (error) {
      console.error('Erro ao salvar pacientes:', error);
      toast({
        title: "Erro ao salvar pacientes",
        variant: "destructive"
      });
    } finally {
      setProcessando(false);
    }
  };

  const copiarErrosParaAreaTransferencia = () => {
    const texto = [
      'SETORES NÃO ENCONTRADOS:',
      ...erros.setoresNaoEncontrados,
      '',
      'LEITOS NÃO ENCONTRADOS:',
      ...erros.leitosNaoEncontrados,
      '',
      'PACIENTES COM "TESTE" NO NOME:',
      ...erros.pacientesComTeste
    ].join('\n');

    navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado para área de transferência!"
    });
  };

  const resetarModal = () => {
    setArquivo(null);
    setDadosValidados([]);
    setErros({ setoresNaoEncontrados: [], leitosNaoEncontrados: [], pacientesComTeste: [] });
    setEstatisticas({ totalRegistros: 0, pacientesAguardandoRegulacao: 0, totalErros: 0 });
    setEtapa('upload');
  };

  const handleFechar = () => {
    resetarModal();
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Pacientes</DialogTitle>
        </DialogHeader>

        {etapa === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Selecione o arquivo Excel</p>
                <p className="text-sm text-muted-foreground">
                  Arquivo .xls ou .xlsx com os dados dos pacientes
                </p>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleUploadArquivo}
                  className="hidden"
                  id="arquivo-upload"
                />
                <label htmlFor="arquivo-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>Escolher Arquivo</span>
                  </Button>
                </label>
              </div>
            </div>

            {arquivo && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{arquivo.name}</span>
                </div>
                <Button onClick={processarArquivo} disabled={processando}>
                  {processando ? 'Processando...' : 'Processar Arquivo'}
                </Button>
              </div>
            )}
          </div>
        )}

        {etapa === 'validacao' && (
          <div className="space-y-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total de Registros</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{estatisticas.totalRegistros}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Aguardando Regulação</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">{estatisticas.pacientesAguardandoRegulacao}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total de Erros</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">{estatisticas.totalErros}</p>
                </CardContent>
              </Card>
            </div>

            {/* Erros encontrados */}
            {estatisticas.totalErros > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Erros encontrados que precisam ser corrigidos:</p>
                    
                    {erros.setoresNaoEncontrados.length > 0 && (
                      <div>
                        <p className="font-medium text-sm">Setores não encontrados ({erros.setoresNaoEncontrados.length}):</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {erros.setoresNaoEncontrados.map((setor, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {setor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {erros.leitosNaoEncontrados.length > 0 && (
                      <div>
                        <p className="font-medium text-sm">Leitos não encontrados ({erros.leitosNaoEncontrados.length}):</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {erros.leitosNaoEncontrados.map((leito, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {leito}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {erros.pacientesComTeste.length > 0 && (
                      <div>
                        <p className="font-medium text-sm">Pacientes com "teste" no nome ({erros.pacientesComTeste.length}):</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {erros.pacientesComTeste.map((paciente, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {paciente}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={copiarErrosParaAreaTransferencia}
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

            {/* Botões de ação */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetarModal}>
                Importar Novo Arquivo
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleFechar}>
                  Cancelar
                </Button>
                <Button 
                  onClick={salvarPacientes} 
                  disabled={estatisticas.totalErros > 0 || processando}
                  className="min-w-[120px]"
                >
                  {processando ? 'Salvando...' : 'Salvar Pacientes'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {etapa === 'sucesso' && (
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">
                Importação Concluída com Sucesso!
              </h3>
              <p className="text-muted-foreground">
                {estatisticas.totalRegistros} pacientes foram importados para o sistema.
              </p>
            </div>
            <Button onClick={handleFechar}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalImportarPacientes;
