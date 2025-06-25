
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { collection, getDocs, writeBatch, addDoc, serverTimestamp, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { toast as toastSonner } from '@/components/ui/sonner';

const BlocoResetBanco = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [colecaoSelecionada, setColecaoSelecionada] = useState<string>('');
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [totalDocumentos, setTotalDocumentos] = useState(0);
  const { toast } = useToast();

  const abrirModal = async (colecao: string) => {
    setColecaoSelecionada(colecao);
    
    // Contar documentos da coleção
    try {
      const snapshot = await getDocs(collection(db, colecao));
      setTotalDocumentos(snapshot.size);
      setModalAberto(true);
    } catch (error) {
      console.error('Erro ao contar documentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a coleção.",
        variant: "destructive",
      });
    }
  };

  const liberarLeitosVinculados = async (pacientes: any[]) => {
    const leitosParaAtualizar: Array<{ leitoId: string; updates: any }> = [];
    
    // Identificar leitos que precisam ser liberados
    for (const pacienteDoc of pacientes) {
      const pacienteData = pacienteDoc.data();
      if (pacienteData.leitoAtualPaciente) {
        // Buscar o leito correspondente pelo código
        const leitosQuery = query(
          collection(db, 'leitosRegulaFacil'),
          where('codigo', '==', pacienteData.leitoAtualPaciente)
        );
        
        const leitosSnapshot = await getDocs(leitosQuery);
        
        if (!leitosSnapshot.empty) {
          const leitoDoc = leitosSnapshot.docs[0];
          leitosParaAtualizar.push({
            leitoId: leitoDoc.id,
            updates: {
              status: 'vago',
              nomePaciente: null,
              sexoPaciente: null,
              diagnosticoPaciente: null,
              pacienteAtual: null,
              dataUltimaAtualizacaoStatus: new Date()
            }
          });
        }
      }
    }

    // Atualizar os leitos em lotes
    if (leitosParaAtualizar.length > 0) {
      const BATCH_SIZE = 500;
      for (let i = 0; i < leitosParaAtualizar.length; i += BATCH_SIZE) {
        const batchLeitos = leitosParaAtualizar.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        batchLeitos.forEach(({ leitoId, updates }) => {
          const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
          batch.update(leitoRef, updates);
        });

        await batch.commit();
      }
    }

    return leitosParaAtualizar.length;
  };

  const confirmarReset = async () => {
    setProcessando(true);
    setProgresso(0);

    try {
      const snapshot = await getDocs(collection(db, colecaoSelecionada));
      const docs = snapshot.docs;
      const total = docs.length;
      let processados = 0;
      let leitosLiberados = 0;

      // Se for reset de pacientes, liberar leitos primeiro
      if (colecaoSelecionada === 'pacientesRegulaFacil') {
        leitosLiberados = await liberarLeitosVinculados(docs);
        setProgresso(25); // 25% para liberação dos leitos
      }

      const BATCH_SIZE = 500;
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batchDocs = docs.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        batchDocs.forEach((documento) => batch.delete(documento.ref));

        await batch.commit();
        processados += batchDocs.length;
        
        // Ajustar progresso considerando a liberação de leitos (se aplicável)
        const baseProgress = colecaoSelecionada === 'pacientesRegulaFacil' ? 25 : 0;
        const deleteProgress = ((processados / total) * (100 - baseProgress));
        setProgresso(baseProgress + deleteProgress);
      }

      // Registrar log
      const descricaoLog = colecaoSelecionada === 'pacientesRegulaFacil' 
        ? `${total} documentos excluídos da coleção ${colecaoSelecionada} e ${leitosLiberados} leitos liberados`
        : `${total} documentos excluídos da coleção ${colecaoSelecionada}`;

      await addDoc(collection(db, 'logsSistemaRegulaFacil'), {
        acao: 'Resetar banco de dados',
        alvo: colecaoSelecionada,
        descricao: descricaoLog,
        pagina: 'Configurações',
        timestamp: serverTimestamp(),
        usuario: 'Sistema'
      });

      const mensagemSucesso = colecaoSelecionada === 'pacientesRegulaFacil'
        ? `Coleção ${colecaoSelecionada} resetada com sucesso! ${total} documentos excluídos e ${leitosLiberados} leitos liberados.`
        : `Coleção ${colecaoSelecionada} resetada com sucesso! ${total} documentos excluídos.`;

      toastSonner.success(mensagemSucesso);

    } catch (error) {
      console.error('Erro ao resetar coleção:', error);
      toast({
        title: "Erro no reset",
        description: "Não foi possível completar o reset da coleção.",
        variant: "destructive",
      });
    } finally {
      setProcessando(false);
      setModalAberto(false);
      setProgresso(0);
    }
  };

  const fecharModal = () => {
    if (!processando) {
      setModalAberto(false);
      setProgresso(0);
    }
  };

  return (
    <>
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Reset do Banco de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-700 mb-4">
            <strong>Atenção:</strong> Estas operações são irreversíveis e irão excluir todos os dados das coleções selecionadas.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="destructive"
              onClick={() => abrirModal('pacientesRegulaFacil')}
              className="flex items-center gap-2"
              disabled={processando}
            >
              <RefreshCw className="h-4 w-4" />
              Resetar pacientesRegulaFacil
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => abrirModal('logsSistemaRegulaFacil')}
              className="flex items-center gap-2"
              disabled={processando}
            >
              <Trash2 className="h-4 w-4" />
              Resetar logsSistemaRegulaFacil
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={fecharModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Reset
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {processando ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {colecaoSelecionada === 'pacientesRegulaFacil' && progresso < 25
                    ? 'Liberando leitos vinculados...'
                    : 'Excluindo documentos...'}
                </p>
                <Progress value={progresso} className="w-full" />
                <p className="text-xs text-gray-500 text-center">
                  {Math.round(progresso)}% concluído
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Esta ação irá excluir <strong>{totalDocumentos}</strong> documentos da coleção{' '}
                  <strong>{colecaoSelecionada}</strong>. Esta ação é irreversível.
                </p>
                {colecaoSelecionada === 'pacientesRegulaFacil' && (
                  <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Nota:</strong> Os leitos vinculados aos pacientes serão automaticamente liberados.
                  </p>
                )}
                <p className="text-sm text-gray-600">Deseja continuar?</p>
              </div>
            )}
          </div>

          {!processando && (
            <DialogFooter>
              <Button variant="outline" onClick={fecharModal}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmarReset}
              >
                Confirmar Reset
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BlocoResetBanco;
