
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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

interface CardLeitoMelhoradoProps {
  leito: LeitoWithData;
  onAcao: (acao: string, leitoId: string) => void;
}

const statusConfig = {
  vago: { color: 'bg-green-100 border-green-200 text-green-800', label: 'Vago', icon: Bed },
  ocupado: { color: 'bg-red-100 border-red-200 text-red-800', label: 'Ocupado', icon: User },
  reservado: { color: 'bg-orange-100 border-orange-200 text-orange-800', label: 'Reservado', icon: Calendar },
  bloqueado: { color: 'bg-gray-100 border-gray-200 text-gray-800', label: 'Bloqueado', icon: Ban },
  limpeza: { color: 'bg-blue-100 border-blue-200 text-blue-800', label: 'Limpeza', icon: DoorOpen },
  'mecânica': { color: 'bg-yellow-100 border-yellow-200 text-yellow-800', label: 'Mecânica', icon: AlertTriangle }
};

const CardLeitoMelhorado = ({ leito, onAcao }: CardLeitoMelhoradoProps) => {
  const [tempoDecorrido, setTempoDecorrido] = useState('');
  
  // Garantir que o status existe na configuração, usar 'vago' como fallback
  const statusInfo = statusConfig[leito.status] || statusConfig.vago;
  const StatusIcon = statusInfo.icon;

  // Atualizar tempo decorrido a cada segundo
  useEffect(() => {
    const calcularTempo = () => {
      const agora = new Date();
      const inicio = leito.dataUltimaAtualizacaoStatus.toDate();
      const diff = agora.getTime() - inicio.getTime();
      
      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    };

    setTempoDecorrido(calcularTempo());
    const interval = setInterval(() => {
      setTempoDecorrido(calcularTempo());
    }, 1000);

    return () => clearInterval(interval);
  }, [leito.dataUltimaAtualizacaoStatus]);

  const temIsolamento = leito.tipo === 'isolamento' || (leito.pacienteData?.isolamentosAtivos && leito.pacienteData.isolamentosAtivos.length > 0);

  const renderAcoes = () => {
    const acoes = [];
    
    switch (leito.status) {
      case 'vago':
        acoes.push(
          <Tooltip key="regular">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={() => onAcao('regular', leito.id)}>
                <UserPlus className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Regular paciente</p></TooltipContent>
          </Tooltip>
        );
        acoes.push(
          <Tooltip key="bloquear">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={() => onAcao('bloquear', leito.id)}>
                <Ban className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Bloquear leito</p></TooltipContent>
          </Tooltip>
        );
        break;
      
      case 'ocupado':
        acoes.push(
          <Tooltip key="alta">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={() => onAcao('alta', leito.id)}>
                <CheckCircle className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Dar alta</p></TooltipContent>
          </Tooltip>
        );
        acoes.push(
          <Tooltip key="remanejar">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={() => onAcao('remanejar', leito.id)}>
                <ArrowUpDown className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Remanejar paciente</p></TooltipContent>
          </Tooltip>
        );
        acoes.push(
          <Tooltip key="detalhes">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={() => onAcao('detalhes', leito.id)}>
                <Eye className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Ver detalhes</p></TooltipContent>
          </Tooltip>
        );
        break;
      
      case 'reservado':
        acoes.push(
          <Tooltip key="ocupar">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={() => onAcao('ocupar', leito.id)}>
                <CheckCircle className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Ocupar leito</p></TooltipContent>
          </Tooltip>
        );
        acoes.push(
          <Tooltip key="cancelar">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={() => onAcao('cancelarReserva', leito.id)}>
                <XCircle className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Cancelar reserva</p></TooltipContent>
          </Tooltip>
        );
        break;
      
      case 'limpeza':
      case 'mecânica':
        acoes.push(
          <Tooltip key="liberar">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={() => onAcao('liberar', leito.id)}>
                <DoorOpen className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Liberar leito</p></TooltipContent>
          </Tooltip>
        );
        break;
      
      case 'bloqueado':
        acoes.push(
          <Tooltip key="liberar">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={() => onAcao('liberar', leito.id)}>
                <DoorOpen className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Liberar leito</p></TooltipContent>
          </Tooltip>
        );
        acoes.push(
          <Tooltip key="editar">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={() => onAcao('editarMotivo', leito.id)}>
                <Edit className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Editar motivo</p></TooltipContent>
          </Tooltip>
        );
        break;
    }

    return acoes;
  };

  return (
    <TooltipProvider>
      <Card className={`transition-all duration-200 hover:scale-105 hover:shadow-md border-l-4 ${statusInfo.color}`}>
        <CardContent className="p-2 space-y-1">
          {/* Linha 1: Código + Badges PCP/Isolamento */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{leito.codigo}</h3>
            <div className="flex items-center gap-1">
              {leito.ehPCP && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-4">PCP</Badge>
              )}
              {temIsolamento && (
                <Badge variant="destructive" className="text-xs px-1 py-0 h-4">ISO</Badge>
              )}
            </div>
          </div>
          
          {/* Linha 2: Status + Tempo */}
          <div className="flex items-center justify-between">
            <Badge className="text-xs px-2 py-0 h-5 bg-transparent border" variant="outline">
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">{tempoDecorrido}</span>
          </div>
          
          {/* Linha 3: Informações do Paciente/Motivo */}
          <div className="min-h-[16px] text-xs">
            {leito.status === 'ocupado' && leito.pacienteData && (
              <div>
                <p className="font-medium truncate">{leito.pacienteData.nome}</p>
                <p className="text-muted-foreground">
                  {leito.pacienteData.idade} anos, {leito.pacienteData.sexo === 'M' ? 'M' : 'F'}
                </p>
              </div>
            )}
            
            {leito.status === 'reservado' && leito.pacienteAtual && (
              <div>
                <p className="font-medium truncate">{typeof leito.pacienteAtual === 'string' ? leito.pacienteAtual : 'Paciente Reservado'}</p>
              </div>
            )}
            
            {leito.status === 'bloqueado' && leito.motivoBloqueio && (
              <p className="text-red-600 truncate text-xs" title={leito.motivoBloqueio}>
                {leito.motivoBloqueio}
              </p>
            )}
          </div>
          
          {/* Linha 4: Ações */}
          <div className="flex items-center justify-end gap-1">
            {renderAcoes()}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default CardLeitoMelhorado;
