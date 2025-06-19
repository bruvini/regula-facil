
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  User,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  DoorOpen,
  Edit,
  Eye,
  UserPlus,
  Ban,
  AlertTriangle
} from 'lucide-react';
import { LeitoWithData } from '@/types/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CardLeitoCompactoProps {
  leito: LeitoWithData;
  onAcao: (acao: string, leitoId: string) => void;
}

const statusConfig = {
  vago: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Vago' },
  ocupado: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Ocupado' },
  reservado: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Reservado' },
  bloqueado: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Bloqueado' },
  limpeza: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Limpeza' },
  mecânica: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Mecânica' }
};

const CardLeitoCompacto = ({ leito, onAcao }: CardLeitoCompactoProps) => {
  const statusInfo = statusConfig[leito.status];
  
  const tempoDecorrido = formatDistanceToNow(
    leito.dataUltimaAtualizacaoStatus.toDate(),
    { addSuffix: true, locale: ptBR }
  );

  const renderIconesAcoes = () => {
    const icones = [];
    
    switch (leito.status) {
      case 'vago':
        icones.push(
          <TooltipProvider key="regular">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onAcao('regular', leito.id)}>
                  <UserPlus className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Regular paciente</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>,
          <TooltipProvider key="bloquear">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onAcao('bloquear', leito.id)}>
                  <Ban className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Bloquear leito</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
        break;
      
      case 'ocupado':
        icones.push(
          <TooltipProvider key="alta">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onAcao('alta', leito.id)}>
                  <CheckCircle className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Dar alta</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>,
          <TooltipProvider key="remanejar">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onAcao('remanejar', leito.id)}>
                  <ArrowUpDown className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Remanejar</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>,
          <TooltipProvider key="detalhes">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onAcao('detalhes', leito.id)}>
                  <Eye className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Ver detalhes</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
        break;
        
      case 'reservado':
        icones.push(
          <TooltipProvider key="ocupar">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onAcao('ocupar', leito.id)}>
                  <CheckCircle className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Ocupar leito</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>,
          <TooltipProvider key="cancelar">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onAcao('cancelarReserva', leito.id)}>
                  <XCircle className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Cancelar reserva</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
        break;
        
      case 'limpeza':
      case 'mecânica':
        icones.push(
          <TooltipProvider key="liberar">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onAcao('liberar', leito.id)}>
                  <DoorOpen className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Liberar leito</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
        break;
        
      case 'bloqueado':
        icones.push(
          <TooltipProvider key="liberar">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onAcao('liberar', leito.id)}>
                  <DoorOpen className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Liberar leito</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>,
          <TooltipProvider key="editar">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onAcao('editarMotivo', leito.id)}>
                  <Edit className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Editar motivo</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
        break;
    }
    
    return icones;
  };

  return (
    <Card className={`transition-all duration-200 hover:scale-102 border-l-4 ${statusInfo.color.split(' ')[2]} p-2`}>
      <CardContent className="p-2 space-y-1">
        {/* Linha 1: Código + Status + Tempo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{leito.codigo}</span>
            {leito.ehPCP && <Badge variant="secondary" className="text-xs">PCP</Badge>}
          </div>
          <div className="flex items-center gap-1">
            {leito.alertas.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>
                      {leito.alertas.map((alerta, index) => (
                        <p key={index}>{alerta}</p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Badge className={`text-xs ${statusInfo.color}`}>
            {statusInfo.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{tempoDecorrido}</span>
        </div>
        
        {/* Linha 2: Dados do paciente ou motivo */}
        {leito.pacienteData ? (
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {leito.pacienteData.sexo === 'M' && <span>👨</span>}
              {leito.pacienteData.sexo === 'F' && <span>👩</span>}
              <span>{leito.pacienteData.nome}</span>
              {leito.pacienteData.isolamentosAtivos && leito.pacienteData.isolamentosAtivos.length > 0 && (
                <span className="text-red-500">🦠</span>
              )}
            </div>
            <span>{leito.pacienteData.idade} anos</span>
          </div>
        ) : leito.status === 'bloqueado' && leito.motivoBloqueio ? (
          <div className="text-xs text-muted-foreground p-1 bg-gray-50 rounded">
            <span className="font-medium">Motivo: </span>
            <span>{leito.motivoBloqueio}</span>
          </div>
        ) : null}
        
        {/* Linha 3: Ícones de ações */}
        <div className="flex items-center justify-end gap-1">
          {renderIconesAcoes()}
        </div>
      </CardContent>
    </Card>
  );
};

export default CardLeitoCompacto;
