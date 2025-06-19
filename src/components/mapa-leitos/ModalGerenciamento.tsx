
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { Setor, LeitoWithData, Leito } from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';
import FormularioSetor from './FormularioSetor';
import FormularioLeitosLote from './FormularioLeitosLote';

interface ModalGerenciamentoProps {
  aberto: boolean;
  onFechar: () => void;
  setores: Setor[];
  leitos: LeitoWithData[];
  onAdicionarSetor: (setor: Omit<Setor, 'id'>) => Promise<void>;
  onEditarSetor: (setorId: string, setor: Partial<Setor>) => Promise<void>;
  onAdicionarLeitosLote: (leitos: Array<Omit<Leito, 'id' | 'dataUltimaAtualizacaoStatus'>>) => Promise<void>;
}

const ModalGerenciamento = ({ 
  aberto, 
  onFechar, 
  setores, 
  leitos, 
  onAdicionarSetor,
  onEditarSetor,
  onAdicionarLeitosLote
}: ModalGerenciamentoProps) => {
  const { toast } = useToast();
  const [setorEditando, setSetorEditando] = useState<Setor | undefined>();
  const [filtroSetorLeitos, setFiltroSetorLeitos] = useState('todos');

  const handleSalvarSetor = async (setorData: Omit<Setor, 'id'>) => {
    try {
      if (setorEditando) {
        await onEditarSetor(setorEditando.id, setorData);
        setSetorEditando(undefined);
        toast({
          title: "Sucesso",
          description: "Setor editado com sucesso!"
        });
      } else {
        await onAdicionarSetor(setorData);
        toast({
          title: "Sucesso",
          description: "Setor adicionado com sucesso!"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: setorEditando ? "Erro ao editar setor." : "Erro ao adicionar setor.",
        variant: "destructive"
      });
    }
  };

  const handleSalvarLeitosLote = async (leitosData: Array<Omit<Leito, 'id' | 'dataUltimaAtualizacaoStatus'>>) => {
    try {
      await onAdicionarLeitosLote(leitosData);
      toast({
        title: "Sucesso",
        description: `${leitosData.length} leitos adicionados com sucesso!`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar leitos em lote.",
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
            <FormularioSetor 
              setorEditando={setorEditando}
              onSalvar={handleSalvarSetor}
            />

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
                          {setor.ehPCP && <Badge variant="secondary" className="ml-2">PCP</Badge>}
                        </p>
                        {setor.alertas && setor.alertas.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Alertas: {setor.alertas.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSetorEditando(setor)}>
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
            <FormularioLeitosLote 
              setores={setores}
              onSalvar={handleSalvarLeitosLote}
            />

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
                        {leito.alertas && leito.alertas.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Alertas: {leito.alertas.join(', ')}
                          </p>
                        )}
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
