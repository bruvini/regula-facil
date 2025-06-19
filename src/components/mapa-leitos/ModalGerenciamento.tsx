
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Setor, LeitoWithData } from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';

interface ModalGerenciamentoProps {
  aberto: boolean;
  onFechar: () => void;
  setores: Setor[];
  leitos: LeitoWithData[];
  onAdicionarSetor: (setor: Omit<Setor, 'id'>) => Promise<void>;
  onAdicionarLeito: (leito: any) => Promise<void>;
}

const ModalGerenciamento = ({ 
  aberto, 
  onFechar, 
  setores, 
  leitos, 
  onAdicionarSetor, 
  onAdicionarLeito 
}: ModalGerenciamentoProps) => {
  const { toast } = useToast();
  const [novoSetor, setNovoSetor] = useState({
    nomeCompleto: '',
    sigla: '',
    andar: '',
    tipo: 'clínico' as 'crítico' | 'clínico' | 'cirúrgico'
  });

  const [novoLeito, setNovoLeito] = useState({
    codigo: '',
    setor: '',
    tipo: 'clínico' as 'clínico' | 'crítico' | 'isolamento',
    ehPCP: false,
    alertas: [] as string[],
    status: 'vago' as const
  });

  const [filtroSetorLeitos, setFiltroSetorLeitos] = useState('todos');

  const handleAdicionarSetor = async () => {
    if (!novoSetor.nomeCompleto || !novoSetor.sigla) {
      toast({
        title: "Erro",
        description: "Nome completo e sigla são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      await onAdicionarSetor(novoSetor);
      setNovoSetor({
        nomeCompleto: '',
        sigla: '',
        andar: '',
        tipo: 'clínico'
      });
      toast({
        title: "Sucesso",
        description: "Setor adicionado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar setor.",
        variant: "destructive"
      });
    }
  };

  const handleAdicionarLeito = async () => {
    if (!novoLeito.codigo || !novoLeito.setor) {
      toast({
        title: "Erro",
        description: "Código e setor são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const setorRef = { path: `setoresRegulaFacil/${novoLeito.setor}` };
      await onAdicionarLeito({
        ...novoLeito,
        setor: setorRef
      });
      setNovoLeito({
        codigo: '',
        setor: '',
        tipo: 'clínico',
        ehPCP: false,
        alertas: [],
        status: 'vago'
      });
      toast({
        title: "Sucesso",
        description: "Leito adicionado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar leito.",
        variant: "destructive"
      });
    }
  };

  const leitosFiltrados = filtroSetorLeitos === 'todos' 
    ? leitos 
    : leitos.filter(l => l.setorData?.id === filtroSetorLeitos);

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Setores e Leitos</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="setores" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setores">Setores</TabsTrigger>
            <TabsTrigger value="leitos">Leitos</TabsTrigger>
          </TabsList>

          <TabsContent value="setores" className="space-y-4">
            {/* Formulário de novo setor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Novo Setor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeCompleto">Nome Completo</Label>
                    <Input
                      id="nomeCompleto"
                      value={novoSetor.nomeCompleto}
                      onChange={(e) => setNovoSetor({...novoSetor, nomeCompleto: e.target.value})}
                      placeholder="Ex: Unidade de Terapia Intensiva 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sigla">Sigla</Label>
                    <Input
                      id="sigla"
                      value={novoSetor.sigla}
                      onChange={(e) => setNovoSetor({...novoSetor, sigla: e.target.value})}
                      placeholder="Ex: UTI1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="andar">Andar</Label>
                    <Input
                      id="andar"
                      value={novoSetor.andar}
                      onChange={(e) => setNovoSetor({...novoSetor, andar: e.target.value})}
                      placeholder="Ex: 2º"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={novoSetor.tipo} onValueChange={(value: any) => setNovoSetor({...novoSetor, tipo: value})}>
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
                <Button onClick={handleAdicionarSetor} className="w-full">
                  Adicionar Setor
                </Button>
              </CardContent>
            </Card>

            {/* Lista de setores existentes */}
            <Card>
              <CardHeader>
                <CardTitle>Setores Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {setores.map((setor) => (
                    <div key={setor.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{setor.sigla} - {setor.nomeCompleto}</p>
                        <p className="text-sm text-muted-foreground">
                          {setor.andar} | {setor.tipo}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leitos" className="space-y-4">
            {/* Formulário de novo leito */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Novo Leito
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      value={novoLeito.codigo}
                      onChange={(e) => setNovoLeito({...novoLeito, codigo: e.target.value})}
                      placeholder="Ex: 03 ou UTI1-03"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setorLeito">Setor</Label>
                    <Select value={novoLeito.setor} onValueChange={(value) => setNovoLeito({...novoLeito, setor: value})}>
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
                    <Select value={novoLeito.tipo} onValueChange={(value: any) => setNovoLeito({...novoLeito, tipo: value})}>
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
                  <div className="space-y-2 flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="ehPCP"
                      checked={novoLeito.ehPCP}
                      onCheckedChange={(checked) => setNovoLeito({...novoLeito, ehPCP: checked as boolean})}
                    />
                    <Label htmlFor="ehPCP">É PCP</Label>
                  </div>
                </div>
                <Button onClick={handleAdicionarLeito} className="w-full">
                  Adicionar Leito
                </Button>
              </CardContent>
            </Card>

            {/* Filtro e lista de leitos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Leitos Cadastrados
                  <Select value={filtroSetorLeitos} onValueChange={setFiltroSetorLeitos}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os setores</SelectItem>
                      {setores.map((setor) => (
                        <SelectItem key={setor.id} value={setor.id}>
                          {setor.sigla}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leitosFiltrados.map((leito) => (
                    <div key={leito.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{leito.codigo}</p>
                        <p className="text-sm text-muted-foreground">
                          {leito.setorData?.sigla} | {leito.tipo} | 
                          <Badge variant="outline" className="ml-2">{leito.status}</Badge>
                          {leito.ehPCP && <Badge variant="secondary" className="ml-1">PCP</Badge>}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ModalGerenciamento;
