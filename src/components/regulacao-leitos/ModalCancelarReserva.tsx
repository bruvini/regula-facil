
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { doc, updateDoc, deleteField, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { registrarLog } from '@/lib/logger';
import { AlertTriangle } from 'lucide-react';

interface ModalCancelarReservaProps {
  aberto: boolean;
  onFechar: () => void;
  paciente: {
    id: string;
    nomePaciente: string;
    leitoDestino?: string;
  };
  onSucesso: () => void;
}

const ModalCancelarReserva = ({ aberto, onFechar, paciente, onSucesso }: ModalCancelarReservaProps) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFechar = () => {
    setMotivo('');
    onFechar();
  };


  const handleConfirmar = async () => {
    if (!motivo.trim()) return;

    setLoading(true);

    try {
      const batch = writeBatch(db);
      
      // Atualizar paciente
      const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
      batch.update(pacienteRef, {
        leitoDestino: deleteField(),
        setorDestino: deleteField()
      });

      // Liberar leito se houver
      if (paciente.leitoDestino) {
        const leitoRef = doc(db, 'leitosRegulaFacil', paciente.leitoDestino);
        batch.update(leitoRef, {
          status: 'vago',
          dataUltimaAtualizacaoStatus: serverTimestamp()
        });
      }

      await batch.commit();

      // Registrar log
      const mensagemLog = `Reserva de leito ${paciente.leitoDestino} para paciente ${paciente.nomePaciente} cancelada. Motivo: ${motivo}.`;
      await registrarLog({
        pagina: 'Regulação de Leitos',
        acao: 'Cancelar reserva de leito',
        alvo: paciente.leitoDestino || '',
        descricao: mensagemLog,
        usuario: 'Sistema'
      });

      onSucesso();
      handleFechar();
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Cancelar Reserva de Leito
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Qual o motivo do cancelamento da reserva para <strong>{paciente.nomePaciente}</strong>?
          </p>

          <div>
            <Label htmlFor="motivo">Motivo (obrigatório)</Label>
            <Input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo do cancelamento"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={loading || !motivo.trim()}
          >
            {loading ? 'Processando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalCancelarReserva;
