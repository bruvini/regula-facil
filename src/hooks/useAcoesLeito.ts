
import { useState } from 'react';
import { doc, updateDoc, Timestamp, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
      // Buscar referência do leito
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      
      // Buscar paciente baseado no leitoAtualPaciente
      const pacientesQuery = query(
        collection(db, 'pacientesRegulaFacil'),
        where('leitoAtualPaciente', '==', leitoRef)
      );
      const pacientesSnapshot = await getDocs(pacientesQuery);
      
      if (!pacientesSnapshot.empty) {
        const pacienteDoc = pacientesSnapshot.docs[0];
        
        // Atualizar status do paciente
        await updateDoc(pacienteDoc.ref, {
          statusInternacao: 'alta',
          leitoAtualPaciente: null
        });
      }

      // Atualizar status do leito para limpeza
      await updateDoc(leitoRef, {
        status: 'limpeza',
        dataUltimaAtualizacaoStatus: Timestamp.now(),
        pacienteAtual: null
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

  const solicitarRemanejamento = async (leitoId: string, nomePaciente: string) => {
    setLoading(true);
    try {
      // Buscar referência do leito
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      
      // Buscar paciente baseado no leitoAtualPaciente
      const pacientesQuery = query(
        collection(db, 'pacientesRegulaFacil'),
        where('leitoAtualPaciente', '==', leitoRef)
      );
      const pacientesSnapshot = await getDocs(pacientesQuery);
      
      if (!pacientesSnapshot.empty) {
        const pacienteDoc = pacientesSnapshot.docs[0];
        
        // Atualizar status de regulação do paciente
        await updateDoc(pacienteDoc.ref, {
          statusRegulacao: 'AGUARDANDO_REMANEJAMENTO'
        });

        // Registrar log
        await adicionarLog(
          'Solicitação de remanejamento',
          pacienteDoc.id,
          `Remanejamento solicitado para o paciente ${nomePaciente}`
        );

        toast({
          title: "Remanejamento solicitado com sucesso",
          description: `${nomePaciente} foi incluído na fila de remanejamento.`,
          duration: 3000
        });

        return true;
      } else {
        throw new Error('Paciente não encontrado no leito');
      }
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
