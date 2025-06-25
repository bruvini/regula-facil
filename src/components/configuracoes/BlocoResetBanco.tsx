
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

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

  const confirmarReset = async () => {
    setProcessando(true);
    setProgresso(0);

    try {
      const snapshot = await getDocs(collection(db, colecaoSelecionada));
      const total = snapshot.size;
      let processados = 0;

      // Processar em lotes de 10 documentos
      const batch = writeBatch(db);
      const promises: Promise<void>[] = [];

      snapshot.docs.forEach((documento, index) => {
        batch.delete(documento.ref);
        
        // Executar batch a cada 10 documentos ou no último documento
        if ((index + 1) % 10 === 0 || index === snapshot.docs.length - 1) {
          promises.push(
            batch.commit().then(() => {
              processados += Math.min(10, snapshot.docs.length - processados);
              setProgresso((processados / total) * 100);
            })
          );
        }
      });

      await Promise.all(promises);

      // Registrar log
      await addDoc(collection(db, 'logsSistemaRegulaFacil'), {
        acao: 'Resetar base de dados',
        alvo: colecaoSelecionada,
        descricao: `Coleção resetada com sucesso. Total de documentos excluídos: ${total}`,
        pagina: 'Configurações',
        timestamp: serverTimestamp(),
        usuario: 'Sistema'
      });

      toast({
        title: "Reset concluído",
        description: `${total} documentos foram excluídos da coleção ${colecaoSelecionada}.`,
      });

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
                  Limpando documentos... aguarde
                </p>
                <Progress value={progresso} className="w-full" />
                <p className="text-xs text-gray-500 text-center">
                  {Math.round(progresso)}% concluído
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Esta ação irá excluir <strong>{totalDocumentos}</strong> documentos da coleção{' '}
                <strong>{colecaoSelecionada}</strong>. Esta ação é irreversível. Deseja continuar?
              </p>
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
