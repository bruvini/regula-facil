
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { DadosPCP } from '@/types/pcp';
import { useToast } from '@/hooks/use-toast';

interface ModalBoletimPCPProps {
  aberto: boolean;
  onFechar: () => void;
  dadosPCP: DadosPCP;
}

const ModalBoletimPCP = ({ aberto, onFechar, dadosPCP }: ModalBoletimPCPProps) => {
  const { toast } = useToast();
  const [dadosExtras, setDadosExtras] = useState({
    observadosDCL: 0,
    observadosDCX: 0,
    observadosSalaVermelha: 0,
    pacientesSRPA: 0,
    salasAtivasCC: 0,
    salaTravada: 0,
    dataPrevisaoAltas: '',
    uti01SemPrevisao: true,
    uti02SemPrevisao: true,
    uti03SemPrevisao: true,
    uti04SemPrevisao: true,
    leitosUTI01: [] as string[],
    leitosUTI02: [] as string[],
    leitosUTI03: [] as string[],
    leitosUTI04: [] as string[]
  });

  const gerarBoletimCompleto = () => {
    if (!dadosPCP.nivelAtual) return '';

    const agora = new Date();
    const dataHora = agora.toLocaleString('pt-BR');
    
    let boletim = `ATENÇÃO

Estamos em: ${dadosPCP.nivelAtual.nomeNivelPCP} - ${dataHora}

❗ ${dadosPCP.pacientesDCL} Pacientes internados na DCL sem reserva de leito
❗ ${dadosExtras.observadosDCL} Pacientes observados na DCL
❗ ${dadosPCP.pacientesDCX} Pacientes internados na DCX sem reserva de leito
❗ ${dadosExtras.observadosDCX} Pacientes observados DCX
❗ ${dadosPCP.pacientesPCP} Pacientes ocupando leito de PCP
❗️ ${dadosPCP.pacientesSalaLaranja} Pacientes internados na sala laranja
❗️ ${dadosPCP.pacientesSalaEmergencia} Pacientes internados na sala vermelha
❗️ ${dadosExtras.observadosSalaVermelha} Observados na sala vermelha
❗ ${dadosExtras.pacientesSRPA} Paciente em SRPA sem reserva
❗ ${dadosExtras.salasAtivasCC} Salas ativas no Centro Cirúrgico
❗ ${dadosPCP.salasBloqueadas} Salas bloqueadas
❗ ${dadosExtras.salaTravada} Sala travada`;

    if (dadosExtras.dataPrevisaoAltas) {
      boletim += `

PREVISÃO DE ALTAS PARA O DIA ${dadosExtras.dataPrevisaoAltas}

UTI 01: ${dadosExtras.uti01SemPrevisao ? 'SEM PREVISÃO DE ALTA' : dadosExtras.leitosUTI01.join(', ')}
UTI 02: ${dadosExtras.uti02SemPrevisao ? 'SEM PREVISÃO DE ALTA' : dadosExtras.leitosUTI02.join(', ')}
UTI 03: ${dadosExtras.uti03SemPrevisao ? 'SEM PREVISÃO DE ALTA' : dadosExtras.leitosUTI03.join(', ')}
UTI 04: ${dadosExtras.uti04SemPrevisao ? 'SEM PREVISÃO DE ALTA' : dadosExtras.leitosUTI04.join(', ')}`;
    }

    boletim += '\n\n' + dadosPCP.nivelAtual.orientacoesNivelPCP.map(orientacao => `✅ ${orientacao}`).join('\n');

    return boletim;
  };

  const copiarBoletim = async () => {
    const boletim = gerarBoletimCompleto();
    try {
      await navigator.clipboard.writeText(boletim);
      toast({
        title: "Boletim PCP copiado",
        description: "O boletim completo foi copiado para a área de transferência.",
      });
      onFechar();
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o boletim.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Boletim PCP Completo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados extras necessários */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="observadosDCL">Observados DCL</Label>
              <Input
                id="observadosDCL"
                type="number"
                value={dadosExtras.observadosDCL}
                onChange={(e) => setDadosExtras({...dadosExtras, observadosDCL: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="observadosDCX">Observados DCX</Label>
              <Input
                id="observadosDCX"
                type="number"
                value={dadosExtras.observadosDCX}
                onChange={(e) => setDadosExtras({...dadosExtras, observadosDCX: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="observadosSalaVermelha">Observados Sala Vermelha</Label>
              <Input
                id="observadosSalaVermelha"
                type="number"
                value={dadosExtras.observadosSalaVermelha}
                onChange={(e) => setDadosExtras({...dadosExtras, observadosSalaVermelha: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="pacientesSRPA">Pacientes SRPA</Label>
              <Input
                id="pacientesSRPA"
                type="number"
                value={dadosExtras.pacientesSRPA}
                onChange={(e) => setDadosExtras({...dadosExtras, pacientesSRPA: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="salasAtivasCC">Salas Ativas CC</Label>
              <Input
                id="salasAtivasCC"
                type="number"
                value={dadosExtras.salasAtivasCC}
                onChange={(e) => setDadosExtras({...dadosExtras, salasAtivasCC: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="salaTravada">Sala Travada</Label>
              <Input
                id="salaTravada"
                type="number"
                value={dadosExtras.salaTravada}
                onChange={(e) => setDadosExtras({...dadosExtras, salaTravada: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="dataPrevisaoAltas">Data Previsão de Altas</Label>
              <Input
                id="dataPrevisaoAltas"
                type="date"
                value={dadosExtras.dataPrevisaoAltas}
                onChange={(e) => setDadosExtras({...dadosExtras, dataPrevisaoAltas: e.target.value})}
              />
            </div>
          </div>

          {/* Previsão de altas UTI */}
          {dadosExtras.dataPrevisaoAltas && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Previsão de Altas UTI</h3>
              
              {['UTI01', 'UTI02', 'UTI03', 'UTI04'].map((uti) => {
                const utiKey = uti.toLowerCase() as keyof typeof dadosExtras;
                const semPrevisaoKey = `${utiKey}SemPrevisao` as keyof typeof dadosExtras;
                const leitosKey = `leitos${uti}` as keyof typeof dadosExtras;
                
                return (
                  <div key={uti} className="border p-4 rounded">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        checked={dadosExtras[semPrevisaoKey] as boolean}
                        onCheckedChange={(checked) => 
                          setDadosExtras({
                            ...dadosExtras,
                            [semPrevisaoKey]: checked
                          })
                        }
                      />
                      <Label>{uti}: Sem previsão de alta</Label>
                    </div>
                    {!(dadosExtras[semPrevisaoKey] as boolean) && (
                      <Textarea
                        placeholder="Digite os leitos com alta prevista (separados por vírgula)"
                        value={(dadosExtras[leitosKey] as string[]).join(', ')}
                        onChange={(e) => 
                          setDadosExtras({
                            ...dadosExtras,
                            [leitosKey]: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                          })
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Preview do boletim */}
          <div>
            <Label>Preview do Boletim</Label>
            <Textarea
              value={gerarBoletimCompleto()}
              readOnly
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onFechar}>
              Cancelar
            </Button>
            <Button onClick={copiarBoletim}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Boletim
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalBoletimPCP;
