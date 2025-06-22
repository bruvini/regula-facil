
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ClipboardList, AlertTriangle } from 'lucide-react';
import { DadosPCP } from '@/types/pcp';
import ModalBoletimPCP from './ModalBoletimPCP';

interface CardPCPProps {
  dadosPCP: DadosPCP;
}

const CardPCP = ({ dadosPCP }: CardPCPProps) => {
  const [modalBoletimAberto, setModalBoletimAberto] = useState(false);

  if (!dadosPCP.nivelAtual) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 h-full">
        <CardContent className="p-4 h-full flex items-center">
          <div className="flex items-center space-x-2 w-full">
            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">PCP</p>
              <p className="text-lg font-bold">Nível não configurado</p>
              <p className="text-xs text-muted-foreground">
                {dadosPCP.totalPacientes} pacientes (DCL: {dadosPCP.pacientesDCL}, DCX: {dadosPCP.pacientesDCX})
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Configure os níveis PCP em Configurações
              </p>
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
        className="border-2 shadow-md h-full"
        style={{ 
          backgroundColor: `${corFundo}20`,
          borderColor: corFundo 
        }}
      >
        <CardContent className="p-4 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <Badge 
                style={{ 
                  backgroundColor: corFundo, 
                  color: corTexto 
                }}
                className="mb-2"
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
            <div className="flex-shrink-0 ml-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setModalBoletimAberto(true)}
                      className="h-8 w-8"
                      style={{ 
                        color: corFundo 
                      }}
                    >
                      <ClipboardList className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Boletim Completo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
