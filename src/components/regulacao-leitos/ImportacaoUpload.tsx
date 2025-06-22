
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { PacienteImportado } from '@/types/importacao';

interface ImportacaoUploadProps {
  onProximaEtapa: (dados: PacienteImportado[]) => void;
}

const ImportacaoUpload = ({ onProximaEtapa }: ImportacaoUploadProps) => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('');
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
    setProgresso(0);
    
    try {
      setMensagemProgresso('Lendo planilha...');
      setProgresso(10);
      
      const arrayBuffer = await arquivo.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      setProgresso(30);
      setMensagemProgresso('Processando dados dos pacientes...');
      
      // Pular as 3 primeiras linhas e processar a partir da linha 4
      const linhasProcessar = dados.slice(3);
      const pacientesValidos: PacienteImportado[] = [];
      
      const totalLinhas = linhasProcessar.length;
      
      for (let i = 0; i < linhasProcessar.length; i++) {
        const linha = linhasProcessar[i];
        
        // Atualizar progresso durante o processamento
        const progressoAtual = 30 + ((i / totalLinhas) * 60);
        setProgresso(Math.round(progressoAtual));
        
        // Ignorar linhas vazias
        if (!linha[0] || linha[0].toString().trim() === '') continue;

        const nomePaciente = linha[0]?.toString().trim();
        
        // Ignorar pacientes com "teste" no nome
        if (nomePaciente?.toLowerCase().includes('teste')) {
          continue;
        }

        const setorPaciente = linha[4]?.toString().trim();
        const leitoPaciente = linha[6]?.toString().trim();

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

      setProgresso(90);
      setMensagemProgresso('Finalizando leitura...');
      
      setTimeout(() => {
        setProgresso(100);
        onProximaEtapa(pacientesValidos);
      }, 500);

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique se o arquivo está no formato correto.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setProcessando(false);
        setProgresso(0);
        setMensagemProgresso('');
      }, 1000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium">Selecione o arquivo Excel</p>
          <p className="text-sm text-muted-foreground">
            Arquivo .xls ou .xlsx com os dados dos pacientes internados
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

      {processando && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{mensagemProgresso}</span>
            <span>{progresso}%</span>
          </div>
          <Progress value={progresso} className="w-full" />
        </div>
      )}
    </div>
  );
};

export default ImportacaoUpload;
