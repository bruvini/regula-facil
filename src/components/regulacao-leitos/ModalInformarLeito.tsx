
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Hospital, Bed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeitoDisponivel {
  id: string;
  codigo: string;
  setorNome: string;
}

interface ModalInformarLeitoProps {
  aberto: boolean;
  onFechar: () => void;
  paciente: {
    id: string;
    nomePaciente: string;
  };
  onSucesso: () => void;
}

const ModalInformarLeito = ({ aberto, onFechar, paciente, onSucesso }: ModalInformarLeitoProps) => {
  const [leitosDisponiveis, setLeitosDisponiveis] = useState<LeitoDisponivel[]>([]);
  const [leitoSelecionado, setLeitoSelecionado] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [carregandoLeitos, setCarregandoLeitos] = useState(false);

  const carregarLeitosDisponiveis = async () => {
    setCarregandoLeitos(true);
    try {
      // Referência do setor UTI
      const setorUTIRef = doc(db, 'setoresRegulaFacil', '7UKUgMtFvxAdCSxLmea7');
      
      // Buscar leitos vagos da UTI
      const leitosQuery = query(
        collection(db, 'leitosRegulaFacil'),
        where('setor', '==', setorUTIRef),
        where('status', '==', 'vago')
      );

      const leitosSnapshot = await getDocs(leitosQuery);
      
      // Buscar dados do setor para obter o nome
      const setorDoc = await getDoc(setorUTIRef);
      const setorData = setorDoc.exists() ? setorDoc.data() as { sigla?: string; nomeCompleto?: string } : null;
      const setorNome = setorData?.sigla || setorData?.nomeCompleto || 'UTI';

      const leitos: LeitoDisponivel[] = leitosSnapshot.docs.map(doc => ({
        id: doc.id,
        codigo: (doc.data() as any).codigo || '',
        setorNome
      }));

      setLeitosDisponiveis(leitos);
    } catch (error) {
      console.error('Erro ao carregar leitos disponíveis:', error);
    } finally {
      setCarregandoLeitos(false);
    }
  };

  useEffect(() => {
    if (aberto) {
      carregarLeitosDisponiveis();
    }
  }, [aberto]);

  const handleFechar = () => {
    setLeitoSelecionado('');
    onFechar();
  };

  const handleConfirmar = async () => {
    if (!leitoSelecionado) return;

    setLoading(true);

    try {
      const batch = writeBatch(db);
      
      // Atualizar paciente
      const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
      const setorUTIRef = doc(db, 'setoresRegulaFacil', '7UKUgMtFvxAdCSxLmea7');
      
      batch.update(pacienteRef, {
        leitoDestino: leitoSelecionado,
        setorDestino: setorUTIRef
      });

      // Atualizar leito
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoSelecionado);
      batch.update(leitoRef, {
        status: 'reservado',
        dataUltimaAtualizacaoStatus: serverTimestamp()
      });

      await batch.commit();
      
      onSucesso();
      handleFechar();
    } catch (error) {
      console.error('Erro ao informar leito:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hospital className="h-5 w-5 text-green-500" />
            Informar Leito UTI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecione o leito UTI para <strong>{paciente.nomePaciente}</strong>:
          </p>

          {carregandoLeitos ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Carregando leitos disponíveis...</p>
            </div>
          ) : leitosDisponiveis.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Nenhum leito disponível na UTI no momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Leitos disponíveis:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {leitosDisponiveis.map((leito) => (
                  <div
                    key={leito.id}
                    className={cn(
                      "p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50",
                      leitoSelecionado === leito.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    )}
                    onClick={() => setLeitoSelecionado(leito.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        leitoSelecionado === leito.id
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300"
                      )}>
                        {leitoSelecionado === leito.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <Bed className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          Leito {leito.codigo}
                        </div>
                        <div className="text-sm text-gray-500">
                          {leito.setorNome}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={loading || !leitoSelecionado || leitosDisponiveis.length === 0}
          >
            {loading ? 'Processando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalInformarLeito;
