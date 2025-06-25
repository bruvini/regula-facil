
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
  Ban,
  Cross
} from 'lucide-react';
import { LeitoWithData } from '@/types/firestore';
import ModalConfirmacaoAlta from './ModalConfirmacaoAlta';
import ModalRemanejamento from './ModalRemanejamento';
import { useAcoesLeito } from '@/hooks/useAcoesLeito';

interface CardLeitoCompactoProps {
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

const CardLeitoCompacto = ({ leito, onAcao }: CardLeitoCompactoProps) => {
  const [tempoDecorrido, setTempoDecorrido] = useState('');
  const [modalAltaAberto, setModalAltaAberto] = useState(false);
  const [modalRemanejarAberto, setModalRemanejarAberto] = useState(false);
  const { loading, darAlta, solicitarRemanejamento, sinalizarAguardandoUTI } = useAcoesLeito();
  
  const statusInfo = statusConfig[leito.status] || statusConfig.vago;
  const StatusIcon = statusInfo.icon;

  // Verificar se o setor é UTI
  const ehSetorUTI = leito.setorData?.nomeCompleto === 'UTI';

  // Atualizar tempo decorrido a cada minuto
  useEffect(() => {
    const calcularTempo = () => {
      const agora = new Date();
      const inicio = leito.dataUltimaAtualizacaoStatus.toDate();
      const diff = agora.getTime() - inicio.getTime();
      
      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (horas > 0) {
        return `${horas}h${minutos > 0 ? ` ${minutos}m` : ''}`;
      }
      return `${minutos}m`;
    };

    setTempoDecorrido(calcularTempo());
    const interval = setInterval(() => {
      setTempoDecorrido(calcularTempo());
    }, 60000);

    return () => clearInterval(interval);
  }, [leito.dataUltimaAtualizacaoStatus]);

  const temIsolamento = leito.tipo === 'isolamento' || (leito.pacienteData?.isolamentosAtivos && leito.pacienteData.isolamentosAtivos.length > 0);

  const handleConfirmarAlta = async () => {
    if (leito.pacienteData) {
      const sucesso = await darAlta(
        leito.id,
        leito.pacienteData.id,
        leito.pacienteData.nome,
        leito.codigo,
        leito.setorData?.nomeCompleto || ''
      );
      if (sucesso) {
        setModalAltaAberto(false);
      }
    }
  };

  const handleRemanejamento = async (motivo: string) => {
    if (leito.pacienteData) {
      await solicitarRemanejamento(
        leito.id,
        leito.pacienteData.id,
        leito.pacienteData.nome,
        leito.codigo,
        leito.setorData?.nomeCompleto || '',
        motivo
      );
    }
  };

  const handleAguardandoUTI = async () => {
    if (leito.pacienteData && leito.setorData) {
      await sinalizarAguardandoUTI(
        leito.id,
        leito.pacienteData.id,
        leito.pacienteData.nome,
        leito.codigo,
        leito.setorData?.nomeCompleto || ''
      );
    }
  };

  const renderAcoes = () => {
    const acoes = [];
    
    switch (leito.status) {
      case 'vago':
        acoes.push(
          <Tooltip key="regular">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-0.5 h-5 w-5" onClick={() => onAcao('regular', leito.id)}>
                <UserPlus className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Regular</p></TooltipContent>
          </Tooltip>
        );
        acoes.push(
          <Tooltip key="bloquear">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-0.5 h-5 w-5" onClick={() => onAcao('bloquear', leito.id)}>
                <Ban className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Bloquear</p></TooltipContent>
          </Tooltip>
        );
        break;
      
      case 'ocupado':
        acoes.push(
          <Tooltip key="alta">
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-0.5 h-5 w-5" 
                onClick={() => setModalAltaAberto(true)}
                disabled={loading}
              >
                <CheckCircle className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Alta</p></TooltipContent>
          </Tooltip>
        );
        acoes.push(
          <Tooltip key="remanejar">
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="p-0.5 h-5 w-5"
                onClick={() => setModalRemanejarAberto(true)}
                disabled={loading}
              >
                <ArrowUpDown className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Remanejar</p></TooltipContent>
          </Tooltip>
        );
        
        // Adicionar botão UTI apenas se não for setor UTI e ainda não solicitado
        if (!ehSetorUTI && !leito.pacienteData?.aguardaUTI) {
          acoes.push(
            <Tooltip key="uti">
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-0.5 h-5 w-5 text-red-600"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Confirmar que o paciente ${leito.pacienteData?.nome} está aguardando leito de UTI?`
                      )
                    ) {
                      handleAguardandoUTI();
                    }
                  }}
                  disabled={loading}
                >
                  <Cross className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Sinalizar Aguardando UTI</p></TooltipContent>
            </Tooltip>
          );
        }
        
        acoes.push(
          <Tooltip key="detalhes">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-0.5 h-5 w-5">
                <Eye className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Nome:</strong> {leito.pacienteData?.nome || 'Não informado'}
                </p>
                <p>
                  <strong>Sexo:</strong>{' '}
                  {leito.pacienteData?.sexo === 'F' ? 'Feminino' : 'Masculino'}
                </p>
                <p>
                  <strong>Idade:</strong>{' '}
                  {leito.pacienteData?.idade ? `${leito.pacienteData.idade} anos` : 'Não informada'}
                </p>
                {leito.pacienteData?.aguardaUTI && (
                  <p>🩺 Aguardando leito de UTI</p>
                )}
                {leito.pacienteData?.remanejarPaciente && (
                  <p>
                    🔁 Aguardando Remanejamento – Motivo:{' '}
                    {leito.pacienteData.motivoRemanejamento}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
        break;
      
      case 'reservado':
        acoes.push(
          <Tooltip key="ocupar">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-0.5 h-5 w-5" onClick={() => onAcao('ocupar', leito.id)}>
                <CheckCircle className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Ocupar</p></TooltipContent>
          </Tooltip>
        );
        acoes.push(
          <Tooltip key="cancelar">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-0.5 h-5 w-5" onClick={() => onAcao('cancelarReserva', leito.id)}>
                <XCircle className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Cancelar</p></TooltipContent>
          </Tooltip>
        );
        break;
      
      case 'limpeza':
      case 'mecânica':
      case 'bloqueado':
        acoes.push(
          <Tooltip key="liberar">
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="p-0.5 h-5 w-5" onClick={() => onAcao('liberar', leito.id)}>
                <DoorOpen className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Liberar</p></TooltipContent>
          </Tooltip>
        );
        break;
    }

    return acoes;
  };

  return (
    <TooltipProvider>
      <Card className={`transition-all duration-200 hover:scale-105 hover:shadow-sm border-l-2 ${statusInfo.color} cursor-pointer`}>
        <CardContent className="p-1.5 space-y-1">
          {/* Linha 1: Código + Badges */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs">{leito.codigo}</h3>
            <div className="flex items-center gap-0.5">
              {leito.ehPCP && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-3 text-[10px]">P</Badge>
              )}
              {temIsolamento && (
                <Badge variant="destructive" className="text-xs px-1 py-0 h-3 text-[10px]">I</Badge>
              )}
            </div>
          </div>
          
          {/* Linha 2: Status + Tempo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <StatusIcon className="w-2.5 h-2.5" />
              {leito.status !== 'ocupado' && (
                <span className="text-xs">{statusInfo.label}</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono">{tempoDecorrido}</span>
          </div>
          
          {/* Linha 3: Paciente/Motivo */}
          <div className="min-h-[12px] text-xs">
            {leito.status === 'ocupado' && leito.pacienteData && (
              <p
                className="font-medium truncate text-xs flex items-center gap-1"
                title={leito.pacienteData.nome}
              >
                {leito.pacienteData.sexo === 'M' && (
                  <span className="text-blue-500">👨</span>
                )}
                {leito.pacienteData.sexo === 'F' && (
                  <span className="text-pink-500">👩</span>
                )}
                <span className="truncate">{leito.pacienteData.nome}</span>
              </p>
            )}
            
            {leito.status === 'reservado' && leito.pacienteAtual && (
              <p className="font-medium truncate text-xs">{typeof leito.pacienteAtual === 'string' ? leito.pacienteAtual : 'Reservado'}</p>
            )}
            
            {leito.status === 'bloqueado' && leito.motivoBloqueio && (
              <p className="text-red-600 truncate text-xs" title={leito.motivoBloqueio}>
                {leito.motivoBloqueio}
              </p>
            )}
          </div>
          
          {/* Linha 4: Ações */}
          <div className="flex items-center justify-center gap-0.5">
            {renderAcoes()}
          </div>
        </CardContent>
      </Card>

      <ModalConfirmacaoAlta
        aberto={modalAltaAberto}
        onFechar={() => setModalAltaAberto(false)}
        nomePaciente={leito.pacienteData?.nome || 'Paciente'}
        leitoCodigo={leito.codigo}
        onConfirmar={handleConfirmarAlta}
        loading={loading}
      />
      <ModalRemanejamento
        aberto={modalRemanejarAberto}
        onFechar={() => setModalRemanejarAberto(false)}
        onConfirmar={handleRemanejamento}
        loading={loading}
      />
    </TooltipProvider>
  );
};

export default CardLeitoCompacto;
