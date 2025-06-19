
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Setor } from '@/types/firestore';

interface FormularioSetorProps {
  setorEditando?: Setor;
  onSalvar: (setor: Omit<Setor, 'id'>) => Promise<void>;
}

const FormularioSetor = ({ setorEditando, onSalvar }: FormularioSetorProps) => {
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    sigla: '',
    andar: '',
    tipo: 'clínico' as 'crítico' | 'clínico' | 'cirúrgico',
    ehPCP: false,
    alertas: [] as string[]
  });

  const [alertasTexto, setAlertasTexto] = useState('');

  useEffect(() => {
    if (setorEditando) {
      setFormData({
        nomeCompleto: setorEditando.nomeCompleto,
        sigla: setorEditando.sigla,
        andar: setorEditando.andar || '',
        tipo: setorEditando.tipo,
        ehPCP: setorEditando.ehPCP || false,
        alertas: setorEditando.alertas || []
      });
      setAlertasTexto((setorEditando.alertas || []).join('\n'));
    }
  }, [setorEditando]);

  const handleSalvar = async () => {
    const alertasArray = alertasTexto
      .split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0);

    await onSalvar({
      ...formData,
      alertas: alertasArray
    });

    if (!setorEditando) {
      setFormData({
        nomeCompleto: '',
        sigla: '',
        andar: '',
        tipo: 'clínico',
        ehPCP: false,
        alertas: []
      });
      setAlertasTexto('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {setorEditando ? 'Editar Setor' : 'Novo Setor'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nomeCompleto">Nome Completo</Label>
            <Input
              id="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={(e) => setFormData({...formData, nomeCompleto: e.target.value})}
              placeholder="Ex: Unidade de Terapia Intensiva 1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sigla">Sigla</Label>
            <Input
              id="sigla"
              value={formData.sigla}
              onChange={(e) => setFormData({...formData, sigla: e.target.value})}
              placeholder="Ex: UTI1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="andar">Andar</Label>
            <Input
              id="andar"
              value={formData.andar}
              onChange={(e) => setFormData({...formData, andar: e.target.value})}
              placeholder="Ex: 2º"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={formData.tipo} onValueChange={(value: any) => setFormData({...formData, tipo: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clínico">Clínico</SelectItem>
                <SelectItem value="crítico">Crítico</SelectItem>
                <SelectItem value="cirúrgico">Cirúrgico</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          {setorEditando ? 'Salvar Alterações' : 'Adicionar Setor'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FormularioSetor;
