
import { useState, useEffect } from "react";
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { useMapaLeitos } from "@/hooks/useMapaLeitos";

interface IsolamentoRegulaFacil {
  id: string;
  nomeIsolamento: string;
}

interface FiltrosAvancadosRegulacaoProps {
  onFiltrosChange: (filtros: string[]) => void;
  filtrosAtivos: string[];
}

const FiltrosAvancadosRegulacao = ({ onFiltrosChange, filtrosAtivos }: FiltrosAvancadosRegulacaoProps) => {
  const { setores } = useMapaLeitos();
  const [isolamentosRegulaFacil, setIsolamentosRegulaFacil] = useState<IsolamentoRegulaFacil[]>([]);
  const [sexo, setSexo] = useState("");
  const [setor, setSetor] = useState("");
  const [isolamentosSelecionados, setIsolamentosSelecionados] = useState<string[]>([]);
  const [tempoMinimo, setTempoMinimo] = useState("");
  const [tempoMaximo, setTempoMaximo] = useState("");
  const [idadeMinima, setIdadeMinima] = useState("");
  const [idadeMaxima, setIdadeMaxima] = useState("");
  const [especialidade, setEspecialidade] = useState("");

  // Carregar isolamentos do RegulaFacil
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'isolamentosRegulaFacil'),
      (snapshot) => {
        const isolamentosData = snapshot.docs.map(doc => ({
          id: doc.id,
          nomeIsolamento: doc.data().nomeIsolamento || ''
        }));
        setIsolamentosRegulaFacil(isolamentosData);
      },
      (error) => {
        console.error('Erro ao carregar isolamentos:', error);
      }
    );

    return () => unsubscribe();
  }, []);

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

  const handleIsolamentoToggle = (nomeIsolamento: string) => {
    if (isolamentosSelecionados.includes(nomeIsolamento)) {
      setIsolamentosSelecionados(isolamentosSelecionados.filter(iso => iso !== nomeIsolamento));
    } else {
      setIsolamentosSelecionados([...isolamentosSelecionados, nomeIsolamento]);
    }
  };

  const removerIsolamento = (nomeIsolamento: string) => {
    setIsolamentosSelecionados(isolamentosSelecionados.filter(iso => iso !== nomeIsolamento));
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
        </div>

        {/* Isolamentos */}
        <div className="space-y-2 mb-4">
          <Label>Isolamentos</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {isolamentosRegulaFacil.map((isolamento) => (
              <div key={isolamento.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`isolamento-${isolamento.id}`}
                  checked={isolamentosSelecionados.includes(isolamento.nomeIsolamento)}
                  onCheckedChange={() => handleIsolamentoToggle(isolamento.nomeIsolamento)}
                />
                <Label htmlFor={`isolamento-${isolamento.id}`} className="text-sm font-normal">
                  {isolamento.nomeIsolamento}
                </Label>
              </div>
            ))}
          </div>

          {/* Isolamentos selecionados */}
          {isolamentosSelecionados.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Isolamentos selecionados:</Label>
              <div className="flex flex-wrap gap-2">
                {isolamentosSelecionados.map((nomeIsolamento, index) => (
                  <Badge key={index} variant="secondary">
                    {nomeIsolamento}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => removerIsolamento(nomeIsolamento)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button onClick={aplicarFiltros} className="w-full">
          Aplicar Filtros Avançados
        </Button>
      </CardContent>
    </Card>
  );
};

export default FiltrosAvancadosRegulacao;
