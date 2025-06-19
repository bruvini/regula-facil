
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Setor } from '@/types/firestore';

interface FiltrosLeitosProps {
  busca: string;
  onBuscaChange: (busca: string) => void;
  setorSelecionado: string;
  onSetorChange: (setor: string) => void;
  setores: Setor[];
  filtrosAvancadosAbertos: boolean;
  onToggleFiltrosAvancados: () => void;
  onAbrirModal: () => void;
}

const FiltrosLeitos = ({
  busca,
  onBuscaChange,
  setorSelecionado,
  onSetorChange,
  setores,
  filtrosAvancadosAbertos,
  onToggleFiltrosAvancados,
  onAbrirModal
}: FiltrosLeitosProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-center mb-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, paciente..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="w-full lg:w-64">
        <Select value={setorSelecionado} onValueChange={onSetorChange}>
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

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onToggleFiltrosAvancados}
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
  );
};

export default FiltrosLeitos;
