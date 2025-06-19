
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { Setor, Leito } from '@/types/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LeitoFormData {
  codigo: string;
  ehPCP: boolean;
  ehIsolamento: boolean;
  alertas: string;
}

interface FormularioLeitosLoteProps {
  setores: Setor[];
  onSalvar: (leitos: Array<Omit<Leito, 'id' | 'dataUltimaAtualizacaoStatus'>>) => Promise<void>;
}

const FormularioLeitosLote = ({ setores, onSalvar }: FormularioLeitosLoteProps) => {
  const [setorSelecionado, setSetorSelecionado] = useState('');
  const [leitos, setLeitos] = useState<LeitoFormData[]>([
    { codigo: '', ehPCP: false, ehIsolamento: false, alertas: '' }
  ]);

  const adicionarLinha = () => {
    setLeitos([...leitos, { codigo: '', ehPCP: false, ehIsolamento: false, alertas: '' }]);
  };

  const removerLinha = (index: number) => {
    if (leitos.length > 1) {
      setLeitos(leitos.filter((_, i) => i !== index));
    }
  };

  const atualizarLeito = (index: number, campo: keyof LeitoFormData, valor: any) => {
    const novosLeitos = [...leitos];
    novosLeitos[index] = { ...novosLeitos[index], [campo]: valor };
    setLeitos(novosLeitos);
  };

  const handleSalvar = async () => {
    if (!setorSelecionado) return;

    const leitosValidos = leitos.filter(leito => leito.codigo.trim());
    
    const leitosData = leitosValidos.map(leito => {
      const alertasArray = leito.alertas
        .split('\n')
        .map(linha => linha.trim())
        .filter(linha => linha.length > 0);

      return {
        codigo: leito.codigo,
        setor: doc(db, 'setoresRegulaFacil', setorSelecionado),
        tipo: leito.ehIsolamento ? 'isolamento' as const : 'clínico' as const,
        ehPCP: leito.ehPCP,
        alertas: alertasArray,
        status: 'vago' as const
      };
    });

    await onSalvar(leitosData);

    // Reset form
    setSetorSelecionado('');
    setLeitos([{ codigo: '', ehPCP: false, ehIsolamento: false, alertas: '' }]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Adicionar Leitos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="setorLeito">Setor</Label>
          <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o setor" />
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

        {setorSelecionado && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Leitos</Label>
              <Button type="button" variant="outline" size="sm" onClick={adicionarLinha}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Linha
              </Button>
            </div>

            {leitos.map((leito, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                <div className="col-span-3">
                  <Label className="text-xs">Código</Label>
                  <Input
                    placeholder="Ex: 01"
                    value={leito.codigo}
                    onChange={(e) => atualizarLeito(index, 'codigo', e.target.value)}
                  />
                </div>

                <div className="col-span-4">
                  <Label className="text-xs">Alertas</Label>
                  <Textarea
                    placeholder="Um alerta por linha..."
                    value={leito.alertas}
                    onChange={(e) => atualizarLeito(index, 'alertas', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="col-span-2 flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`pcp-${index}`}
                      checked={leito.ehPCP}
                      onCheckedChange={(checked) => atualizarLeito(index, 'ehPCP', checked)}
                    />
                    <Label htmlFor={`pcp-${index}`} className="text-xs">PCP</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`isolamento-${index}`}
                      checked={leito.ehIsolamento}
                      onCheckedChange={(checked) => atualizarLeito(index, 'ehIsolamento', checked)}
                    />
                    <Label htmlFor={`isolamento-${index}`} className="text-xs">Isolamento</Label>
                  </div>
                </div>

                <div className="col-span-1">
                  {leitos.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removerLinha(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button onClick={handleSalvar} className="w-full">
              Adicionar Leitos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FormularioLeitosLote;
