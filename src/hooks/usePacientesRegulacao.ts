
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PacienteRegulacao {
  id: string;
  nome: string;
  sexo: string;
  idade: number;
  dadosCompletos: any;
  setorAtual: {
    id: string;
    sigla: string;
    nomeCompleto: string;
  };
}

interface PacientesPorSetor {
  [setorId: string]: {
    setor: {
      id: string;
      sigla: string;
      nomeCompleto: string;
    };
    pacientes: PacienteRegulacao[];
  };
}

export const usePacientesRegulacao = () => {
  const [pacientesPorSetor, setPacientesPorSetor] = useState<PacientesPorSetor>({});
  const [loading, setLoading] = useState(true);

  // Calcular idade baseado na data de nascimento
  const calcularIdade = (dataNascimento: any) => {
    if (!dataNascimento) return 0;
    
    let dataNasc: Date;
    
    // Se for um Timestamp do Firestore
    if (dataNascimento.toDate) {
      dataNasc = dataNascimento.toDate();
    } 
    // Se for uma string no formato dd/mm/yyyy
    else if (typeof dataNascimento === 'string') {
      const [dia, mes, ano] = dataNascimento.split('/');
      dataNasc = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    }
    // Se for um objeto Date
    else {
      dataNasc = new Date(dataNascimento);
    }
    
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNasc.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNasc = dataNasc.getMonth();
    if (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < dataNasc.getDate())) {
      idade--;
    }
    
    return idade;
  };

  // Carregar pacientes aguardando regulação
  useEffect(() => {
    const q = query(
      collection(db, 'pacientesRegulaFacil'),
      where('statusRegulacao', '==', 'AGUARDANDO_REGULACAO')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const pacientesPorSetorData: PacientesPorSetor = {};

        await Promise.all(
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

            if (setorAtual) {
              const paciente: PacienteRegulacao = {
                id: pacienteDoc.id,
                nome: pacienteData.nomePaciente || '',
                sexo: pacienteData.sexoPaciente || 'M',
                idade: calcularIdade(pacienteData.dataNascimentoPaciente),
                dadosCompletos: pacienteData,
                setorAtual
              };

              if (!pacientesPorSetorData[setorAtual.id]) {
                pacientesPorSetorData[setorAtual.id] = {
                  setor: setorAtual,
                  pacientes: []
                };
              }

              pacientesPorSetorData[setorAtual.id].pacientes.push(paciente);
            }
          })
        );

        setPacientesPorSetor(pacientesPorSetorData);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar pacientes aguardando regulação:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    pacientesPorSetor,
    loading
  };
};
