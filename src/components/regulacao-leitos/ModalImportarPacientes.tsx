
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import ModalInstrucoesImportacao from './ModalInstrucoesImportacao';
import ImportacaoUpload from './ImportacaoUpload';
import ImportacaoValidacao from './ImportacaoValidacao';
import ImportacaoConfirmacao from './ImportacaoConfirmacao';
import ImportacaoSucesso from './ImportacaoSucesso';
import { PacienteImportado, ResultadoImportacao } from '@/types/importacao';

interface ModalImportarPacientesProps {
  aberto: boolean;
  onFechar: () => void;
}

type EtapaImportacao = 'upload' | 'validacao' | 'confirmacao' | 'sucesso';

const ModalImportarPacientes = ({ aberto, onFechar }: ModalImportarPacientesProps) => {
  const [etapa, setEtapa] = useState<EtapaImportacao>('upload');
  const [dadosValidados, setDadosValidados] = useState<PacienteImportado[]>([]);
  const [resultadoImportacao, setResultadoImportacao] = useState<ResultadoImportacao | null>(null);
  const [modalInstrucoesAberto, setModalInstrucoesAberto] = useState(false);

  const resetarModal = () => {
    setEtapa('upload');
    setDadosValidados([]);
    setResultadoImportacao(null);
  };

  const handleFechar = () => {
    resetarModal();
    onFechar();
  };

  const avancarParaValidacao = (dados: PacienteImportado[]) => {
    setDadosValidados(dados);
    setEtapa('validacao');
  };

  const avancarParaConfirmacao = () => {
    setEtapa('confirmacao');
  };

  const finalizarImportacao = (resultado: ResultadoImportacao) => {
    setResultadoImportacao(resultado);
    setEtapa('sucesso');
  };

  return (
    <>
      <Dialog open={aberto} onOpenChange={handleFechar}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Importar Pacientes - Atualização Inteligente
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalInstrucoesAberto(true)}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Como Baixar Planilha
              </Button>
            </DialogTitle>
          </DialogHeader>

          {etapa === 'upload' && (
            <ImportacaoUpload onProximaEtapa={avancarParaValidacao} />
          )}

          {etapa === 'validacao' && (
            <ImportacaoValidacao 
              dadosValidados={dadosValidados}
              onVoltar={() => setEtapa('upload')}
              onProximaEtapa={avancarParaConfirmacao}
            />
          )}

          {etapa === 'confirmacao' && (
            <ImportacaoConfirmacao
              dadosValidados={dadosValidados}
              onVoltar={() => setEtapa('validacao')}
              onFinalizar={finalizarImportacao}
            />
          )}

          {etapa === 'sucesso' && resultadoImportacao && (
            <ImportacaoSucesso
              resultado={resultadoImportacao}
              onFechar={handleFechar}
            />
          )}
        </DialogContent>
      </Dialog>

      <ModalInstrucoesImportacao 
        aberto={modalInstrucoesAberto}
        onFechar={() => setModalInstrucoesAberto(false)}
      />
    </>
  );
};

export default ModalImportarPacientes;
