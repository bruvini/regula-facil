
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { doc, updateDoc, deleteField, serverTimestamp, collection, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertTriangle } from 'lucide-react';

interface ModalCancelarUTIProps {
  aberto: boolean;
  onFechar: () => void;
  paciente: {
    id: string;
    nomePaciente: string;
    setorNome?: string;
    tempoEspera: string;
    leitoDestino?: string;
    setorDestino?: any;
  };
  onSucesso: () => void;
}

const ModalCancelarUTI = ({ aberto, onFechar, paciente, onSucesso }: ModalCancelarUTIProps) => {
  const [motivo, setMotivo] = useState<string>('');
  const [localTransferencia, setLocalTransferencia] = useState('');
  const [dataTransferencia, setDataTransferencia] = useState('');
  const [motivoOutros, setMotivoOutros] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setMotivo('');
    setLocalTransferencia('');
    setDataTransferencia('');
    setMotivoOutros('');
  };

  const handleFechar = () => {
    resetForm();
    onFechar();
  };

  const registrarLog = async (mensagem: string) => {
    try {
      await addDoc(collection(db, 'logsRegulaFacil'), {
        tipo: 'cancelamento_uti',
        mensagem,
        pacienteId: paciente.id,
        timestamp: serverTimestamp(),
        usuario: 'Sistema' // TODO: Implementar autenticação
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const liberarLeitoReservado = async (batch: any) => {
    if (paciente.leitoDestino) {
      try {
        // Encontrar o leito reservado e liberar
        const leitoRef = doc(db, 'leitosRegulaFacil', paciente.leitoDestino);
        batch.update(leitoRef, {
          status: 'vago',
          dataUltimaAtualizacaoStatus: serverTimestamp()
        });
      } catch (error) {
        console.error('Erro ao liberar leito reservado:', error);
      }
    }
  };

  const handleConfirmar = async () => {
    if (!motivo) return;
    
    if (motivo === 'transferencia' && (!localTransferencia || !dataTransferencia)) return;
    if (motivo === 'outros' && !motivoOutros) return;

    setLoading(true);

    try {
      const batch = writeBatch(db);
      const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);

      // Liberar leito reservado se houver
      await liberarLeitoReservado(batch);

      // Atualizar documento do paciente
      batch.update(pacienteRef, {
        aguardaUTI: deleteField(),
        dataPedidoUTI: deleteField(),
        leitoDestino: deleteField(),
        setorDestino: deleteField()
      });

      await batch.commit();

      // Registrar log específico por motivo
      let mensagemLog = '';
      const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      switch (motivo) {
        case 'alta':
          mensagemLog = `Pedido de UTI cancelado para o paciente ${paciente.nomePaciente}, setor ${paciente.setorNome}, após ${paciente.tempoEspera} por motivo: Alta em ${agora}.`;
          break;
        case 'obito':
          mensagemLog = `Pedido de UTI cancelado para o paciente ${paciente.nomePaciente}, setor ${paciente.setorNome}, após ${paciente.tempoEspera} por motivo: Óbito em ${agora}.`;
          break;
        case 'transferencia':
          mensagemLog = `Pedido de UTI cancelado para ${paciente.nomePaciente} após transferência para ${localTransferencia} em ${new Date(dataTransferencia).toLocaleString('pt-BR')}, após ${paciente.tempoEspera}.`;
          break;
        case 'outros':
          mensagemLog = `Pedido de UTI cancelado para ${paciente.nomePaciente} após ${paciente.tempoEspera} por motivo: ${motivoOutros}.`;
          break;
      }

      await registrarLog(mensagemLog);
      onSucesso();
      handleFechar();
    } catch (error) {
      console.error('Erro ao cancelar pedido de UTI:', error);
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
            Cancelar Pedido de UTI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja cancelar o pedido de UTI para <strong>{paciente.nomePaciente}</strong>?
          </p>

          <div className="space-y-3">
            <Label>Motivo do cancelamento:</Label>
            <RadioGroup value={motivo} onValueChange={setMotivo}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alta" id="alta" />
                <Label htmlFor="alta">Alta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="obito" id="obito" />
                <Label htmlFor="obito">Óbito</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="transferencia" id="transferencia" />
                <Label htmlFor="transferencia">Transferência</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outros" id="outros" />
                <Label htmlFor="outros">Outros</Label>
              </div>
            </RadioGroup>
          </div>

          {motivo === 'transferencia' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="local">Para onde foi transferido?</Label>
                <Input
                  id="local"
                  value={localTransferencia}
                  onChange={(e) => setLocalTransferencia(e.target.value)}
                  placeholder="Local da transferência"
                />
              </div>
              <div>
                <Label htmlFor="data">Data/hora da transferência</Label>
                <Input
                  id="data"
                  type="datetime-local"
                  value={dataTransferencia}
                  onChange={(e) => setDataTransferencia(e.target.value)}
                />
              </div>
            </div>
          )}

          {motivo === 'outros' && (
            <div>
              <Label htmlFor="motivo-outros">Motivo</Label>
              <Input
                id="motivo-outros"
                value={motivoOutros}
                onChange={(e) => setMotivoOutros(e.target.value)}
                placeholder="Descreva o motivo"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={loading || !motivo || 
              (motivo === 'transferencia' && (!localTransferencia || !dataTransferencia)) ||
              (motivo === 'outros' && !motivoOutros)
            }
          >
            {loading ? 'Processando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalCancelarUTI;
