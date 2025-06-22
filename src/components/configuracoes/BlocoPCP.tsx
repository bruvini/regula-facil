
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';
import { useConfiguracaoPCP } from '@/hooks/useConfiguracaoPCP';
import { ConfiguracaoPCP } from '@/types/pcp';

const BlocoPCP = () => {
  const { configuracoes, loading, adicionarConfiguracao, editarConfiguracao, excluirConfiguracao } = useConfiguracaoPCP();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [formData, setFormData] = useState({
    nomeNivelPCP: '',
    qtdMinimaPCP: 0,
    qtdMaximaPCP: 0,
    corNivelPCP: '#ffffff',
    orientacoesNivelPCP: [''],
    ordem: 0
  });

  const iniciarEdicao = (config: ConfiguracaoPCP) => {
    setEditandoId(config.id);
    setFormData({
      nomeNivelPCP: config.nomeNivelPCP,
      qtdMinimaPCP: config.qtdMinimaPCP,
      qtdMaximaPCP: config.qtdMaximaPCP,
      corNivelPCP: config.corNivelPCP,
      orientacoesNivelPCP: config.orientacoesNivelPCP,
      ordem: config.ordem
    });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setAdicionando(false);
    setFormData({
      nomeNivelPCP: '',
      qtdMinimaPCP: 0,
      qtdMaximaPCP: 0,
      corNivelPCP: '#ffffff',
      orientacoesNivelPCP: [''],
      ordem: configuracoes.length
    });
  };

  const salvarConfiguracao = async () => {
    const orientacoesFiltradas = formData.orientacoesNivelPCP.filter(o => o.trim() !== '');
    
    const configData = {
      ...formData,
      orientacoesNivelPCP: orientacoesFiltradas
    };

    if (editandoId) {
      await editarConfiguracao(editandoId, configData);
    } else {
      await adicionarConfiguracao(configData);
    }
    
    cancelarEdicao();
  };

  const adicionarOrientacao = () => {
    setFormData({
      ...formData,
      orientacoesNivelPCP: [...formData.orientacoesNivelPCP, '']
    });
  };

  const removerOrientacao = (index: number) => {
    const novasOrientacoes = formData.orientacoesNivelPCP.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      orientacoesNivelPCP: novasOrientacoes
    });
  };

  const atualizarOrientacao = (index: number, valor: string) => {
    const novasOrientacoes = [...formData.orientacoesNivelPCP];
    novasOrientacoes[index] = valor;
    setFormData({
      ...formData,
      orientacoesNivelPCP: novasOrientacoes
    });
  };

  if (loading) {
    return <div>Carregando configurações PCP...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Configuração PCP (Plano de Capacidade Plena)
          <Button onClick={() => setAdicionando(true)} disabled={adicionando || editandoId}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Nível
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário para adicionar/editar */}
        {(adicionando || editandoId) && (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Nível</Label>
                  <Input
                    id="nome"
                    value={formData.nomeNivelPCP}
                    onChange={(e) => setFormData({ ...formData, nomeNivelPCP: e.target.value })}
                    placeholder="Ex: PCP Nível 1"
                  />
                </div>
                <div>
                  <Label htmlFor="cor">Cor do Nível</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="cor"
                      type="color"
                      value={formData.corNivelPCP}
                      onChange={(e) => setFormData({ ...formData, corNivelPCP: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.corNivelPCP}
                      onChange={(e) => setFormData({ ...formData, corNivelPCP: e.target.value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="minima">Quantidade Mínima</Label>
                  <Input
                    id="minima"
                    type="number"
                    value={formData.qtdMinimaPCP}
                    onChange={(e) => setFormData({ ...formData, qtdMinimaPCP: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxima">Quantidade Máxima</Label>
                  <Input
                    id="maxima"
                    type="number"
                    value={formData.qtdMaximaPCP}
                    onChange={(e) => setFormData({ ...formData, qtdMaximaPCP: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Orientações (uma por linha)</Label>
                {formData.orientacoesNivelPCP.map((orientacao, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <Textarea
                      value={orientacao}
                      onChange={(e) => atualizarOrientacao(index, e.target.value)}
                      placeholder="Digite uma orientação..."
                      className="min-h-[60px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removerOrientacao(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarOrientacao}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Orientação
                </Button>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={cancelarEdicao}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={salvarConfiguracao}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de configurações existentes */}
        <div className="space-y-3">
          {configuracoes.map((config) => (
            <Card key={config.id} className="border-l-4" style={{ borderLeftColor: config.corNivelPCP }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Badge style={{ backgroundColor: config.corNivelPCP, color: '#fff' }}>
                        {config.nomeNivelPCP}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {config.qtdMinimaPCP} - {config.qtdMaximaPCP} pacientes
                      </span>
                    </div>
                    {config.orientacoesNivelPCP.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {config.orientacoesNivelPCP.slice(0, 2).map((orientacao, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            • {orientacao}
                          </p>
                        ))}
                        {config.orientacoesNivelPCP.length > 2 && (
                          <p className="text-sm text-muted-foreground">
                            ... e mais {config.orientacoesNivelPCP.length - 2} orientações
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => iniciarEdicao(config)}
                      disabled={adicionando || editandoId}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => excluirConfiguracao(config.id)}
                      disabled={adicionando || editandoId}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {configuracoes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma configuração PCP cadastrada.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BlocoPCP;
