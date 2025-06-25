
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, query, where, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { registrarLog } from '@/lib/logger';
import { Leito, Setor, Paciente, LeitoWithData, LogSistema } from '@/types/firestore';

interface IsolamentoTipo {
  id: string;
  tipo: string;
}

interface Regulacao {
  status: string;
  dataInicio?: any;
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
                  const setorDocData = setorDoc.data() as any;
                  setorData = {
                    id: setorDoc.id,
                    sigla: setorDocData.sigla || '',
                    nomeCompleto: setorDocData.nomeCompleto || '',
                    andar: setorDocData.andar || '',
                    tipo: setorDocData.tipo || '',
                    alertas: setorDocData.alertas || []
                  } as Setor;
                }
              }

              // Buscar dados do paciente utilizando o campo "leitoAtualPaciente"
              // que armazena o código do leito ocupado
              let pacienteData: Paciente | undefined;
              if (leitoData.status === 'ocupado') {
                try {
                  const pacientesQuery = query(
                    collection(db, 'pacientesRegulaFacil'),
                    where('leitoAtualPaciente', '==', leitoData.codigo)
                  );
                  const pacientesSnapshot = await getDocs(pacientesQuery);
                  
                  if (!pacientesSnapshot.empty) {
                    const pacienteDoc = pacientesSnapshot.docs[0];
                    const pacienteDocData = pacienteDoc.data();
                    
                    // Calcular idade baseado em dataNascimentoPaciente
                    let idade = 0;
                    if (pacienteDocData.dataNascimentoPaciente) {
                      let dataNasc: Date;
                      
                      // Se for um Timestamp do Firestore
                      if (pacienteDocData.dataNascimentoPaciente.toDate) {
                        dataNasc = pacienteDocData.dataNascimentoPaciente.toDate();
                      } 
                      // Se for uma string no formato dd/mm/yyyy
                      else if (typeof pacienteDocData.dataNascimentoPaciente === 'string') {
                        const [dia, mes, ano] = pacienteDocData.dataNascimentoPaciente.split('/');
                        dataNasc = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                      }
                      // Se for um objeto Date
                      else {
                        dataNasc = new Date(pacienteDocData.dataNascimentoPaciente);
                      }
                      
                      const hoje = new Date();
                      idade = hoje.getFullYear() - dataNasc.getFullYear();
                      const mesAtual = hoje.getMonth();
                      const mesNasc = dataNasc.getMonth();
                      if (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < dataNasc.getDate())) {
                        idade--;
                      }
                    }
                    
                    pacienteData = {
                      id: pacienteDoc.id,
                      nome: pacienteDocData.nomePaciente || '',
                      idade: idade,
                      sexo: pacienteDocData.sexoPaciente || 'M',
                      statusInternacao: pacienteDocData.statusInternacao || '',
                      isolamentosAtivos: pacienteDocData.isolamentosAtivos || [],
                      especialidade: pacienteDocData.especialidade || '',
                      statusRegulacao: pacienteDocData.statusRegulacao || '',
                      aguardaUTI: pacienteDocData.aguardaUTI || false,
                      dataPedidoUTI: pacienteDocData.dataPedidoUTI || null,
                      remanejarPaciente: pacienteDocData.remanejarPaciente || false,
                      motivoRemanejamento: pacienteDocData.motivoRemanejamento || '',
                      dataPedidoRemanejamento: pacienteDocData.dataPedidoRemanejamento || null
                    } as Paciente;
                  }
                } catch (err) {
                  console.error('Erro ao carregar dados do paciente:', err);
                }
              }

              const result: LeitoWithData = {
                id: leitoData.id,
                codigo: leitoData.codigo,
                setor: leitoData.setor,
                status: leitoData.status,
                tipo: leitoData.tipo,
                ehPCP: leitoData.ehPCP,
                pacienteAtual: leitoData.pacienteAtual,
                dataUltimaAtualizacaoStatus: leitoData.dataUltimaAtualizacaoStatus,
                motivoBloqueio: leitoData.motivoBloqueio,
                alertas: leitoData.alertas
              };

              if (setorData) {
                result.setorData = setorData;
              }

              if (pacienteData) {
                result.pacienteData = pacienteData;
              }

              return result;
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
      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: `Alterar status para ${novoStatus}`,
        alvo: leitoId,
        descricao: `Status alterado para ${novoStatus}${motivo ? ` - Motivo: ${motivo}` : ''}`,
        usuario: 'Usuário Atual'
      });
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

      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Regular paciente',
        alvo: leitoId,
        descricao: `Paciente ${pacienteId} regulado para leito ${leitoId}`,
        usuario: 'Usuário Atual'
      });
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


  const adicionarSetor = async (setorData: Omit<Setor, 'id'>) => {
    try {
      // Verificar duplicidade de sigla
      const jaExiste = await verificarDuplicidadeSigla(setorData.sigla);
      if (jaExiste) {
        throw new Error(`Já existe um setor com a sigla "${setorData.sigla}"`);
      }

      await addDoc(collection(db, 'setoresRegulaFacil'), setorData);
      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Adicionar setor',
        alvo: 'novo',
        descricao: `Setor ${setorData.sigla} adicionado`,
        usuario: 'Usuário Atual'
      });
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
      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Editar setor',
        alvo: setorId,
        descricao: `Setor ${setorData.sigla} editado`,
        usuario: 'Usuário Atual'
      });
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
      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Excluir setor',
        alvo: setorId,
        descricao: 'Setor excluído',
        usuario: 'Usuário Atual'
      });
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
      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Adicionar leito',
        alvo: 'novo',
        descricao: `Leito ${leitoData.codigo} adicionado`,
        usuario: 'Usuário Atual'
      });
    } catch (err) {
      console.error('Erro ao adicionar leito:', err);
      throw new Error('Erro ao adicionar leito');
    }
  };

  const editarLeito = async (leitoId: string, leitoData: Partial<Leito>) => {
    try {
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      await updateDoc(leitoRef, leitoData);
      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Editar leito',
        alvo: leitoId,
        descricao: `Leito ${leitoData.codigo} editado`,
        usuario: 'Usuário Atual'
      });
    } catch (err) {
      console.error('Erro ao editar leito:', err);
      throw new Error('Erro ao editar leito');
    }
  };

  const excluirLeito = async (leitoId: string) => {
    try {
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      await deleteDoc(leitoRef);
      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Excluir leito',
        alvo: leitoId,
        descricao: 'Leito excluído',
        usuario: 'Usuário Atual'
      });
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
      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Adicionar leitos em lote',
        alvo: 'novo',
        descricao: `${leitosData.length} leitos adicionados`,
        usuario: 'Usuário Atual'
      });
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
            const regulacaoData = regulacaoDoc.data() as Regulacao;
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
    verificarPacientesAguardandoRegulacao
  };
};
