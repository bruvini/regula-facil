
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Search, Settings } from 'lucide-react';
import { Setor } from '@/types/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FiltrosCompactosProps {
  setores: Setor[];
  filtros: {
    busca: string;
    setorSelecionado: string;
    statusSelecionados: string[];
    tipoLeito: string;
    apenasPC: boolean;
    isolamento: string;
    tempoMinimoStatus: number;
  };
  onFiltroChange: (filtros: any) => void;
  onAbrirModal: () => void;
}

const statusOptions = [
  { value: 'vago', label: 'Vago', color: 'bg-green-500' },
  { value: 'ocupado', label: 'Ocupado', color: 'bg-red-500' },
  { value: 'reservado', label: 'Reservado', color: 'bg-orange-500' },
  { value: 'bloqueado', label: 'Bloqueado', color: 'bg-gray-500' },
  { value: 'limpeza', label: 'Limpeza', color: 'bg-blue-400' },
  { value: 'mecânica', label: 'Mecânica', color: 'bg-yellow-500' }
];

const FiltrosCompactos = ({ setores, filtros, onFiltroChange, onAbrirModal }: FiltrosCompactosProps) => {
  const [filtrosAvancadosAbertos, setFiltrosAvancadosAbertos] = useState(false);

  const handleStatusToggle = (status: string) => {
    const novosStatus = filtros.statusSelecionados.includes(status)
      ? filtros.statusSelecionados.filter(s => s !== status)
      : [...filtros.statusSelecionados, status];
    
    onFiltroChange({ ...filtros, statusSelecionados: novosStatus });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Linha principal de filtros */}
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Campo de busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, setor ou status..."
              value={filtros.busca}
              onChange={(e) => onFiltroChange({ ...filtros, busca: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFiltrosAvancadosAbertos(!filtrosAvancadosAbertos)}
              className="flex items-center gap-2"
            >
              {filtrosAvancadosAbertos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Filtros Avançados
            </Button>
            
            <Button
              variant="outline"
              onClick={onAbrirModal}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Gerenciar Setores e Leitos
            </Button>
          </div>
        </div>

        {/* Seção de filtros avançados (colapsível) */}
        <Collapsible open={filtrosAvancadosAbertos}>
          <CollapsibleContent className="mt-4 space-y-4 animate-accordion-down">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Setor */}
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select value={filtros.setorSelecionado} onValueChange={(value) => onFiltroChange({ ...filtros, setorSelecionado: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os setores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os setores</SelectItem>
                    {setores.map((setor) => (
                      <SelectItem key={setor.id} value={setor.id}>
                        {setor.sigla} - {setor.nomeCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Isolamento */}
              <div className="space-y-2">
                <Label>Isolamento</Label>
                <Select value={filtros.isolamento} onValueChange={(value) => onFiltroChange({ ...filtros, isolamento: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="com">Com Isolamento</SelectItem>
                    <SelectItem value="sem">Sem Isolamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* PCP */}
              <div className="space-y-2">
                <Label>PCP</Label>
                <Select value={filtros.apenasPC ? 'sim' : 'todos'} onValueChange={(value) => onFiltroChange({ ...filtros, apenasPC: value === 'sim' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Somente PCP</SelectItem>
                    <SelectItem value="nao">Somente não-PCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tempo mínimo no status */}
              <div className="space-y-2">
                <Label>Tempo mínimo no status (min)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filtros.tempoMinimoStatus || ''}
                  onChange={(e) => onFiltroChange({ ...filtros, tempoMinimoStatus: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Botões de Status */}
            <div className="space-y-2">
              <Label>Status dos Leitos</Label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <Badge
                    key={status.value}
                    variant={filtros.statusSelecionados.includes(status.value) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      filtros.statusSelecionados.includes(status.value) 
                        ? `${status.color} text-white hover:opacity-80` 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleStatusToggle(status.value)}
                  >
                    {status.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default FiltrosCompactos;
