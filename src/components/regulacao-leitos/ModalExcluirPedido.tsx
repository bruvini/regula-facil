
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { registrarLog } from '@/lib/logger';
import { AlertTriangle } from 'lucide-react';

interface ModalExcluirPedidoProps {
  aberto: boolean;
  onFechar: () => void;
  pedido: {
    id: string;
    nomePaciente: string;
  };
  onSucesso: () => void;
}

const ModalExcluirPedido = ({ aberto, onFechar, pedido, onSucesso }: ModalExcluirPedidoProps) => {
  const [loading, setLoading] = useState(false);

  const handleConfirmar = async () => {
    setLoading(true);

    try {
      // Excluir o pedido
      await deleteDoc(doc(db, 'pedidosCirurgia', pedido.id));

      // Registrar log
      const logTexto = `Pedido de cirurgia excluído para ${pedido.nomePaciente} em ${new Date().toLocaleString('pt-BR')}`;
      
      await registrarLog({
        pagina: 'Marcação Cirúrgica',
        acao: 'Excluir Pedido',
        alvo: pedido.nomePaciente,
        descricao: logTexto,
        usuario: 'Sistema'
      });

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Excluir Pedido de Cirurgia
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir o pedido de cirurgia para <strong>{pedido.nomePaciente}</strong>?
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmar}
            disabled={loading}
          >
            {loading ? 'Excluindo...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalExcluirPedido;
