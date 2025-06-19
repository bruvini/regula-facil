
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Setor } from '@/types/firestore';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

interface FiltrosAvancadosProps {
  aberto: boolean;
  setores: Setor[];
  filtros: {
    setorSelecionado: string;
    statusSelecionados: string[];
    tipoLeito: string;
    apenasPC: boolean;
    isolamento: string;
    tempoMinimoStatus: number;
    sexoPaciente: string;
  };
  onFiltroChange: (filtros: any) => void;
}

const statusOptions = [
  { value: 'vago', label: 'Vago', color: 'bg-green-500' },
  { value: 'ocupado', label: 'Ocupado', color: 'bg-red-500' },
  { value: 'reservado', label: 'Reservado', color: 'bg-orange-500' },
  { value: 'bloqueado', label: 'Bloqueado', color: 'bg-gray-500' },
  { value: 'limpeza', label: 'Limpeza', color: 'bg-blue-400' },
  { value: 'mecânica', label: 'Mecânica', color: 'bg-yellow-500' }
];

const FiltrosAvancados = ({ aberto, setores, filtros, onFiltroChange }: FiltrosAvancadosProps) => {
  const handleStatusToggle = (status: string) => {
    const novosStatus = filtros.statusSelecionados.includes(status)
      ? filtros.statusSelecionados.filter(s => s !== status)
      : [...filtros.statusSelecionados, status];
    
    onFiltroChange({ ...filtros, statusSelecionados: novosStatus });
  };

  return (
    <Collapsible open={aberto}>
      <CollapsibleContent className="space-y-4 animate-accordion-down">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div className="space-y-2">
            <Label>Sexo do Paciente</Label>
            <Select value={filtros.sexoPaciente} onValueChange={(value) => onFiltroChange({ ...filtros, sexoPaciente: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
  );
};

export default FiltrosAvancados;
