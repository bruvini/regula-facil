import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ModalRemanejamentoProps {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: (motivo: string) => void;
  loading?: boolean;
}

const ModalRemanejamento = ({ aberto, onFechar, onConfirmar, loading = false }: ModalRemanejamentoProps) => {
  const [motivo, setMotivo] = useState('');

  const handleConfirmar = () => {
    if (!motivo.trim()) return;
    onConfirmar(motivo.trim());
    setMotivo('');
  };

  const handleFechar = () => {
    setMotivo('');
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Remanejamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do remanejamento</Label>
            <Input
              id="motivo"
              placeholder="Descreva o motivo..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={loading || !motivo.trim()}>
            {loading ? 'Processando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalRemanejamento;
