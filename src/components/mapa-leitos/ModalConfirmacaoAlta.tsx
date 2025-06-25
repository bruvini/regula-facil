
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ModalConfirmacaoAltaProps {
  aberto: boolean;
  onFechar: () => void;
  nomePaciente: string;
  leitoCodigo: string;
  onConfirmar: () => void;
  loading?: boolean;
}

const ModalConfirmacaoAlta = ({ 
  aberto,
  onFechar,
  nomePaciente,
  leitoCodigo,
  onConfirmar,
  loading = false
}: ModalConfirmacaoAltaProps) => {
  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Confirmação de Alta
          </DialogTitle>
          <DialogDescription className="text-left">
            Tem certeza que deseja dar alta para
            <br />
            <strong className="text-foreground">{nomePaciente}</strong> no leito{' '}
            <strong className="text-foreground">{leitoCodigo}</strong>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onConfirmar} disabled={loading}>
            {loading ? 'Processando...' : 'Confirmar Alta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalConfirmacaoAlta;
