import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Leito, Setor, Paciente, LeitoWithData, LogSistema } from '@/types/firestore';

interface IsolamentoTipo {
  id: string;
  tipo: string;
}

export const useMapaLeitos = () => {
  const [leitos, setLeitos] = useState<LeitoWithData[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [isolamentoTipos, setIsolamentoTipos] = useState<IsolamentoTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar tipos de isolamento
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'isolamentosRegulaFacil'),
      (snapshot) => {
        const tipos = snapshot.docs.map(doc => ({
          id: doc.id,
          tipo: doc.data().tipo
        })) as IsolamentoTipo[];
        setIsolamentoTipos(tipos);
      },
      (err) => {
        console.error('Erro ao carregar tipos de isolamento:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Carregar setores
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'setoresRegulaFacil'),
      (snapshot) => {
        const setoresData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Setor[];
        setSetores(setoresData);
      },
      (err) => {
        console.error('Erro ao carregar setores:', err);
        setError('Erro ao carregar setores');
      }
    );

    return () => unsubscribe();
  }, []);

  // Carregar leitos com dados relacionados
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'leitosRegulaFacil'), orderBy('codigo')),
      async (snapshot) => {
        try {
          const leitosData = await Promise.all(
            snapshot.docs.map(async (leitoDoc) => {
              const leitoData = { id: leitoDoc.id, ...leitoDoc.data() } as Leito;
              
              // Buscar dados do setor
              let setorData: Setor | undefined;
              if (leitoData.setor) {
                const setorDoc = await getDoc(leitoData.setor);
                if (setorDoc.exists()) {
                  setorData = { id: setorDoc.id, ...setorDoc.data() } as Setor;
                }
              }

              // Buscar dados do paciente
              let pacienteData: Paciente | undefined;
              if (leitoData.pacienteAtual) {
                const pacienteDoc = await getDoc(leitoData.pacienteAtual);
                if (pacienteDoc.exists()) {
                  pacienteData = { id: pacienteDoc.id, ...pacienteDoc.data() } as Paciente;
                }
              }

              return {
                ...leitoData,
                setorData,
                pacienteData
              } as LeitoWithData;
            })
          );

          setLeitos(leitosData);
          setLoading(false);
        } catch (err) {
          console.error('Erro ao carregar leitos:', err);
          setError('Erro ao carregar leitos');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Erro ao carregar leitos:', err);
        setError('Erro ao carregar leitos');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const atualizarStatusLeito = async (leitoId: string, novoStatus: Leito['status'], motivo?: string) => {
    try {
      const updateData: any = {
        status: novoStatus,
        dataUltimaAtualizacaoStatus: Timestamp.now()
      };

      // Add motivo if blocking
      if (novoStatus === 'bloqueado' && motivo) {
        updateData.motivoBloqueio = motivo;
      }

      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      await updateDoc(leitoRef, updateData);

      // Registrar log
      await adicionarLog('Mapa de Leitos', `Alterar status para ${novoStatus}`, leitoId, `Status alterado para ${novoStatus}${motivo ? ` - Motivo: ${motivo}` : ''}`);
    } catch (err) {
      console.error('Erro ao atualizar status do leito:', err);
      throw new Error('Erro ao atualizar status do leito');
    }
  };

  const bloquearLeito = async (leitoId: string, motivo: string) => {
    await atualizarStatusLeito(leitoId, 'bloqueado', motivo);
  };

  const regularPaciente = async (pacienteId: string, leitoId: string) => {
    try {
      // Update bed status to occupied
      await atualizarStatusLeito(leitoId, 'ocupado');
      
      // Update patient's current bed
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      
      await updateDoc(pacienteRef, {
        leitoAtual: leitoRef
      });

      // Update bed's current patient
      await updateDoc(leitoRef, {
        pacienteAtual: doc(db, 'pacientesRegulaFacil', pacienteId)
      });

      await adicionarLog('Mapa de Leitos', 'Regular paciente', leitoId, `Paciente ${pacienteId} regulado para leito ${leitoId}`);
    } catch (err) {
      console.error('Erro ao regular paciente:', err);
      throw new Error('Erro ao regular paciente');
    }
  };

  const adicionarLog = async (pagina: string, acao: string, alvo: string, descricao: string) => {
    try {
      await addDoc(collection(db, 'logsSistemaRegulaFacil'), {
        pagina,
        acao,
        alvo,
        usuario: 'Usuário Atual', // TODO: Implementar usuário real
        timestamp: Timestamp.now(),
        descricao
      });
    } catch (err) {
      console.error('Erro ao adicionar log:', err);
    }
  };

  const adicionarSetor = async (setorData: Omit<Setor, 'id'>) => {
    try {
      await addDoc(collection(db, 'setoresRegulaFacil'), setorData);
      await adicionarLog('Mapa de Leitos', 'Adicionar setor', 'novo', `Setor ${setorData.sigla} adicionado`);
    } catch (err) {
      console.error('Erro ao adicionar setor:', err);
      throw new Error('Erro ao adicionar setor');
    }
  };

  const editarSetor = async (setorId: string, setorData: Partial<Setor>) => {
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, setorData);
      await adicionarLog('Mapa de Leitos', 'Editar setor', setorId, `Setor ${setorData.sigla} editado`);
    } catch (err) {
      console.error('Erro ao editar setor:', err);
      throw new Error('Erro ao editar setor');
    }
  };

  const adicionarLeito = async (leitoData: Omit<Leito, 'id' | 'dataUltimaAtualizacaoStatus'>) => {
    try {
      await addDoc(collection(db, 'leitosRegulaFacil'), {
        ...leitoData,
        dataUltimaAtualizacaoStatus: Timestamp.now()
      });
      await adicionarLog('Mapa de Leitos', 'Adicionar leito', 'novo', `Leito ${leitoData.codigo} adicionado`);
    } catch (err) {
      console.error('Erro ao adicionar leito:', err);
      throw new Error('Erro ao adicionar leito');
    }
  };

  const adicionarLeitosEmLote = async (leitosData: Array<Omit<Leito, 'id' | 'dataUltimaAtualizacaoStatus'>>) => {
    try {
      const promises = leitosData.map(leitoData => 
        addDoc(collection(db, 'leitosRegulaFacil'), {
          ...leitoData,
          dataUltimaAtualizacaoStatus: Timestamp.now()
        })
      );
      await Promise.all(promises);
      await adicionarLog('Mapa de Leitos', 'Adicionar leitos em lote', 'novo', `${leitosData.length} leitos adicionados`);
    } catch (err) {
      console.error('Erro ao adicionar leitos em lote:', err);
      throw new Error('Erro ao adicionar leitos em lote');
    }
  };

  return {
    leitos,
    setores,
    isolamentoTipos,
    loading,
    error,
    atualizarStatusLeito,
    bloquearLeito,
    regularPaciente,
    adicionarSetor,
    editarSetor,
    adicionarLeito,
    adicionarLeitosEmLote,
    adicionarLog
  };
};
