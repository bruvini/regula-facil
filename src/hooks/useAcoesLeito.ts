
import { useState } from 'react';
import { doc, updateDoc, Timestamp, addDoc, collection } from 'firebase/firestore';
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

  const darAlta = async (leitoId: string, pacienteId: string, nomePaciente: string) => {
    setLoading(true);
    try {
      // Atualizar status do leito para limpeza
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      await updateDoc(leitoRef, {
        status: 'limpeza',
        dataUltimaAtualizacaoStatus: Timestamp.now(),
        pacienteAtual: null
      });

      // Atualizar status do paciente
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        statusInternacao: 'alta',
        leitoAtual: null
      });

      // Registrar log
      await adicionarLog(
        'Alta de paciente',
        leitoId,
        `Alta do paciente ${nomePaciente} - Leito liberado para limpeza`
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

  const solicitarRemanejamento = async (pacienteId: string, nomePaciente: string) => {
    setLoading(true);
    try {
      // Atualizar status de regulação do paciente
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        statusRegulacao: 'AGUARDANDO_REMANEJAMENTO'
      });

      // Registrar log
      await adicionarLog(
        'Solicitação de remanejamento',
        pacienteId,
        `Remanejamento solicitado para o paciente ${nomePaciente}`
      );

      toast({
        title: "Remanejamento solicitado",
        description: `${nomePaciente} está aguardando remanejamento.`,
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
    solicitarRemanejamento
  };
};
