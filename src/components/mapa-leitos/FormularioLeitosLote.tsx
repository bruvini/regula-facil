
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Setor, Leito } from '@/types/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FormularioLeitosLoteProps {
  setores: Setor[];
  onSalvar: (leitos: Array<Omit<Leito, 'id' | 'dataUltimaAtualizacaoStatus'>>) => Promise<void>;
}

const FormularioLeitosLote = ({ setores, onSalvar }: FormularioLeitosLoteProps) => {
  const [formData, setFormData] = useState({
    setor: '',
    codigos: '',
    tipo: 'clínico' as 'clínico' | 'crítico' | 'isolamento',
    ehPCP: false,
    alertas: [] as string[],
    status: 'vago' as const
  });

  const [alertasTexto, setAlertasTexto] = useState('');

  const handleSalvar = async () => {
    if (!formData.setor || !formData.codigos.trim()) {
      return;
    }

    const codigosArray = formData.codigos
      .split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0);

    const alertasArray = alertasTexto
      .split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0);

    const leitosData = codigosArray.map(codigo => ({
      codigo,
      setor: doc(db, 'setoresRegulaFacil', formData.setor),
      tipo: formData.tipo,
      ehPCP: formData.ehPCP,
      alertas: alertasArray,
      status: formData.status
    }));

    await onSalvar(leitosData);

    // Reset form
    setFormData({
      setor: '',
      codigos: '',
      tipo: 'clínico',
      ehPCP: false,
      alertas: [],
      status: 'vago'
    });
    setAlertasTexto('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Adicionar Leitos em Lote
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="setorLeito">Setor</Label>
            <Select value={formData.setor} onValueChange={(value) => setFormData({...formData, setor: value})}>
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

          <div className="space-y-2">
            <Label htmlFor="tipoLeito">Tipo</Label>
            <Select value={formData.tipo} onValueChange={(value: any) => setFormData({...formData, tipo: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clínico">Clínico</SelectItem>
                <SelectItem value="crítico">Crítico</SelectItem>
                <SelectItem value="isolamento">Isolamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="codigos">Códigos dos Leitos (um por linha)</Label>
          <Textarea
            id="codigos"
            value={formData.codigos}
            onChange={(e) => setFormData({...formData, codigos: e.target.value})}
            placeholder="Ex:&#10;01&#10;02&#10;03&#10;04"
            rows={4}
          />
        </div>

        <div className="space-y-2 flex items-center space-x-2">
          <Checkbox
            id="ehPCP"
            checked={formData.ehPCP}
            onCheckedChange={(checked) => setFormData({...formData, ehPCP: checked as boolean})}
          />
          <Label htmlFor="ehPCP">É PCP</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="alertas">Alertas (um por linha)</Label>
          <Textarea
            id="alertas"
            value={alertasTexto}
            onChange={(e) => setAlertasTexto(e.target.value)}
            placeholder="Digite um alerta por linha..."
            rows={3}
          />
        </div>

        <Button onClick={handleSalvar} className="w-full">
          Adicionar Leitos
        </Button>
      </CardContent>
    </Card>
  );
};

export default FormularioLeitosLote;
