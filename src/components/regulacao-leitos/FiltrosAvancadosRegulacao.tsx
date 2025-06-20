
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useMapaLeitos } from "@/hooks/useMapaLeitos";

interface FiltrosAvancadosRegulacaoProps {
  onFiltrosChange: (filtros: string[]) => void;
  filtrosAtivos: string[];
}

const FiltrosAvancadosRegulacao = ({ onFiltrosChange, filtrosAtivos }: FiltrosAvancadosRegulacaoProps) => {
  const { setores, isolamentoTipos } = useMapaLeitos();
  const [sexo, setSexo] = useState("");
  const [setor, setSetor] = useState("");
  const [isolamentosSelecionados, setIsolamentosSelecionados] = useState<string[]>([]);
  const [tempoMinimo, setTempoMinimo] = useState("");
  const [tempoMaximo, setTempoMaximo] = useState("");
  const [idadeMinima, setIdadeMinima] = useState("");
  const [idadeMaxima, setIdadeMaxima] = useState("");
  const [especialidade, setEspecialidade] = useState("");

  const especialidades = [
    "Cardiologia",
    "Neurologia",
    "Ortopedia",
    "Pneumologia",
    "Gastroenterologia",
    "Nefrologia",
    "Oncologia",
    "Cirurgia Geral"
  ];

  const aplicarFiltros = () => {
    const novosFiltros: string[] = [];
    
    if (sexo) novosFiltros.push(`Sexo: ${sexo}`);
    if (setor) {
      const setorObj = setores.find(s => s.id === setor);
      novosFiltros.push(`Setor: ${setorObj?.sigla || setor}`);
    }
    if (isolamentosSelecionados.length > 0) {
      novosFiltros.push(`Isolamento: ${isolamentosSelecionados.length} tipo(s)`);
    }
    if (tempoMinimo || tempoMaximo) {
      novosFiltros.push(`Tempo: ${tempoMinimo || '0'}h - ${tempoMaximo || '∞'}h`);
    }
    if (idadeMinima || idadeMaxima) {
      novosFiltros.push(`Idade: ${idadeMinima || '0'} - ${idadeMaxima || '∞'} anos`);
    }
    if (especialidade) novosFiltros.push(`Especialidade: ${especialidade}`);

    onFiltrosChange([...filtrosAtivos.filter(f => !f.includes(':')), ...novosFiltros]);
  };

  const adicionarIsolamento = (isolamentoId: string) => {
    if (!isolamentosSelecionados.includes(isolamentoId)) {
      setIsolamentosSelecionados([...isolamentosSelecionados, isolamentoId]);
    }
  };

  const removerIsolamento = (isolamentoId: string) => {
    setIsolamentosSelecionados(isolamentosSelecionados.filter(id => id !== isolamentoId));
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Sexo */}
          <div className="space-y-2">
            <Label>Sexo</Label>
            <Select value={sexo} onValueChange={setSexo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Setor */}
          <div className="space-y-2">
            <Label>Setor</Label>
            <Select value={setor} onValueChange={setSetor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar setor" />
              </SelectTrigger>
              <SelectContent>
                {setores.map((setor) => (
                  <SelectItem key={setor.id} value={setor.id}>
                    {setor.sigla} - {setor.nomeCompleto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Especialidade */}
          <div className="space-y-2">
            <Label>Especialidade Médica</Label>
            <Select value={especialidade} onValueChange={setEspecialidade}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar especialidade" />
              </SelectTrigger>
              <SelectContent>
                {especialidades.map((esp) => (
                  <SelectItem key={esp} value={esp}>
                    {esp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tempo de espera */}
          <div className="space-y-2">
            <Label>Tempo Aguardando (horas)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Min"
                type="number"
                value={tempoMinimo}
                onChange={(e) => setTempoMinimo(e.target.value)}
              />
              <Input
                placeholder="Max"
                type="number"
                value={tempoMaximo}
                onChange={(e) => setTempoMaximo(e.target.value)}
              />
            </div>
          </div>

          {/* Idade */}
          <div className="space-y-2">
            <Label>Idade (anos)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Min"
                type="number"
                value={idadeMinima}
                onChange={(e) => setIdadeMinima(e.target.value)}
              />
              <Input
                placeholder="Max"
                type="number"
                value={idadeMaxima}
                onChange={(e) => setIdadeMaxima(e.target.value)}
              />
            </div>
          </div>

          {/* Isolamento */}
          <div className="space-y-2">
            <Label>Isolamento</Label>
            <Select onValueChange={adicionarIsolamento}>
              <SelectTrigger>
                <SelectValue placeholder="Adicionar isolamento" />
              </SelectTrigger>
              <SelectContent>
                {isolamentoTipos
                  .filter(tipo => !isolamentosSelecionados.includes(tipo.id))
                  .map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.tipo}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Isolamentos selecionados */}
        {isolamentosSelecionados.length > 0 && (
          <div className="mb-4">
            <Label className="text-sm text-muted-foreground">Isolamentos selecionados:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {isolamentosSelecionados.map((isolamentoId) => {
                const isolamento = isolamentoTipos.find(t => t.id === isolamentoId);
                return (
                  <Badge key={isolamentoId} variant="secondary">
                    {isolamento?.tipo}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => removerIsolamento(isolamentoId)}
                    />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <Button onClick={aplicarFiltros} className="w-full">
          Aplicar Filtros Avançados
        </Button>
      </CardContent>
    </Card>
  );
};

export default FiltrosAvancadosRegulacao;
