
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import FiltrosAvancadosRegulacao from "./FiltrosAvancadosRegulacao";

const FiltrosRegulacao = () => {
  const [pesquisa, setPesquisa] = useState("");
  const [statusPaciente, setStatusPaciente] = useState("");
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [filtrosAtivos, setFiltrosAtivos] = useState<string[]>([]);

  const limparFiltros = () => {
    setPesquisa("");
    setStatusPaciente("");
    setFiltrosAtivos([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar por nome ou leito atual..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusPaciente} onValueChange={setStatusPaciente}>
            <SelectTrigger>
              <SelectValue placeholder="Status do paciente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aguardando">Aguardando</SelectItem>
              <SelectItem value="transferindo">Transferindo</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)}
              className="flex-1"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>
            
            {(pesquisa || statusPaciente || filtrosAtivos.length > 0) && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filtros ativos */}
        {filtrosAtivos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filtrosAtivos.map((filtro, index) => (
              <Badge key={index} variant="secondary" className="px-2 py-1">
                {filtro}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFiltrosAtivos(filtrosAtivos.filter((_, i) => i !== index))}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Filtros avançados */}
        {mostrarFiltrosAvancados && (
          <FiltrosAvancadosRegulacao 
            onFiltrosChange={setFiltrosAtivos}
            filtrosAtivos={filtrosAtivos}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default FiltrosRegulacao;
