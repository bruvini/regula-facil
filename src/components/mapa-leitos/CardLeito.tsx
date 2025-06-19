
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bed, 
  Calendar,
  AlertTriangle,
  User,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  DoorOpen,
  Edit,
  Eye,
  UserPlus,
  Ban
} from 'lucide-react';
import { LeitoWithData } from '@/types/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CardLeitoProps {
  leito: LeitoWithData;
  onAcao: (acao: string, leitoId: string) => void;
}

const statusConfig = {
  vago: { color: 'bg-green-500', label: 'Vago', icon: Bed },
  ocupado: { color: 'bg-red-500', label: 'Ocupado', icon: User },
  reservado: { color: 'bg-orange-500', label: 'Reservado', icon: Calendar },
  bloqueado: { color: 'bg-gray-500', label: 'Bloqueado', icon: Ban },
  limpeza: { color: 'bg-blue-400', label: 'Limpeza', icon: DoorOpen },
  mecânica: { color: 'bg-yellow-500', label: 'Mecânica', icon: AlertTriangle }
};

const CardLeito = ({ leito, onAcao }: CardLeitoProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const statusInfo = statusConfig[leito.status];
  const StatusIcon = statusInfo.icon;
  
  const tempoDecorrido = formatDistanceToNow(
    leito.dataUltimaAtualizacaoStatus.toDate(),
    { addSuffix: true, locale: ptBR }
  );

  const renderAcoes = () => {
    switch (leito.status) {
      case 'vago':
        return (
          <div className="space-y-2">
            <Button size="sm" className="w-full" onClick={() => onAcao('regular', leito.id)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Regular paciente
            </Button>
            <Button size="sm" variant="destructive" className="w-full" onClick={() => onAcao('bloquear', leito.id)}>
              <Ban className="w-4 h-4 mr-2" />
              Bloquear leito
            </Button>
          </div>
        );
      
      case 'ocupado':
        return (
          <div className="space-y-2">
            <Button size="sm" className="w-full" onClick={() => onAcao('alta', leito.id)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Dar alta
            </Button>
            <Button size="sm" variant="outline" className="w-full" onClick={() => onAcao('remanejar', leito.id)}>
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Remanejar paciente
            </Button>
            <Button size="sm" variant="outline" className="w-full" onClick={() => onAcao('detalhes', leito.id)}>
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
          </div>
        );
      
      case 'reservado':
        return (
          <div className="space-y-2">
            <Button size="sm" className="w-full" onClick={() => onAcao('ocupar', leito.id)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Ocupar leito
            </Button>
            <Button size="sm" variant="destructive" className="w-full" onClick={() => onAcao('cancelarReserva', leito.id)}>
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar reserva
            </Button>
          </div>
        );
      
      case 'limpeza':
      case 'mecânica':
        return (
          <Button size="sm" className="w-full" onClick={() => onAcao('liberar', leito.id)}>
            <DoorOpen className="w-4 h-4 mr-2" />
            Liberar leito
          </Button>
        );
      
      case 'bloqueado':
        return (
          <div className="space-y-2">
            <Button size="sm" className="w-full" onClick={() => onAcao('liberar', leito.id)}>
              <DoorOpen className="w-4 h-4 mr-2" />
              Liberar leito
            </Button>
            <Button size="sm" variant="outline" className="w-full" onClick={() => onAcao('editarMotivo', leito.id)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar motivo
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Card className={`transition-all duration-200 hover:scale-105 hover:shadow-lg border-l-4 ${statusInfo.color}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{leito.codigo}</h3>
              {leito.ehPCP && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary">PCP</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Paciente em Cuidados Prolongados</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-1">
              {leito.pacienteData?.sexo === 'M' && <span className="text-blue-500">👨</span>}
              {leito.pacienteData?.sexo === 'F' && <span className="text-pink-500">👩</span>}
              {leito.pacienteData?.isolamentosAtivos && leito.pacienteData.isolamentosAtivos.length > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-red-500">🦠</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Isolamento ativo</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {leito.alertas.length > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>
                      {leito.alertas.map((alerta, index) => (
                        <p key={index}>{alerta}</p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge className={`${statusInfo.color} text-white`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{tempoDecorrido}</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {leito.setorData && (
            <div className="text-sm">
              <p className="font-medium">{leito.setorData.sigla}</p>
              <p className="text-muted-foreground text-xs">{leito.setorData.andar}</p>
            </div>
          )}
          
          {leito.pacienteData && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 bg-muted rounded-md cursor-pointer">
                  <p className="font-medium text-sm">{leito.pacienteData.nome}</p>
                  <p className="text-xs text-muted-foreground">{leito.pacienteData.idade} anos</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p><strong>Nome:</strong> {leito.pacienteData.nome}</p>
                  <p><strong>Idade:</strong> {leito.pacienteData.idade} anos</p>
                  <p><strong>Sexo:</strong> {leito.pacienteData.sexo === 'M' ? 'Masculino' : 'Feminino'}</p>
                  <p><strong>Status:</strong> {leito.pacienteData.statusInternacao}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
          
          {renderAcoes()}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default CardLeito;
