
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeitoWithData } from '@/types/firestore';
import CardLeitoCompacto from './CardLeitoCompacto';

interface GridLeitosPorSetorProps {
  leitosPorSetor: { setor: any; leitos: LeitoWithData[] }[];
  onAcaoLeito: (acao: string, leitoId: string) => void;
}

const GridLeitosPorSetor = ({ leitosPorSetor, onAcaoLeito }: GridLeitosPorSetorProps) => {
  const calcularTaxaOcupacao = (leitos: LeitoWithData[]) => {
    const leitosDisponiveis = leitos.filter(l => 
      ['ocupado', 'vago', 'reservado'].includes(l.status)
    );
    
    if (leitosDisponiveis.length === 0) return 0;
    
    const leitosOcupados = leitos.filter(l => l.status === 'ocupado').length;
    return Math.round((leitosOcupados / leitosDisponiveis.length) * 100);
  };

  if (leitosPorSetor.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-lg text-muted-foreground">
            Nenhum leito encontrado com os filtros aplicados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {leitosPorSetor.map((grupo) => {
        const taxaOcupacao = calcularTaxaOcupacao(grupo.leitos);
        
        return (
          <Card key={grupo.setor.id || 'sem-setor'} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center justify-between">
                <div>
                  <span className="text-xl">{grupo.setor.sigla}</span>
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {grupo.setor.nomeCompleto}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground ml-4">
                    (Taxa de Ocupação: {taxaOcupacao}%)
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {grupo.leitos.length} leitos
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
                {grupo.leitos.map((leito) => (
                  <CardLeitoCompacto
                    key={leito.id}
                    leito={leito}
                    onAcao={onAcaoLeito}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default GridLeitosPorSetor;
