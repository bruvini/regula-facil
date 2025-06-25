
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PacienteUTI {
  id: string;
  nome: string;
  setorAtual: {
    id: string;
    sigla: string;
    nomeCompleto: string;
  };
  leitoAtual: {
    id: string;
    codigo: string;
  };
  leitoDestino?: {
    id: string;
    codigo: string;
  } | null;
  setorDestino?: {
    id: string;
    sigla: string;
    nomeCompleto: string;
  } | null;
  dataPedidoUTI: any;
  tempoEspera: string;
}

interface LeitoUTI {
  id: string;
  codigo: string;
  setorId: string;
}

export const usePacientesUTI = () => {
  const [pacientesUTI, setPacientesUTI] = useState<PacienteUTI[]>([]);
  const [leitosUTIVagos, setLeitosUTIVagos] = useState<LeitoUTI[]>([]);
  const [loading, setLoading] = useState(true);

  // Calcular tempo de espera
  const calcularTempoEspera = (dataPedido: any) => {
    if (!dataPedido) return '0h 0min';

    const agora = new Date();
    const inicio = dataPedido.toDate();
    const diff = agora.getTime() - inicio.getTime();

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${horas}h ${minutos}min`;
  };

  // Carregar pacientes aguardando UTI
  useEffect(() => {
    const q = query(
      collection(db, 'pacientesRegulaFacil'),
      where('statusInternacao', '==', 'internado'),
      where('aguardaUTI', '==', true)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const pacientesData = await Promise.all(
          snapshot.docs.map(async (pacienteDoc) => {
            const pacienteData = pacienteDoc.data();
            
            // Buscar dados do setor atual
            let setorAtual = null;
            if (pacienteData.setorAtualPaciente) {
              const setorDoc = await getDoc(pacienteData.setorAtualPaciente);
              if (setorDoc.exists()) {
                const setorData = setorDoc.data() as any;
                setorAtual = {
                  id: setorDoc.id,
                  sigla: setorData?.sigla || '',
                  nomeCompleto: setorData?.nomeCompleto || ''
                };
              }
            }

            // Buscar dados do leito atual
            let leitoAtual = null;
            if (pacienteData.leitoAtualPaciente) {
              const leitoDoc = await getDoc(pacienteData.leitoAtualPaciente);
              if (leitoDoc.exists()) {
                const leitoData = leitoDoc.data() as any;
                leitoAtual = {
                  id: leitoDoc.id,
                  codigo: leitoData?.codigo || ''
                };
              }
            }

            // Buscar leito destino se houver
            let leitoDestino = null;
            if (pacienteData.leitoDestino) {
              const leitoDoc = await getDoc(pacienteData.leitoDestino);
              if (leitoDoc.exists()) {
                const leitoData = leitoDoc.data() as any;
                leitoDestino = { id: leitoDoc.id, codigo: leitoData?.codigo || '' };
              }
            }

            // Buscar setor destino se houver
            let setorDestino = null;
            if (pacienteData.setorDestino) {
              const setorDoc = await getDoc(pacienteData.setorDestino);
              if (setorDoc.exists()) {
                const setorData = setorDoc.data() as any;
                setorDestino = {
                  id: setorDoc.id,
                  sigla: setorData?.sigla || '',
                  nomeCompleto: setorData?.nomeCompleto || ''
                };
              }
            }

            return {
              id: pacienteDoc.id,
              nome: pacienteData.nomePaciente || '',
              setorAtual,
              leitoAtual,
              leitoDestino,
              setorDestino,
              dataPedidoUTI: pacienteData.dataPedidoUTI,
              tempoEspera: calcularTempoEspera(pacienteData.dataPedidoUTI)
            };
          })
        );

        setPacientesUTI(pacientesData.filter(p => p.setorAtual && p.leitoAtual));
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar pacientes UTI:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Atualizar tempo de espera a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setPacientesUTI(prev => 
        prev.map(paciente => ({
          ...paciente,
          tempoEspera: calcularTempoEspera(paciente.dataPedidoUTI)
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Carregar leitos UTI vagos
  const carregarLeitosUTIVagos = async () => {
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', '7UKUgMtFvxAdCSxLmea7');
      const leitosQuery = query(
        collection(db, 'leitosRegulaFacil'),
        where('setor', '==', setorRef),
        where('status', '==', 'vago')
      );
      const leitosSnapshot = await getDocs(leitosQuery);

      const leitosUTI: LeitoUTI[] = leitosSnapshot.docs.map(leitoDoc => ({
        id: leitoDoc.id,
        codigo: (leitoDoc.data() as any)?.codigo || '',
        setorId: '7UKUgMtFvxAdCSxLmea7'
      }));

      setLeitosUTIVagos(leitosUTI);
      return leitosUTI;
    } catch (error) {
      console.error('Erro ao carregar leitos UTI:', error);
      return [];
    }
  };

  return {
    pacientesUTI,
    leitosUTIVagos,
    loading,
    carregarLeitosUTIVagos
  };
};
