
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PedidoCirurgia {
  id: string;
  nomePaciente: string;
  dataNascimentoPaciente: Date;
  sexoPaciente: 'M' | 'F';
  dataPrevistaInternacao: Date;
  dataPrevistaCirurgia: Date;
  medicoSolicitante: string;
  procedimentoCirurgico: string;
  preparacaoProcedimento: string[];
  dataSolicitacao: Date;
  statusSolicitacao: 'PENDENTE_LEITO' | 'LEITO_RESERVADO';
  leitoReservado?: string;
  dataReservaLeito?: Date;
  pacienteInternado?: boolean;
  idade?: number;
}

export const useCirurgiasEletivas = () => {
  const [pacientesCirurgiaEletiva, setPacientesCirurgiaEletiva] = useState<PedidoCirurgia[]>([]);
  const [loading, setLoading] = useState(true);

  const calcularIdade = (dataNascimento: Date): number => {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();
    
    if (mesAtual < dataNascimento.getMonth() || 
        (mesAtual === dataNascimento.getMonth() && diaAtual < dataNascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  const carregarPacientesCirurgiaEletiva = async () => {
    try {
      setLoading(true);
      const agora = new Date();
      const em24Horas = new Date(agora.getTime() + (24 * 60 * 60 * 1000));

      // Buscar pacientes com internação prevista em até 24h
      const q = query(
        collection(db, 'pedidosCirurgia'),
        where('dataPrevistaInternacao', '<=', Timestamp.fromDate(em24Horas)),
        where('dataPrevistaInternacao', '>=', Timestamp.fromDate(agora)),
        orderBy('dataPrevistaInternacao', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const pacientes = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const dataNascimento = data.dataNascimentoPaciente.toDate();
        
        return {
          id: doc.id,
          ...data,
          dataNascimentoPaciente: dataNascimento,
          dataPrevistaInternacao: data.dataPrevistaInternacao.toDate(),
          dataPrevistaCirurgia: data.dataPrevistaCirurgia.toDate(),
          dataSolicitacao: data.dataSolicitacao.toDate(),
          dataReservaLeito: data.dataReservaLeito?.toDate(),
          idade: calcularIdade(dataNascimento)
        } as PedidoCirurgia;
      });

      setPacientesCirurgiaEletiva(pacientes);
    } catch (error) {
      console.error('Erro ao carregar pacientes de cirurgia eletiva:', error);
    } finally {
      setLoading(false);
    }
  };

  const reservarLeito = async (pedidoId: string, leitoId: string, nomePaciente: string, medicoSolicitante: string) => {
    try {
      // Atualizar pedido de cirurgia
      const pedidoRef = doc(db, 'pedidosCirurgia', pedidoId);
      await updateDoc(pedidoRef, {
        leitoReservado: leitoId,
        dataReservaLeito: Timestamp.fromDate(new Date()),
        statusSolicitacao: 'LEITO_RESERVADO'
      });

      // Atualizar status do leito
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      await updateDoc(leitoRef, {
        status: 'reservado',
        pacienteAtual: `Marcação Cirúrgica - Dr. ${medicoSolicitante}`,
        dataUltimaAtualizacaoStatus: Timestamp.now()
      });

      // Gerar log
      await addDoc(collection(db, 'logsSistemaRegulaFacil'), {
        pagina: 'Regulação de Leitos',
        acao: 'Reservar leito para cirurgia',
        alvo: leitoId,
        usuario: 'Sistema',
        timestamp: Timestamp.now(),
        descricao: `Leito ${leitoId} reservado para paciente ${nomePaciente} - Dr. ${medicoSolicitante}`
      });

      // Recarregar dados
      await carregarPacientesCirurgiaEletiva();
      
      return true;
    } catch (error) {
      console.error('Erro ao reservar leito:', error);
      throw error;
    }
  };

  const cancelarReserva = async (pedidoId: string, leitoId: string) => {
    try {
      // Atualizar pedido de cirurgia
      const pedidoRef = doc(db, 'pedidosCirurgia', pedidoId);
      await updateDoc(pedidoRef, {
        leitoReservado: null,
        dataReservaLeito: null,
        statusSolicitacao: 'PENDENTE_LEITO'
      });

      // Liberar leito
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      await updateDoc(leitoRef, {
        status: 'vago',
        pacienteAtual: null,
        dataUltimaAtualizacaoStatus: Timestamp.now()
      });

      // Gerar log
      await addDoc(collection(db, 'logsSistemaRegulaFacil'), {
        pagina: 'Regulação de Leitos',
        acao: 'Cancelar reserva de leito',
        alvo: leitoId,
        usuario: 'Sistema',
        timestamp: Timestamp.now(),
        descricao: `Reserva do leito ${leitoId} cancelada`
      });

      await carregarPacientesCirurgiaEletiva();
      return true;
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      throw error;
    }
  };

  const confirmarInternacao = async (pedidoId: string) => {
    try {
      const pedidoRef = doc(db, 'pedidosCirurgia', pedidoId);
      await updateDoc(pedidoRef, {
        pacienteInternado: true
      });

      await carregarPacientesCirurgiaEletiva();
      return true;
    } catch (error) {
      console.error('Erro ao confirmar internação:', error);
      throw error;
    }
  };

  useEffect(() => {
    carregarPacientesCirurgiaEletiva();
  }, []);

  return {
    pacientesCirurgiaEletiva,
    loading,
    reservarLeito,
    cancelarReserva,
    confirmarInternacao,
    recarregar: carregarPacientesCirurgiaEletiva
  };
};
