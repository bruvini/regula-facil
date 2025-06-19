
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, query, where, orderBy, Timestamp, getDocs } from 'firebase/firestore';
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

      // Remove motivo when liberating blocked bed
      if (novoStatus === 'vago') {
        updateData.motivoBloqueio = null;
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

  const verificarDuplicidadeSigla = async (sigla: string, setorId?: string): Promise<boolean> => {
    try {
      const q = query(
        collection(db, 'setoresRegulaFacil'),
        where('sigla', '==', sigla)
      );
      const snapshot = await getDocs(q);
      
      // If editing, exclude the current sector
      if (setorId) {
        return snapshot.docs.some(doc => doc.id !== setorId);
      }
      
      return !snapshot.empty;
    } catch (err) {
      console.error('Erro ao verificar duplicidade de sigla:', err);
      return false;
    }
  };

  const verificarSetorTemLeitos = async (setorId: string): Promise<boolean> => {
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      const q = query(
        collection(db, 'leitosRegulaFacil'),
        where('setor', '==', setorRef)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (err) {
      console.error('Erro ao verificar leitos do setor:', err);
      return true; // Assume tem leitos para segurança
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
      // Verificar duplicidade de sigla
      const jaExiste = await verificarDuplicidadeSigla(setorData.sigla);
      if (jaExiste) {
        throw new Error(`Já existe um setor com a sigla "${setorData.sigla}"`);
      }

      await addDoc(collection(db, 'setoresRegulaFacil'), setorData);
      await adicionarLog('Mapa de Leitos', 'Adicionar setor', 'novo', `Setor ${setorData.sigla} adicionado`);
    } catch (err) {
      console.error('Erro ao adicionar setor:', err);
      throw err;
    }
  };

  const editarSetor = async (setorId: string, setorData: Partial<Setor>) => {
    try {
      // Verificar duplicidade de sigla se ela foi alterada
      if (setorData.sigla) {
        const jaExiste = await verificarDuplicidadeSigla(setorData.sigla, setorId);
        if (jaExiste) {
          throw new Error(`Já existe um setor com a sigla "${setorData.sigla}"`);
        }
      }

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, setorData);
      await adicionarLog('Mapa de Leitos', 'Editar setor', setorId, `Setor ${setorData.sigla} editado`);
    } catch (err) {
      console.error('Erro ao editar setor:', err);
      throw err;
    }
  };

  const excluirSetor = async (setorId: string) => {
    try {
      // Verificar se o setor tem leitos associados
      const temLeitos = await verificarSetorTemLeitos(setorId);
      if (temLeitos) {
        throw new Error('Não é possível excluir um setor que possui leitos associados');
      }

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await deleteDoc(setorRef);
      await adicionarLog('Mapa de Leitos', 'Excluir setor', setorId, `Setor excluído`);
    } catch (err) {
      console.error('Erro ao excluir setor:', err);
      throw err;
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

  const editarLeito = async (leitoId: string, leitoData: Partial<Leito>) => {
    try {
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      await updateDoc(leitoRef, leitoData);
      await adicionarLog('Mapa de Leitos', 'Editar leito', leitoId, `Leito ${leitoData.codigo} editado`);
    } catch (err) {
      console.error('Erro ao editar leito:', err);
      throw new Error('Erro ao editar leito');
    }
  };

  const excluirLeito = async (leitoId: string) => {
    try {
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      await deleteDoc(leitoRef);
      await adicionarLog('Mapa de Leitos', 'Excluir leito', leitoId, `Leito excluído`);
    } catch (err) {
      console.error('Erro ao excluir leito:', err);
      throw new Error('Erro ao excluir leito');
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

  const verificarPacientesAguardandoRegulacao = async (): Promise<boolean> => {
    try {
      const q = query(
        collection(db, 'pacientesRegulaFacil'),
        where('statusInternacao', '==', 'internado')
      );
      const snapshot = await getDocs(q);
      
      // Check if any patient has active regulation with status 'aguardando'
      for (const pacienteDoc of snapshot.docs) {
        const pacienteData = pacienteDoc.data();
        if (pacienteData.regulacaoAtual) {
          const regulacaoDoc = await getDoc(pacienteData.regulacaoAtual);
          if (regulacaoDoc.exists()) {
            const regulacaoData = regulacaoDoc.data();
            if (regulacaoData.status === 'aguardando') {
              return true;
            }
          }
        }
      }
      return false;
    } catch (err) {
      console.error('Erro ao verificar pacientes aguardando regulação:', err);
      return false;
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
    excluirSetor,
    adicionarLeito,
    editarLeito,
    excluirLeito,
    adicionarLeitosEmLote,
    verificarPacientesAguardandoRegulacao,
    adicionarLog
  };
};
