
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Isolamento {
  nomeIsolamento: string;
  dataInclusao: any;
}

interface PacienteAlerta {
  id: string;
  nomePaciente: string;
  setorAtualPaciente: string;
  leitoAtualPaciente: string;
  isolamentosAtivos: Isolamento[];
}

interface AlertaCCIH {
  id: string;
  paciente: PacienteAlerta;
  dataAlerta: Date;
  quarto: string;
  setorNome: string;
}

const AlertasCCIH = () => {
  const [alertas, setAlertas] = useState<AlertaCCIH[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função para extrair número do quarto do leito
  const extrairQuarto = (leito: string): string => {
    if (!leito) return '';
    const partes = leito.split(' ');
    return partes[0] || '';
  };

  // Função para verificar se é setor de UTI/UTQ
  const isSetorUTI = (setorNome: string): boolean => {
    const setorLower = setorNome.toLowerCase();
    return setorLower.includes('uti') || setorLower.includes('utq');
  };

  // Função para comparar arrays de isolamentos
  const isolamentosSaoIguais = (isolamentos1: Isolamento[], isolamentos2: Isolamento[]): boolean => {
    if (isolamentos1.length !== isolamentos2.length) return false;
    
    const nomes1 = isolamentos1.map(iso => iso.nomeIsolamento).sort();
    const nomes2 = isolamentos2.map(iso => iso.nomeIsolamento).sort();
    
    return JSON.stringify(nomes1) === JSON.stringify(nomes2);
  };

  // Função para gerar alertas
  const gerarAlertas = async (pacientes: any[]) => {
    const novosAlertas: AlertaCCIH[] = [];
    const setoresCache: {[key: string]: string} = {};

    for (const paciente of pacientes) {
      // Verificar se paciente tem isolamentos ativos
      if (!paciente.isolamentosAtivos || paciente.isolamentosAtivos.length === 0) continue;
      
      // Buscar nome do setor se não estiver em cache
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

      // Pular se for UTI/UTQ
      if (isSetorUTI(setorNome)) continue;

      const quartoAtual = extrairQuarto(paciente.leitoAtualPaciente);
      if (!quartoAtual) continue;

      // Buscar outros pacientes no mesmo setor e quarto
      const pacientesNoMesmoQuarto = pacientes.filter(p => 
        p.id !== paciente.id &&
        p.setorAtualPaciente === paciente.setorAtualPaciente &&
        extrairQuarto(p.leitoAtualPaciente) === quartoAtual
      );

      if (pacientesNoMesmoQuarto.length === 0) continue;

      // Verificar se há incompatibilidade de isolamentos
      let temIncompatibilidade = false;

      for (const outroPaciente of pacientesNoMesmoQuarto) {
        const outrosIsolamentos = outroPaciente.isolamentosAtivos || [];
        
        // Se outro paciente não tem isolamentos ou tem isolamentos diferentes
        if (outrosIsolamentos.length === 0 || 
            !isolamentosSaoIguais(paciente.isolamentosAtivos, outrosIsolamentos)) {
          temIncompatibilidade = true;
          break;
        }
      }

      if (temIncompatibilidade) {
        novosAlertas.push({
          id: `alerta_${paciente.id}_${Date.now()}`,
          paciente: {
            id: paciente.id,
            nomePaciente: paciente.nomePaciente,
            setorAtualPaciente: paciente.setorAtualPaciente,
            leitoAtualPaciente: paciente.leitoAtualPaciente,
            isolamentosAtivos: paciente.isolamentosAtivos
          },
          dataAlerta: new Date(),
          quarto: quartoAtual,
          setorNome
        });
      }
    }

    setAlertas(novosAlertas);
  };

  // Monitorar pacientes internados
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'pacientesRegulaFacil'),
      (snapshot) => {
        const pacientesInternados = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(paciente => paciente.statusInternacao === 'internado');
        
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

  // Função para copiar texto do alerta
  const copiarTextoAlerta = (alerta: AlertaCCIH) => {
    const isolamentosTexto = alerta.paciente.isolamentosAtivos
      .map(iso => `- ${iso.nomeIsolamento}`)
      .join('\n');

    const textoAlerta = `*ALERTA DE REMANEJAMENTO*
Paciente ${alerta.paciente.nomePaciente}, localizado em ${alerta.setorNome} - ${alerta.paciente.leitoAtualPaciente}, está com os seguintes isolamentos:
${isolamentosTexto}

Providenciar o remanejamento do paciente para outro setor para evitar surtos e contaminação cruzada

Data do alerta: ${new Date().toLocaleString('pt-BR')}`;

    navigator.clipboard.writeText(textoAlerta).then(() => {
      toast({
        title: "Texto copiado",
        description: "O texto do alerta foi copiado para a área de transferência.",
        duration: 3000
      });
    }).catch(() => {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto do alerta.",
        variant: "destructive",
        duration: 3000
      });
    });
  };

  if (loading) {
    return null; // Não mostrar nada enquanto carrega
  }

  // Não renderizar o bloco se não houver alertas
  if (alertas.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas CCIH/NHE
          </div>
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            {alertas.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertas.map((alerta) => (
          <div key={alerta.id} className="p-4 bg-white rounded-lg border border-red-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="font-medium text-lg mb-1 text-red-900">
                  {alerta.paciente.nomePaciente}
                </div>
                <div className="text-sm text-red-700 mb-2">
                  {alerta.setorNome} - Leito {alerta.paciente.leitoAtualPaciente}
                </div>
                <div className="text-sm text-red-600">
                  Quarto {alerta.quarto} - Risco de contaminação cruzada
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copiarTextoAlerta(alerta)}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar Alerta
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-red-800">
                Isolamentos Ativos:
              </div>
              <div className="flex flex-wrap gap-2">
                {alerta.paciente.isolamentosAtivos.map((isolamento, index) => (
                  <Badge key={index} variant="outline" className="border-red-300 text-red-700">
                    {isolamento.nomeIsolamento}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AlertasCCIH;
