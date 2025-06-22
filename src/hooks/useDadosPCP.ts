
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ConfiguracaoPCP, DadosPCP } from '@/types/pcp';
import { LeitoWithData } from '@/types/firestore';

export const useDadosPCP = (configuracoesPCP: ConfiguracaoPCP[], leitos: LeitoWithData[]) => {
  const [dadosPCP, setDadosPCP] = useState<DadosPCP>({
    nivelAtual: null,
    totalPacientes: 0,
    pacientesDCL: 0,
    pacientesDCX: 0,
    pacientesPCP: 0,
    pacientesSalaLaranja: 0,
    pacientesSalaEmergencia: 0,
    salasBloqueadas: 0
  });

  const calcularDadosPCP = async () => {
    try {
      console.log('Calculando dados PCP...', { configuracoesPCP: configuracoesPCP.length, leitos: leitos.length });

      // Buscar pacientes internados
      const pacientesQuery = query(
        collection(db, 'pacientesRegulaFacil'),
        where('statusInternacao', '==', 'internado')
      );
      
      const pacientesSnapshot = await getDocs(pacientesQuery);
      console.log('Pacientes internados encontrados:', pacientesSnapshot.size);
      
      let pacientesDCL = 0;
      let pacientesDCX = 0;
      let pacientesSalaLaranja = 0;
      let pacientesSalaEmergencia = 0;

      for (const pacienteDoc of pacientesSnapshot.docs) {
        const pacienteData = pacienteDoc.data();
        
        if (pacienteData.setorAtualPaciente) {
          try {
            const setorDoc = await getDocs(query(
              collection(db, 'setoresRegulaFacil'),
              where('__name__', '==', pacienteData.setorAtualPaciente.id)
            ));
            
            if (!setorDoc.empty) {
              const setorData = setorDoc.docs[0].data();
              const siglaSetor = setorData.sigla;
              
              console.log('Paciente no setor:', siglaSetor);
              
              if (siglaSetor === 'PS DECISÃO CLÍNICA') pacientesDCL++;
              else if (siglaSetor === 'PS DECISÃO CIRÚRGICA') pacientesDCX++;
              else if (siglaSetor === 'SALA LARANJA') pacientesSalaLaranja++;
              else if (siglaSetor === 'SALA DE EMERGENCIA') pacientesSalaEmergencia++;
            }
          } catch (err) {
            console.error('Erro ao buscar setor do paciente:', err);
          }
        }
      }

      // Contar pacientes em leitos PCP
      const pacientesPCP = leitos.filter(leito => 
        leito.ehPCP && leito.status === 'ocupado'
      ).length;

      // Contar salas bloqueadas no CC
      const salasBloqueadas = leitos.filter(leito =>
        leito.setorData?.sigla === 'CC - SALAS CIRURGICAS' && leito.status === 'bloqueado'
      ).length;

      const totalPacientes = pacientesDCL + pacientesDCX;
      
      console.log('Dados calculados:', {
        totalPacientes,
        pacientesDCL,
        pacientesDCX,
        pacientesPCP,
        pacientesSalaLaranja,
        pacientesSalaEmergencia,
        salasBloqueadas
      });

      // Determinar nível atual baseado no total de pacientes
      let nivelAtual: ConfiguracaoPCP | null = null;
      
      if (configuracoesPCP.length > 0) {
        // Ordenar configurações por ordem
        const configsOrdenadas = [...configuracoesPCP].sort((a, b) => a.ordem - b.ordem);
        
        for (const config of configsOrdenadas) {
          if (totalPacientes >= config.qtdMinimaPCP && totalPacientes <= config.qtdMaximaPCP) {
            nivelAtual = config;
            break;
          }
        }
        
        console.log('Nível PCP determinado:', nivelAtual?.nomeNivelPCP || 'Nenhum nível encontrado');
      }

      setDadosPCP({
        nivelAtual,
        totalPacientes,
        pacientesDCL,
        pacientesDCX,
        pacientesPCP,
        pacientesSalaLaranja,
        pacientesSalaEmergencia,
        salasBloqueadas
      });

    } catch (error) {
      console.error('Erro ao calcular dados PCP:', error);
    }
  };

  useEffect(() => {
    if (configuracoesPCP.length > 0) {
      console.log('Configurações PCP carregadas, recalculando dados...');
      calcularDadosPCP();
    }
  }, [configuracoesPCP, leitos]);

  return { dadosPCP, recalcularDados: calcularDadosPCP };
};
