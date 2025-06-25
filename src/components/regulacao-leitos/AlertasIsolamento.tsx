
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, Clock, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface Isolamento {
  nomeIsolamento: string;
  dataInclusao: any;
}

interface PacienteFirestore {
  id: string;
  nomePaciente: string;
  setorAtualPaciente: string;
  leitoAtualPaciente: string;
  statusInternacao: string;
  isolamentosAtivos: Isolamento[];
  sexoPaciente?: string;
}

interface PacienteAlerta {
  id: string;
  nomePaciente: string;
  setorAtualPaciente: string;
  leitoAtualPaciente: string;
  isolamentosAtivos: Isolamento[];
  sexoPaciente?: string;
}

interface AlertaRegulacao {
  id: string;
  paciente: PacienteAlerta;
  dataAlerta: Date;
  quarto: string;
  setorNome: string;
  tempoEspera: string;
  sugestaoAgrupamento?: {
    pacienteCompativel: PacienteAlerta;
    motivoCompatibilidade: string;
  };
}

const AlertasIsolamento = () => {
  const [alertas, setAlertas] = useState<AlertaRegulacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const setoresExcluidos = [
    'SALA DE EMERGENCIA',
    'UTI',
    'CC - SALAS CIRURGICAS',
    'CC - PRE OPERATORIO',
    'UNID. DE AVC - INTEGRAL',
    'SALA LARANJA',
    'UNID. AVC AGUDO',
    'CC - RECUPERAÇÃO'
  ];

  const extrairQuarto = (leito: string): string => {
    if (!leito) return '';
    const partes = leito.split(' ');
    return partes[0] || '';
  };

  const isSetorUTI = (setorNome: string): boolean => {
    const setorLower = setorNome.toLowerCase();
    return setorLower.includes('uti') || setorLower.includes('utq');
  };

  const isSetorExcluido = (setorNome: string): boolean => {
    return setoresExcluidos.some(setor => 
      setorNome.toLowerCase().includes(setor.toLowerCase())
    );
  };

  const normalizarIsolamento = (isolamento: string): string => {
    return isolamento.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const isolamentosSaoIguais = (isolamentos1: Isolamento[], isolamentos2: Isolamento[]): boolean => {
    if (!isolamentos1 || !isolamentos2 || isolamentos1.length !== isolamentos2.length) return false;
    
    const nomes1 = isolamentos1
      .map(iso => normalizarIsolamento(iso.nomeIsolamento))
      .sort();
    const nomes2 = isolamentos2
      .map(iso => normalizarIsolamento(iso.nomeIsolamento))
      .sort();
    
    return nomes1.join(',') === nomes2.join(',');
  };

  const temIsolamentoTimo = (isolamentos: Isolamento[]): boolean => {
    if (!isolamentos) return false;
    return isolamentos.some(iso => 
      normalizarIsolamento(iso.nomeIsolamento).includes('timo')
    );
  };

  const calcularTempoEspera = (isolamentos: Isolamento[]): string => {
    if (!isolamentos || isolamentos.length === 0) return 'N/A';
    
    // Encontrar o isolamento mais antigo
    const isolamentoMaisAntigo = isolamentos.reduce((mais, atual) => {
      const dataAtual = atual.dataInclusao?.toDate ? atual.dataInclusao.toDate() : new Date(atual.dataInclusao);
      const dataMais = mais.dataInclusao?.toDate ? mais.dataInclusao.toDate() : new Date(mais.dataInclusao);
      return dataAtual < dataMais ? atual : mais;
    });

    const agora = new Date();
    const dataInicio = isolamentoMaisAntigo.dataInclusao?.toDate ? 
      isolamentoMaisAntigo.dataInclusao.toDate() : 
      new Date(isolamentoMaisAntigo.dataInclusao);
    
    const diffMs = agora.getTime() - dataInicio.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffHoras / 24);
    const horasRestantes = diffHoras % 24;
    
    if (diffDias > 0) {
      return `${diffDias}d ${horasRestantes}h`;
    }
    return `${diffHoras}h`;
  };

  const encontrarAgrupamento = (paciente: PacienteAlerta, todosPacientes: PacienteFirestore[]): PacienteAlerta | null => {
    // Validações básicas
    if (!paciente.sexoPaciente || 
        !paciente.isolamentosAtivos || 
        paciente.isolamentosAtivos.length === 0 ||
        temIsolamentoTimo(paciente.isolamentosAtivos)) {
      return null;
    }

    console.log(`🔍 Buscando agrupamento para ${paciente.nomePaciente}:`, {
      sexo: paciente.sexoPaciente,
      isolamentos: paciente.isolamentosAtivos.map(i => i.nomeIsolamento),
      quarto: extrairQuarto(paciente.leitoAtualPaciente)
    });

    for (const outroPaciente of todosPacientes) {
      // Pular o próprio paciente
      if (outroPaciente.id === paciente.id) continue;

      // Validações básicas do outro paciente
      if (!outroPaciente.sexoPaciente ||
          !outroPaciente.isolamentosAtivos ||
          outroPaciente.isolamentosAtivos.length === 0) {
        continue;
      }

      // Verificar sexo
      if (outroPaciente.sexoPaciente !== paciente.sexoPaciente) {
        continue;
      }

      // Verificar se está no mesmo setor
      if (outroPaciente.setorAtualPaciente !== paciente.setorAtualPaciente) {
        continue;
      }

      // Verificar se não estão no mesmo quarto
      const quartoOutro = extrairQuarto(outroPaciente.leitoAtualPaciente);
      const quartoPaciente = extrairQuarto(paciente.leitoAtualPaciente);
      if (quartoOutro === quartoPaciente) {
        continue;
      }

      // Verificar se não tem isolamento Timo
      if (temIsolamentoTimo(outroPaciente.isolamentosAtivos)) {
        continue;
      }

      // Verificar se os isolamentos são iguais
      if (isolamentosSaoIguais(paciente.isolamentosAtivos, outroPaciente.isolamentosAtivos)) {
        console.log(`✅ Agrupamento encontrado: ${paciente.nomePaciente} + ${outroPaciente.nomePaciente}`);
        
        return {
          id: outroPaciente.id,
          nomePaciente: outroPaciente.nomePaciente,
          setorAtualPaciente: outroPaciente.setorAtualPaciente,
          leitoAtualPaciente: outroPaciente.leitoAtualPaciente,
          isolamentosAtivos: outroPaciente.isolamentosAtivos,
          sexoPaciente: outroPaciente.sexoPaciente
        };
      }
    }

    return null;
  };

  const gerarAlertas = async (pacientes: PacienteFirestore[]) => {
    console.log(`📊 Gerando alertas para ${pacientes.length} pacientes`);
    const novosAlertas: AlertaRegulacao[] = [];
    const setoresCache: {[key: string]: string} = {};

    for (const paciente of pacientes) {
      if (!paciente.isolamentosAtivos || paciente.isolamentosAtivos.length === 0) continue;
      
      let setorNome = '';
      const setorId = paciente.setorAtualPaciente;
      
      if (setoresCache[setorId]) {
        setorNome = setoresCache[setorId];
      } else {
        try {
          const setorDoc = await getDoc(doc(db, 'setores', setorId));
          if (setorDoc.exists()) {
            setorNome = setorDoc.data().nomeCompleto || setorDoc.data().sigla || '';
            setoresCache[setorId] = setorNome;
          }
        } catch (error) {
          console.error('Erro ao buscar setor:', error);
          setorNome = setorId;
          setoresCache[setorId] = setorNome;
        }
      }

      if (isSetorUTI(setorNome) || isSetorExcluido(setorNome)) continue;

      const quartoAtual = extrairQuarto(paciente.leitoAtualPaciente);
      if (!quartoAtual) continue;

      const pacientesNoMesmoQuarto = pacientes.filter(p => 
        p.id !== paciente.id &&
        p.setorAtualPaciente === paciente.setorAtualPaciente &&
        extrairQuarto(p.leitoAtualPaciente) === quartoAtual
      );

      if (pacientesNoMesmoQuarto.length === 0) continue;

      let temIncompatibilidade = false;

      for (const outroPaciente of pacientesNoMesmoQuarto) {
        const outrosIsolamentos = outroPaciente.isolamentosAtivos || [];
        
        if (outrosIsolamentos.length === 0 || 
            !isolamentosSaoIguais(paciente.isolamentosAtivos, outrosIsolamentos)) {
          temIncompatibilidade = true;
          break;
        }
      }

      if (temIncompatibilidade) {
        const pacienteAlerta: PacienteAlerta = {
          id: paciente.id,
          nomePaciente: paciente.nomePaciente,
          setorAtualPaciente: paciente.setorAtualPaciente,
          leitoAtualPaciente: paciente.leitoAtualPaciente,
          isolamentosAtivos: paciente.isolamentosAtivos,
          sexoPaciente: paciente.sexoPaciente
        };

        // Verificar possibilidade de agrupamento
        const pacienteCompativel = encontrarAgrupamento(pacienteAlerta, pacientes);

        const alerta: AlertaRegulacao = {
          id: `alerta_${paciente.id}_${Date.now()}`,
          paciente: pacienteAlerta,
          dataAlerta: new Date(),
          quarto: quartoAtual,
          setorNome,
          tempoEspera: calcularTempoEspera(paciente.isolamentosAtivos)
        };

        if (pacienteCompativel) {
          const isolamentosTexto = paciente.isolamentosAtivos
            .map(iso => iso.nomeIsolamento)
            .join(', ');
          
          alerta.sugestaoAgrupamento = {
            pacienteCompativel,
            motivoCompatibilidade: `Mesmo sexo (${paciente.sexoPaciente}) e isolamentos idênticos: ${isolamentosTexto}`
          };
        }

        novosAlertas.push(alerta);
      }
    }

    console.log(`🚨 ${novosAlertas.length} alertas gerados`);
    setAlertas(novosAlertas);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'pacientesRegulaFacil'),
      (snapshot) => {
        const pacientesInternados = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as PacienteFirestore))
          .filter(paciente => paciente.statusInternacao === 'internado');
        
        console.log(`👥 ${pacientesInternados.length} pacientes internados encontrados`);
        gerarAlertas(pacientesInternados);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao monitorar pacientes:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleRemanejar = (alertaId: string) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O remanejamento será implementado em breve.",
      duration: 3000
    });
  };

  const handleSugerirAgrupamento = (alertaId: string) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A sugestão de agrupamento será implementada em breve.",
      duration: 3000
    });
  };

  if (loading) {
    return null;
  }

  if (alertas.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-orange-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pacientes com Alertas de Isolamento (CCIH/NHE)
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {alertas.length}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {alertas.map((alerta) => (
                <div key={alerta.id} className="p-4 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-base mb-1 text-orange-900">
                        {alerta.paciente.nomePaciente}
                      </div>
                      <div className="text-sm text-orange-700 mb-2">
                        {alerta.setorNome} - Quarto {alerta.quarto}, Leito {alerta.paciente.leitoAtualPaciente}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-orange-600 mb-2">
                        <Clock className="h-4 w-4" />
                        Aguardando remanejamento há {alerta.tempoEspera}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemanejar(alerta.id)}
                        className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                      >
                        Remanejar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-orange-800 mb-2">
                        Isolamentos Ativos:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {alerta.paciente.isolamentosAtivos.map((isolamento, index) => (
                          <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">
                            {isolamento.nomeIsolamento}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {alerta.sugestaoAgrupamento && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-blue-800 mb-1">
                              💡 Possível Agrupamento Detectado
                            </div>
                            <div className="text-xs text-blue-700 mb-2">
                              Este paciente pode ser agrupado com{' '}
                              <strong>{alerta.sugestaoAgrupamento.pacienteCompativel.nomePaciente}</strong>{' '}
                              (Quarto {extrairQuarto(alerta.sugestaoAgrupamento.pacienteCompativel.leitoAtualPaciente)}).
                            </div>
                            <div className="text-xs text-blue-600 mb-2">
                              {alerta.sugestaoAgrupamento.motivoCompatibilidade}
                            </div>
                            <div className="text-xs text-blue-700 mb-2 font-medium">
                              🛏️ Sugestão: remanejar para o mesmo quarto
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSugerirAgrupamento(alerta.id)}
                              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                            >
                              Sugerir Agrupamento
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AlertasIsolamento;
