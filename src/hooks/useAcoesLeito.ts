
import { useState } from 'react';
import { doc, updateDoc, Timestamp, addDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export const useAcoesLeito = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const adicionarLog = async (acao: string, alvo: string, descricao: string) => {
    try {
      await addDoc(collection(db, 'logsSistemaRegulaFacil'), {
        pagina: 'Mapa de Leitos',
        acao,
        alvo,
        usuario: 'Usuário Atual',
        timestamp: Timestamp.now(),
        descricao
      });
    } catch (err) {
      console.error('Erro ao adicionar log:', err);
    }
  };

  const adicionarLogPaciente = async (tipo: string, pacienteId: string, leitoId: string, setorId: string, descricao: string) => {
    try {
      await addDoc(collection(db, 'logsPacientesRegulaFacil'), {
        tipo,
        pacienteId,
        leitoId,
        setorId,
        timestamp: Timestamp.now(),
        usuario: 'Usuário Atual',
        descricao
      });
    } catch (err) {
      console.error('Erro ao adicionar log do paciente:', err);
    }
  };

  const registrarLogMovimentacao = async (descricao: string) => {
    try {
      await addDoc(collection(db, 'logsMovimentacoesRegulaFacil'), {
        descricao,
        timestamp: Timestamp.now()
      });
    } catch (err) {
      console.error('Erro ao registrar movimentação:', err);
    }
  };

  const sinalizarAguardandoUTI = async (
    leitoId: string,
    pacienteId: string,
    nomePaciente: string,
    leitoCodigo: string,
    setorNome: string
  ) => {
    setLoading(true);
    try {
      // Atualizar campos do paciente
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        aguardaUTI: true,
        dataPedidoUTI: Timestamp.now()
      });

      await registrarLogMovimentacao(
        `Paciente ${nomePaciente} sinalizado aguardando UTI no leito ${leitoCodigo} do setor ${setorNome}.`
      );

      toast({
        title: "UTI solicitada",
        description: `${nomePaciente} foi sinalizado como aguardando UTI.`,
        duration: 3000
      });

      return true;
    } catch (err) {
      console.error('Erro ao sinalizar aguardando UTI:', err);
      toast({
        title: "Erro ao sinalizar UTI",
        description: "Ocorreu um erro ao processar a solicitação.",
        variant: "destructive",
        duration: 3000
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelarPedidoUTI = async (pacienteId: string, nomePaciente: string, motivo: string) => {
    setLoading(true);
    try {
      // Remover campos do paciente
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        aguardaUTI: false,
        dataPedidoUTI: null
      });

      // Registrar log do paciente
      await adicionarLogPaciente(
        'cancelamento_uti',
        pacienteId,
        '',
        '',
        `Pedido de UTI cancelado para ${nomePaciente}. Motivo: ${motivo}`
      );

      toast({
        title: "Pedido cancelado",
        description: `Pedido de UTI cancelado para ${nomePaciente}.`,
        duration: 3000
      });

      return true;
    } catch (err) {
      console.error('Erro ao cancelar pedido UTI:', err);
      toast({
        title: "Erro ao cancelar pedido",
        description: "Ocorreu um erro ao cancelar o pedido.",
        variant: "destructive",
        duration: 3000
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const darAlta = async (
    leitoId: string,
    pacienteId: string,
    nomePaciente: string,
    leitoCodigo: string,
    setorNome: string
  ) => {
    setLoading(true);
    try {
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);

      await deleteDoc(doc(db, 'pacientesRegulaFacil', pacienteId));

      // Atualizar status do leito para limpeza
      await updateDoc(leitoRef, {
        status: 'limpeza',
        dataUltimaAtualizacaoStatus: Timestamp.now(),
        pacienteAtual: null
      });

      await registrarLogMovimentacao(
        `Alta realizada para o paciente ${nomePaciente} no leito ${leitoCodigo} do setor ${setorNome}.`
      );

      toast({
        title: "Alta realizada com sucesso",
        description: `${nomePaciente} recebeu alta e o leito foi liberado para limpeza.`,
        duration: 3000
      });

      return true;
    } catch (err) {
      console.error('Erro ao dar alta:', err);
      toast({
        title: "Erro ao dar alta",
        description: "Ocorreu um erro ao processar a alta do paciente.",
        variant: "destructive",
        duration: 3000
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const solicitarRemanejamento = async (
    leitoId: string,
    pacienteId: string,
    nomePaciente: string,
    leitoCodigo: string,
    setorNome: string,
    motivo: string
  ) => {
    setLoading(true);
    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        remanejarPaciente: true,
        motivoRemanejamento: motivo,
        dataPedidoRemanejamento: Timestamp.now()
      });

      await registrarLogMovimentacao(
        `Remanejamento solicitado para o paciente ${nomePaciente} no leito ${leitoCodigo} do setor ${setorNome}. Motivo: ${motivo}`
      );

      toast({
        title: "Remanejamento solicitado com sucesso",
        description: `${nomePaciente} foi incluído na fila de remanejamento.`,
        duration: 3000
      });

      return true;
    } catch (err) {
      console.error('Erro ao solicitar remanejamento:', err);
      toast({
        title: "Erro ao solicitar remanejamento",
        description: "Ocorreu um erro ao processar a solicitação.",
        variant: "destructive",
        duration: 3000
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    darAlta,
    solicitarRemanejamento,
    sinalizarAguardandoUTI,
    cancelarPedidoUTI
  };
};
