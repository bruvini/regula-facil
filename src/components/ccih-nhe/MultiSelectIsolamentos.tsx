
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Isolamento {
  id: string;
  nomeIsolamento: string;
}

interface MultiSelectIsolamentosProps {
  selectedIsolamentos: string[];
  onSelectionChange: (selected: string[]) => void;
}

const MultiSelectIsolamentos = ({ selectedIsolamentos, onSelectionChange }: MultiSelectIsolamentosProps) => {
  const [isolamentos, setIsolamentos] = useState<Isolamento[]>([]);
  const [open, setOpen] = useState(false);

  // Carregar isolamentos do Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'isolamentosRegulaFacil'),
      (snapshot) => {
        const isolamentosData = snapshot.docs.map(doc => ({
          id: doc.id,
          nomeIsolamento: doc.data().nomeIsolamento || ''
        }));
        setIsolamentos(isolamentosData);
      },
      (error) => {
        console.error('Erro ao carregar isolamentos:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSelect = (isolamentoId: string) => {
    if (selectedIsolamentos.includes(isolamentoId)) {
      onSelectionChange(selectedIsolamentos.filter(id => id !== isolamentoId));
    } else {
      onSelectionChange([...selectedIsolamentos, isolamentoId]);
    }
  };

  const removeIsolamento = (isolamentoId: string) => {
    onSelectionChange(selectedIsolamentos.filter(id => id !== isolamentoId));
  };

  const getSelectedNames = () => {
    return isolamentos
      .filter(iso => selectedIsolamentos.includes(iso.id))
      .map(iso => iso.nomeIsolamento);
  };

  return (
    <div className="space-y-2">
      <Select open={open} onOpenChange={setOpen}>
        <SelectTrigger>
          <SelectValue placeholder="Selecionar isolamentos" />
        </SelectTrigger>
        <SelectContent>
          {isolamentos.map((isolamento) => (
            <SelectItem 
              key={isolamento.id} 
              value={isolamento.id}
              onSelect={() => handleSelect(isolamento.id)}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIsolamentos.includes(isolamento.id)}
                  onChange={() => handleSelect(isolamento.id)}
                  className="h-4 w-4"
                />
                {isolamento.nomeIsolamento}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Badges dos selecionados */}
      {selectedIsolamentos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getSelectedNames().map((nome, index) => (
            <Badge key={index} variant="default" className="flex items-center gap-1">
              {nome}
              <X 
                className="h-3 w-3 cursor-pointer hover:bg-primary/20 rounded-full p-0.5" 
                onClick={() => removeIsolamento(selectedIsolamentos[index])}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectIsolamentos;
