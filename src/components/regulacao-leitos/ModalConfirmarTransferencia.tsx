
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { doc, updateDoc, deleteField, serverTimestamp, collection, addDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle } from 'lucide-react';

interface ModalConfirmarTransferenciaProps {
  aberto: boolean;
  onFechar: () => void;
  paciente: {
    id: string;
    nomePaciente: string;
    leitoDestino?: string;
    leitoAtualPaciente?: any;
    dataPedidoUTI?: any;
  };
  onSucesso: () => void;
}

const ModalConfirmarTransferencia = ({ aberto, onFechar, paciente, onSucesso }: ModalConfirmarTransferenciaProps) => {
  const [loading, setLoading] = useState(false);

  const calcularTempoEspera = (dataPedido: any) => {
    if (!dataPedido) return '0h 0min';
    const agora = new Date();
    const inicio = dataPedido.toDate ? dataPedido.toDate() : new Date(dataPedido);
    const diff = agora.getTime() - inicio.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}min`;
  };

  const registrarLog = async (mensagem: string) => {
    try {
      await addDoc(collection(db, 'logsRegulaFacil'), {
        tipo: 'transferencia_uti',
        mensagem,
        pacienteId: paciente.id,
        timestamp: serverTimestamp(),
        usuario: 'Sistema'
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const handleConfirmar = async () => {
    if (!paciente.leitoDestino) return;

    setLoading(true);

    try {
      const batch = writeBatch(db);
      
      // Buscar código do leito destino
      let codigoLeitoDestino = '';
      try {
        const leitoDestinoDoc = await getDoc(doc(db, 'leitosRegulaFacil', paciente.leitoDestino));
        if (leitoDestinoDoc.exists()) {
          codigoLeitoDestino = (leitoDestinoDoc.data() as any)?.codigo || '';
        }
      } catch (error) {
        console.error('Erro ao buscar código do leito destino:', error);
      }

      // Atualizar paciente
      const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
      const setorUTIRef = doc(db, 'setoresRegulaFacil', '7UKUgMtFvxAdCSxLmea7');
      
      batch.update(pacienteRef, {
        leitoAtualPaciente: doc(db, 'leitosRegulaFacil', paciente.leitoDestino),
        setorAtualPaciente: setorUTIRef,
        leitoDestino: deleteField(),
        setorDestino: deleteField(),
        aguardaUTI: deleteField(),
        dataPedidoUTI: deleteField()
      });

      // Atualizar leito anterior (se houver)
      if (paciente.leitoAtualPaciente) {
        const leitoAnteriorRef = paciente.leitoAtualPaciente;
        batch.update(leitoAnteriorRef, {
          status: 'limpeza',
          dataUltimaAtualizacaoStatus: serverTimestamp()
        });
      }

      // Atualizar leito de destino
      const leitoDestinoRef = doc(db, 'leitosRegulaFacil', paciente.leitoDestino);
      batch.update(leitoDestinoRef, {
        status: 'ocupado',
        dataUltimaAtualizacaoStatus: serverTimestamp()
      });

      await batch.commit();

      // Registrar log
      const tempoEspera = calcularTempoEspera(paciente.dataPedidoUTI);
      const mensagemLog = `Transferência para leito ${codigoLeitoDestino} confirmada para paciente ${paciente.nomePaciente} após ${tempoEspera}.`;
      await registrarLog(mensagemLog);

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro ao confirmar transferência:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Confirmar Transferência para UTI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Confirmar que <strong>{paciente.nomePaciente}</strong> foi transferido para a UTI?
          </p>
          <p className="text-xs text-gray-500">
            Esta ação irá atualizar o leito atual do paciente e liberar o leito anterior para limpeza.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Processando...' : 'Confirmar Transferência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalConfirmarTransferencia;
