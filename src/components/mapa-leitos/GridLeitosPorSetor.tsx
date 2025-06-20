
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LeitoWithData } from '@/types/firestore';
import CardLeitoMelhorado from './CardLeitoMelhorado';

interface GridLeitosPorSetorProps {
  leitosPorSetor: { setor: any; leitos: LeitoWithData[] }[];
  onAcaoLeito: (acao: string, leitoId: string) => void;
}

const GridLeitosPorSetor = ({ leitosPorSetor, onAcaoLeito }: GridLeitosPorSetorProps) => {
  const [setoresColapsados, setSetoresColapsados] = useState<{ [key: string]: boolean }>({});

  const calcularTaxaOcupacao = (leitos: LeitoWithData[]) => {
    const leitosDisponiveis = leitos.filter(l => 
      ['ocupado', 'vago', 'reservado'].includes(l.status)
    );
    
    if (leitosDisponiveis.length === 0) return 0;
    
    const leitosOcupados = leitos.filter(l => l.status === 'ocupado').length;
    return Math.round((leitosOcupados / leitosDisponiveis.length) * 100);
  };

  const toggleSetor = (setorId: string) => {
    setSetoresColapsados(prev => ({
      ...prev,
      [setorId]: !prev[setorId]
    }));
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
        const setorId = grupo.setor.id || 'sem-setor';
        const isColapsado = setoresColapsados[setorId];
        
        return (
          <Card key={setorId} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSetor(setorId)}
                    className="p-1 h-auto"
                  >
                    {isColapsado ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <span className="text-xl">{grupo.setor.sigla}</span>
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      {grupo.setor.nomeCompleto}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground ml-4">
                      (Taxa de Ocupação: {taxaOcupacao}%)
                    </span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {grupo.leitos.length} leitos
                </div>
              </CardTitle>
            </CardHeader>
            {!isColapsado && (
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
                  {grupo.leitos.map((leito) => (
                    <CardLeitoMelhorado
                      key={leito.id}
                      leito={leito}
                      onAcao={onAcaoLeito}
                    />
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default GridLeitosPorSetor;
