
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Setor, Leito, LeitoWithData } from '@/types/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LeitoFormData {
  codigo: string;
  alertas: string[];
  ehPCP: boolean;
  ehIsolamento: boolean;
}

interface FormularioLeitosLoteProps {
  setores: Setor[];
  leitos: LeitoWithData[];
  onSalvar: (leitos: Array<Omit<Leito, 'id' | 'dataUltimaAtualizacaoStatus'>>) => Promise<void>;
  leitoEditando?: { leito: LeitoWithData; index?: number };
  onEditarLeito?: (leitoId: string, leitoData: Partial<Leito>) => Promise<void>;
}

const FormularioLeitosLote = ({ setores, leitos, onSalvar, leitoEditando, onEditarLeito }: FormularioLeitosLoteProps) => {
  const [setorSelecionado, setSetorSelecionado] = useState('');
  const [leitosForm, setLeitosForm] = useState<LeitoFormData[]>([{
    codigo: '',
    alertas: [],
    ehPCP: false,
    ehIsolamento: false
  }]);

  // Filtrar leitos por setor selecionado - adicionar verificação de segurança
  const leitosDoSetor = setorSelecionado && leitos ? 
    leitos.filter(leito => leito.setorData?.id === setorSelecionado) : 
    [];

  // Inicializar com dados do leito sendo editado
  useEffect(() => {
    if (leitoEditando) {
      setLeitosForm([{
        codigo: leitoEditando.leito.codigo,
        alertas: leitoEditando.leito.alertas || [],
        ehPCP: leitoEditando.leito.ehPCP,
        ehIsolamento: leitoEditando.leito.tipo === 'isolamento'
      }]);
      
      // Se estiver editando, pegar o setor do leito
      if (leitoEditando.leito.setorData?.id) {
        setSetorSelecionado(leitoEditando.leito.setorData.id);
      }
    }
  }, [leitoEditando]);

  const adicionarLeito = () => {
    setLeitosForm([...leitosForm, {
      codigo: '',
      alertas: [],
      ehPCP: false,
      ehIsolamento: false
    }]);
  };

  const removerLeito = (index: number) => {
    if (leitosForm.length > 1) {
      setLeitosForm(leitosForm.filter((_, i) => i !== index));
    }
  };

  const atualizarLeito = (index: number, campo: keyof LeitoFormData, valor: any) => {
    const novosLeitos = [...leitosForm];
    if (campo === 'alertas' && typeof valor === 'string') {
      novosLeitos[index][campo] = valor.split('\n').filter(linha => linha.trim().length > 0);
    } else {
      (novosLeitos[index] as any)[campo] = valor;
    }
    setLeitosForm(novosLeitos);
  };

  const handleSalvar = async () => {
    if (!setorSelecionado && !leitoEditando) {
      return;
    }

    try {
      if (leitoEditando && onEditarLeito) {
        // Editando um leito existente
        const leitoData = leitosForm[0];
        await onEditarLeito(leitoEditando.leito.id, {
          codigo: leitoData.codigo,
          alertas: leitoData.alertas,
          ehPCP: leitoData.ehPCP,
          tipo: leitoData.ehIsolamento ? 'isolamento' : 'clínico'
        });
      } else {
        // Adicionando novos leitos
        const setorRef = doc(db, 'setoresRegulaFacil', setorSelecionado);
        const leitosParaSalvar = leitosForm.map(leito => ({
          codigo: leito.codigo,
          status: 'vago' as const,
          tipo: leito.ehIsolamento ? 'isolamento' as const : 'clínico' as const,
          setor: setorRef,
          ehPCP: leito.ehPCP,
          alertas: leito.alertas
        }));

        await onSalvar(leitosParaSalvar);

        // Reset form
        setSetorSelecionado('');
        setLeitosForm([{
          codigo: '',
          alertas: [],
          ehPCP: false,
          ehIsolamento: false
        }]);
      }
    } catch (error) {
      console.error('Erro ao salvar leitos:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {leitoEditando ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {leitoEditando ? 'Editar Leito' : 'Adicionar Leitos em Lote'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Setor (apenas para novos leitos) */}
          {!leitoEditando && (
            <div className="space-y-2">
              <Label htmlFor="setor">Setor *</Label>
              <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map(setor => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.sigla} - {setor.nomeCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Lista de Leitos */}
          <div className="space-y-4">
            {leitosForm.map((leito, index) => (
              <Card key={index} className="p-4 border-dashed">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">
                    {leitoEditando ? 'Dados do Leito' : `Leito ${index + 1}`}
                  </h4>
                  {!leitoEditando && leitosForm.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removerLeito(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Grid de campos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Código do Leito */}
                  <div className="space-y-2">
                    <Label htmlFor={`codigo-${index}`}>Código *</Label>
                    <Input
                      id={`codigo-${index}`}
                      value={leito.codigo}
                      onChange={(e) => atualizarLeito(index, 'codigo', e.target.value)}
                      placeholder="Ex: 101A"
                    />
                  </div>

                  {/* Checkboxes - PCP e Isolamento lado a lado */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`pcp-${index}`}
                          checked={leito.ehPCP}
                          onCheckedChange={(checked) => atualizarLeito(index, 'ehPCP', checked)}
                        />
                        <Label htmlFor={`pcp-${index}`} className="text-sm">
                          É PCP
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`isolamento-${index}`}
                          checked={leito.ehIsolamento}
                          onCheckedChange={(checked) => atualizarLeito(index, 'ehIsolamento', checked)}
                        />
                        <Label htmlFor={`isolamento-${index}`} className="text-sm">
                          É Isolamento
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alertas - span completo */}
                <div className="mt-4 space-y-2">
                  <Label htmlFor={`alertas-${index}`}>Alertas (um por linha)</Label>
                  <Textarea
                    id={`alertas-${index}`}
                    value={leito.alertas.join('\n')}
                    onChange={(e) => atualizarLeito(index, 'alertas', e.target.value)}
                    placeholder="Digite um alerta por linha..."
                    rows={3}
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!leitoEditando && (
              <Button type="button" variant="outline" onClick={adicionarLeito} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Mais Um Leito
              </Button>
            )}
            
            <Button 
              onClick={handleSalvar} 
              className="flex-1"
              disabled={(!setorSelecionado && !leitoEditando) || leitosForm.some(l => !l.codigo.trim())}
            >
              {leitoEditando ? 'Salvar Alterações' : `Adicionar ${leitosForm.length} Leitos`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mostrar leitos existentes do setor selecionado */}
      {setorSelecionado && leitosDoSetor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Leitos Existentes no Setor {setores.find(s => s.id === setorSelecionado)?.sigla}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {leitosDoSetor.map(leito => (
                <div key={leito.id} className={`p-2 rounded border text-sm ${
                  leito.status === 'vago' ? 'bg-green-50 border-green-200' :
                  leito.status === 'ocupado' ? 'bg-red-50 border-red-200' :
                  leito.status === 'reservado' ? 'bg-orange-50 border-orange-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="font-medium">{leito.codigo}</div>
                  <div className="text-xs text-muted-foreground capitalize">{leito.status}</div>
                  {leito.ehPCP && <div className="text-xs text-blue-600">PCP</div>}
                  {leito.tipo === 'isolamento' && <div className="text-xs text-red-600">Isolamento</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FormularioLeitosLote;
