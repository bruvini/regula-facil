
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ModalBloquearLeitoProps {
  aberto: boolean;
  onFechar: () => void;
  leitoId: string;
  onBloquear: (leitoId: string, motivo: string) => Promise<void>;
}

const ModalBloquearLeito = ({ aberto, onFechar, leitoId, onBloquear }: ModalBloquearLeitoProps) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirmar = async () => {
    if (!motivo.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo do bloqueio.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onBloquear(leitoId, motivo.trim());
      toast({
        title: "Leito bloqueado",
        description: "O leito foi bloqueado com sucesso."
      });
      onFechar();
      setMotivo('');
    } catch (error) {
      console.error('Erro ao bloquear leito:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao bloquear o leito.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFechar = () => {
    setMotivo('');
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bloquear Leito</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do bloqueio *</Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo do bloqueio..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={loading}>
            {loading ? 'Bloqueando...' : 'Confirmar Bloqueio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalBloquearLeito;
