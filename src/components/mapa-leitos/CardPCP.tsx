
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, AlertTriangle } from 'lucide-react';
import { DadosPCP } from '@/types/pcp';
import { useToast } from '@/hooks/use-toast';
import ModalBoletimPCP from './ModalBoletimPCP';

interface CardPCPProps {
  dadosPCP: DadosPCP;
}

const CardPCP = ({ dadosPCP }: CardPCPProps) => {
  const [modalBoletimAberto, setModalBoletimAberto] = useState(false);
  const { toast } = useToast();

  const copiarBoletimRapido = async () => {
    if (!dadosPCP.nivelAtual) return;

    const agora = new Date();
    const dataHora = agora.toLocaleString('pt-BR');
    
    const textoBoletim = `ATENÇÃO

Estamos em: ${dadosPCP.nivelAtual.nomeNivelPCP} - ${dataHora}

❗ ${dadosPCP.pacientesDCL} Pacientes internados na DCL sem reserva de leito
❗ ${dadosPCP.pacientesDCX} Pacientes internados na DCX sem reserva de leito
❗ ${dadosPCP.pacientesPCP} Pacientes ocupando leito de PCP
❗️ ${dadosPCP.pacientesSalaLaranja} Pacientes internados na sala laranja
❗️ ${dadosPCP.pacientesSalaEmergencia} Pacientes internados na sala vermelha
❗ ${dadosPCP.salasBloqueadas} Salas bloqueadas

${dadosPCP.nivelAtual.orientacoesNivelPCP.map(orientacao => `✅ ${orientacao}`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(textoBoletim);
      toast({
        title: "Boletim PCP copiado",
        description: "O boletim foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o boletim.",
        variant: "destructive",
      });
    }
  };

  if (!dadosPCP.nivelAtual) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">PCP</p>
              <p className="text-lg font-bold">Nível não configurado</p>
              <p className="text-xs text-muted-foreground">{dadosPCP.totalPacientes} pacientes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const corFundo = dadosPCP.nivelAtual.corNivelPCP;
  const corTexto = getContrastColor(corFundo);

  return (
    <>
      <Card 
        className="border-2 shadow-md"
        style={{ 
          backgroundColor: `${corFundo}20`,
          borderColor: corFundo 
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col">
                <Badge 
                  style={{ 
                    backgroundColor: corFundo, 
                    color: corTexto 
                  }}
                  className="mb-1"
                >
                  {dadosPCP.nivelAtual.nomeNivelPCP}
                </Badge>
                <p className="text-lg font-bold" style={{ color: corFundo }}>
                  {dadosPCP.totalPacientes} pacientes
                </p>
                <p className="text-xs text-muted-foreground">
                  DCL: {dadosPCP.pacientesDCL} | DCX: {dadosPCP.pacientesDCX}
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <Button
                size="sm"
                variant="outline"
                onClick={copiarBoletimRapido}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copiar Rápido
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => setModalBoletimAberto(true)}
                className="text-xs"
                style={{ 
                  backgroundColor: corFundo, 
                  color: corTexto 
                }}
              >
                📋 Boletim Completo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ModalBoletimPCP
        aberto={modalBoletimAberto}
        onFechar={() => setModalBoletimAberto(false)}
        dadosPCP={dadosPCP}
      />
    </>
  );
};

// Função para calcular cor de contraste
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

export default CardPCP;
