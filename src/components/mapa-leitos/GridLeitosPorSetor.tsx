
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { LeitoWithData } from '@/types/firestore';
import CardLeitoCompacto from './CardLeitoCompacto2';

interface GridLeitosPorSetorProps {
  leitosPorSetor: { setor: any; leitos: LeitoWithData[] }[];
  onAcaoLeito: (acao: string, leitoId: string) => void;
}

interface Quarto {
  numero: string;
  leitos: LeitoWithData[];
  sexoDominante: 'M' | 'F' | 'misto' | 'vazio';
}

const extrairQuarto = (codigoLeito: string): string | null => {
  const codigo = codigoLeito.trim().toUpperCase();
  
  const match = codigo.match(/^(\d+)[\s\-_]?([A-Z]*\d*)?/);
  if (match) {
    const numeroQuarto = match[1];
    if (numeroQuarto.length >= 3) {
      return numeroQuarto;
    }
  }
  
  return null;
};

const determinarSexoDominante = (leitos: LeitoWithData[]): 'M' | 'F' | 'misto' | 'vazio' => {
  const leitosOcupados = leitos.filter(l => l.status === 'ocupado' && l.pacienteData);
  
  if (leitosOcupados.length === 0) return 'vazio';
  
  const sexos = leitosOcupados.map(l => l.pacienteData?.sexo).filter(Boolean);
  const masculinos = sexos.filter(s => s === 'M').length;
  const femininos = sexos.filter(s => s === 'F').length;
  
  if (masculinos > 0 && femininos > 0) return 'misto';
  if (masculinos > 0) return 'M';
  if (femininos > 0) return 'F';
  
  return 'vazio';
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
    .map(numero => {
      const leitosQuarto = quartos[numero].sort((a, b) => a.codigo.localeCompare(b.codigo));
      return {
        numero,
        leitos: leitosQuarto,
        sexoDominante: determinarSexoDominante(leitosQuarto)
      };
    });
  
  if (leitosSemQuarto.length > 0) {
    quartosOrdenados.push({
      numero: 'Outros',
      leitos: leitosSemQuarto.sort((a, b) => a.codigo.localeCompare(b.codigo)),
      sexoDominante: determinarSexoDominante(leitosSemQuarto)
    });
  }
  
  return quartosOrdenados;
};

const getCorSexoDominante = (sexo: 'M' | 'F' | 'misto' | 'vazio') => {
  switch (sexo) {
    case 'M': return 'border-l-4 border-blue-400';
    case 'F': return 'border-l-4 border-pink-400';
    case 'misto': return 'border-l-4 border-orange-400';
    default: return '';
  }
};

const GridLeitosPorSetor = ({ leitosPorSetor, onAcaoLeito }: GridLeitosPorSetorProps) => {
  const [setorExpandido, setSetorExpandido] = useState<string | null>(null);

  const calcularTaxaOcupacao = (leitos: LeitoWithData[]) => {
    const leitosDisponiveis = leitos.filter(l => 
      ['ocupado', 'vago', 'reservado'].includes(l.status)
    );
    
    if (leitosDisponiveis.length === 0) return 0;
    
    const leitosOcupados = leitos.filter(l => l.status === 'ocupado').length;
    return Math.round((leitosOcupados / leitosDisponiveis.length) * 100);
  };

  const toggleSetor = (setorId: string) => {
    setSetorExpandido(prev => prev === setorId ? null : setorId);
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
    <div className="space-y-4">
      {leitosPorSetor.map((grupo) => {
        const taxaOcupacao = calcularTaxaOcupacao(grupo.leitos);
        const setorId = grupo.setor.id || 'sem-setor';
        const isExpandido = setorExpandido === setorId;
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
                    {isExpandido ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
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
            {isExpandido && (
              <CardContent className="p-4">
                {quartos.length > 1 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {quartos.map((quarto) => (
                      <Card key={quarto.numero} className={`bg-muted/20 ${getCorSexoDominante(quarto.sexoDominante)}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            <span>{quarto.numero === 'Outros' ? 'Outros Leitos' : `Quarto ${quarto.numero}`}</span>
                            {quarto.sexoDominante === 'misto' && (
                              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Sexo misto
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-2">
                            {quarto.leitos.map((leito) => (
                              <CardLeitoCompacto
                                key={leito.id}
                                leito={leito}
                                onAcao={onAcaoLeito}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
                    {grupo.leitos.map((leito) => (
                      <CardLeitoCompacto
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

export default GridLeitosPorSetor;
