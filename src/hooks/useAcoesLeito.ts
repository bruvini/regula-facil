
import { useState } from 'react';
import { doc, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { registrarLog } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export const useAcoesLeito = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();


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

      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Sinalizar aguardando UTI',
        alvo: leitoId,
        descricao: `Paciente ${nomePaciente} sinalizado aguardando UTI no leito ${leitoCodigo} do setor ${setorNome}.`,
        usuario: 'Usuário Atual'
      });

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

      // Registrar log
      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Cancelar pedido UTI',
        alvo: pacienteId,
        descricao: `Pedido de UTI cancelado para ${nomePaciente}. Motivo: ${motivo}`,
        usuario: 'Usuário Atual'
      });

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

      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Dar alta',
        alvo: leitoId,
        descricao: `Alta realizada para o paciente ${nomePaciente} no leito ${leitoCodigo} do setor ${setorNome}.`,
        usuario: 'Usuário Atual'
      });

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

      await registrarLog({
        pagina: 'Mapa de Leitos',
        acao: 'Solicitar remanejamento',
        alvo: leitoId,
        descricao: `Remanejamento solicitado para o paciente ${nomePaciente} no leito ${leitoCodigo} do setor ${setorNome}. Motivo: ${motivo}`,
        usuario: 'Usuário Atual'
      });

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
