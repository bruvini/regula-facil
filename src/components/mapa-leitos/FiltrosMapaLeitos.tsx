
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus } from 'lucide-react';
import { Setor } from '@/types/firestore';

interface FiltrosProps {
  setores: Setor[];
  filtros: {
    busca: string;
    setorSelecionado: string;
    statusSelecionados: string[];
    tipoLeito: string;
    apenasPC: boolean;
  };
  onFiltroChange: (filtros: any) => void;
  onGerenciarSetores: () => void;
  onGerenciarLeitos: () => void;
}

const statusOptions = [
  { value: 'vago', label: 'Vago', color: 'bg-green-500' },
  { value: 'ocupado', label: 'Ocupado', color: 'bg-red-500' },
  { value: 'reservado', label: 'Reservado', color: 'bg-orange-500' },
  { value: 'bloqueado', label: 'Bloqueado', color: 'bg-gray-500' },
  { value: 'limpeza', label: 'Limpeza', color: 'bg-blue-400' },
  { value: 'mecânica', label: 'Mecânica', color: 'bg-yellow-500' }
];

const FiltrosMapaLeitos = ({ setores, filtros, onFiltroChange, onGerenciarSetores, onGerenciarLeitos }: FiltrosProps) => {
  const handleStatusToggle = (status: string) => {
    const novosStatus = filtros.statusSelecionados.includes(status)
      ? filtros.statusSelecionados.filter(s => s !== status)
      : [...filtros.statusSelecionados, status];
    
    onFiltroChange({ ...filtros, statusSelecionados: novosStatus });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Busca */}
          <div className="space-y-2">
            <Label htmlFor="busca">Buscar</Label>
            <Input
              id="busca"
              placeholder="Código, setor, status..."
              value={filtros.busca}
              onChange={(e) => onFiltroChange({ ...filtros, busca: e.target.value })}
            />
          </div>

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

          {/* Tipo de Leito */}
          <div className="space-y-2">
            <Label>Tipo de Leito</Label>
            <Select value={filtros.tipoLeito} onValueChange={(value) => onFiltroChange({ ...filtros, tipoLeito: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="clínico">Clínico</SelectItem>
                <SelectItem value="crítico">Crítico</SelectItem>
                <SelectItem value="isolamento">Isolamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Checkbox PCP */}
          <div className="space-y-2 flex flex-col justify-end">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="apenasPC"
                checked={filtros.apenasPC}
                onCheckedChange={(checked) => onFiltroChange({ ...filtros, apenasPC: checked })}
              />
              <Label htmlFor="apenasPC">Apenas PCP</Label>
            </div>
          </div>
        </div>

        {/* Status Multi-select */}
        <div className="space-y-2 mb-4">
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

        {/* Botões de Gerenciamento */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onGerenciarSetores}>
            <Settings className="w-4 h-4 mr-2" />
            Gerenciar Setores
          </Button>
          <Button variant="outline" onClick={onGerenciarLeitos}>
            <Plus className="w-4 h-4 mr-2" />
            Gerenciar Leitos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltrosMapaLeitos;
