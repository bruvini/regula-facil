
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LeitoWithData } from '@/types/firestore';
import CardLeitoMelhorado from './CardLeitoMelhorado';

interface GridLeitosComQuartosProps {
  leitosPorSetor: { setor: any; leitos: LeitoWithData[] }[];
  onAcaoLeito: (acao: string, leitoId: string) => void;
}

interface Quarto {
  numero: string;
  leitos: LeitoWithData[];
}

const extrairQuarto = (codigoLeito: string): string | null => {
  // Remover espaços e converter para maiúsculo
  const codigo = codigoLeito.trim().toUpperCase();
  
  // Padrão: números seguidos de letra(s) ou espaço e número (ex: "308 1", "333 L1", "101A")
  const match = codigo.match(/^(\d+)[\s\-_]?([A-Z]*\d*)?/);
  if (match) {
    const numeroQuarto = match[1];
    // Se tem 3 dígitos ou mais, considerar como quarto
    if (numeroQuarto.length >= 3) {
      return numeroQuarto;
    }
  }
  
  return null;
};

const agruparLeitosPorQuarto = (leitos: LeitoWithData[]): Quarto[] => {
  const quartos: { [key: string]: LeitoWithData[] } = {};
  const leitosSemQuarto: LeitoWithData[] = [];
  
  leitos.forEach(leito => {
    const numeroQuarto = extrairQuarto(leito.codigo);
    if (numeroQuarto) {
      if (!quartos[numeroQuarto]) {
        quartos[numeroQuarto] = [];
      }
      quartos[numeroQuarto].push(leito);
    } else {
      leitosSemQuarto.push(leito);
    }
  });
  
  const quartosOrdenados: Quarto[] = Object.keys(quartos)
    .sort()
    .map(numero => ({
      numero,
      leitos: quartos[numero].sort((a, b) => a.codigo.localeCompare(b.codigo))
    }));
  
  // Adicionar leitos sem quarto como um "quarto" especial se existirem
  if (leitosSemQuarto.length > 0) {
    quartosOrdenados.push({
      numero: 'Outros',
      leitos: leitosSemQuarto.sort((a, b) => a.codigo.localeCompare(b.codigo))
    });
  }
  
  return quartosOrdenados;
};

const GridLeitosComQuartos = ({ leitosPorSetor, onAcaoLeito }: GridLeitosComQuartosProps) => {
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

  // Inicializar todos os setores como colapsados
  useState(() => {
    const todosColapsados: { [key: string]: boolean } = {};
    leitosPorSetor.forEach(grupo => {
      const setorId = grupo.setor.id || 'sem-setor';
      todosColapsados[setorId] = true;
    });
    setSetoresColapsados(todosColapsados);
  });

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
    <div className="space-y-4">
      {leitosPorSetor.map((grupo) => {
        const taxaOcupacao = calcularTaxaOcupacao(grupo.leitos);
        const setorId = grupo.setor.id || 'sem-setor';
        const isColapsado = setoresColapsados[setorId];
        const quartos = agruparLeitosPorQuarto(grupo.leitos);
        
        return (
          <Card key={setorId} className="overflow-hidden">
            <CardHeader className="bg-muted/50 py-3">
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
                    <span className="text-lg">{grupo.setor.sigla}</span>
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
              <CardContent className="p-4">
                {quartos.length > 1 ? (
                  // Renderizar com agrupamento por quartos
                  <div className="space-y-4">
                    {quartos.map((quarto) => (
                      <div key={quarto.numero} className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
                          {quarto.numero === 'Outros' ? 'Outros Leitos' : `Quarto ${quarto.numero}`}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
                          {quarto.leitos.map((leito) => (
                            <CardLeitoMelhorado
                              key={leito.id}
                              leito={leito}
                              onAcao={onAcaoLeito}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Renderizar sem agrupamento por quartos
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
                    {grupo.leitos.map((leito) => (
                      <CardLeitoMelhorado
                        key={leito.id}
                        leito={leito}
                        onAcao={onAcaoLeito}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default GridLeitosComQuartos;
