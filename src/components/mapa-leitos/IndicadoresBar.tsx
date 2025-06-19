
import { Card, CardContent } from '@/components/ui/card';
import { LeitoWithData } from '@/types/firestore';

interface IndicadoresBarProps {
  leitos: LeitoWithData[];
}

const IndicadoresBar = ({ leitos }: IndicadoresBarProps) => {
  const totalLeitos = leitos.length;
  const leitosLivres = leitos.filter(l => l.status === 'vago').length;
  
  // Calcular tempo médio de ocupação (leitos ocupados)
  const leitosOcupados = leitos.filter(l => l.status === 'ocupado');
  const tempoMedioOcupacao = leitosOcupados.length > 0 
    ? leitosOcupados.reduce((acc, leito) => {
        const diffMs = Date.now() - leito.dataUltimaAtualizacaoStatus.toMillis();
        return acc + diffMs;
      }, 0) / leitosOcupados.length
    : 0;

  // Calcular tempo médio de ociosidade (leitos vagos)
  const leitosVagos = leitos.filter(l => l.status === 'vago');
  const tempoMedioOciosidade = leitosVagos.length > 0
    ? leitosVagos.reduce((acc, leito) => {
        const diffMs = Date.now() - leito.dataUltimaAtualizacaoStatus.toMillis();
        return acc + diffMs;
      }, 0) / leitosVagos.length
    : 0;

  const formatTempo = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🛏️</span>
            <div>
              <p className="text-sm text-muted-foreground">Total de Leitos</p>
              <p className="text-2xl font-bold text-primary">{totalLeitos}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm text-muted-foreground">Leitos Livres</p>
              <p className="text-2xl font-bold text-green-600">{leitosLivres}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm text-muted-foreground">Tempo Médio Ocupação</p>
              <p className="text-xl font-bold text-red-600">{formatTempo(tempoMedioOcupacao)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="text-sm text-muted-foreground">Tempo Médio Ociosidade</p>
              <p className="text-xl font-bold text-orange-600">{formatTempo(tempoMedioOciosidade)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndicadoresBar;
