import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  onExcluirSetor: (setorId: string) => Promise<void>;
  onAdicionarLeito: (leito: Omit<Leito, 'id' | 'dataUltimaAtualizacaoStatus'>) => Promise<void>;
  onEditarLeito: (leitoId: string, leito: Partial<Leito>) => Promise<void>;
  onExcluirLeito: (leitoId: string) => Promise<void>;
  onAdicionarLeitosLote: (leitos: Array<Omit<Leito, 'id' | 'dataUltimaAtualizacaoStatus'>>) => Promise<void>;
}

const ModalGerenciamento = ({ 
  aberto, 
  onFechar, 
  setores, 
  leitos, 
  onAdicionarSetor,
  onEditarSetor,
  onExcluirSetor,
  onAdicionarLeito,
  onEditarLeito,
  onExcluirLeito,
  onAdicionarLeitosLote
}: ModalGerenciamentoProps) => {
  const { toast } = useToast();
  const [setorEditando, setSetorEditando] = useState<Setor | undefined>();
  const [leitoEditando, setLeitoEditando] = useState<{ leito: LeitoWithData; index?: number } | undefined>();
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
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || (setorEditando ? "Erro ao editar setor." : "Erro ao adicionar setor."),
        variant: "destructive"
      });
    }
  };

  const handleExcluirSetor = async (setorId: string) => {
    try {
      await onExcluirSetor(setorId);
      toast({
        title: "Sucesso",
        description: "Setor excluído com sucesso!"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir setor.",
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

  const handleEditarLeito = async (leitoId: string, leitoData: Partial<Leito>) => {
    try {
      await onEditarLeito(leitoId, leitoData);
      setLeitoEditando(undefined);
      toast({
        title: "Sucesso",
        description: "Leito editado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao editar leito.",
        variant: "destructive"
      });
    }
  };

  const handleExcluirLeito = async (leitoId: string) => {
    try {
      await onExcluirLeito(leitoId);
      toast({
        title: "Sucesso",
        description: "Leito excluído com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir leito.",
        variant: "destructive"
      });
    }
  };

  const leitosFiltrados = filtroSetorLeitos === 'todos' 
    ? leitos 
    : leitos.filter(l => l.setorData?.id === filtroSetorLeitos);

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
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
                <CardTitle>Setores Cadastrados ({setores.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {setores.map((setor) => (
                    <div key={setor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{setor.sigla}</h3>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-sm">{setor.nomeCompleto}</span>
                        </div>
                        {setor.alertas && setor.alertas.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Alertas:</strong> {setor.alertas.join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSetorEditando(setor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Setor</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o setor "{setor.sigla}"? Esta ação não pode ser desfeita.
                                {leitos.some(l => l.setorData?.id === setor.id) && (
                                  <span className="block mt-2 text-destructive font-medium">
                                    ⚠️ Este setor possui leitos associados e não pode ser excluído.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleExcluirSetor(setor.id)}
                                disabled={leitos.some(l => l.setorData?.id === setor.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {setores.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum setor cadastrado ainda.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leitos" className="space-y-4">
            {/* Formulário condicionalmente renderizado */}
            {leitoEditando ? (
              <FormularioLeitosLote 
                setores={setores}
                onSalvar={handleSalvarLeitosLote}
                leitoEditando={leitoEditando}
                onEditarLeito={handleEditarLeito}
              />
            ) : (
              <FormularioLeitosLote 
                setores={setores}
                onSalvar={handleSalvarLeitosLote}
              />
            )}

            {leitoEditando && (
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setLeitoEditando(undefined)}
                >
                  Cancelar Edição
                </Button>
              </div>
            )}

            {/* Filtro e lista de leitos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Leitos Cadastrados ({leitosFiltrados.length})</span>
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
                <div className="space-y-3">
                  {leitosFiltrados.map((leito) => (
                    <div key={leito.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{leito.codigo}</h3>
                          <Badge variant="outline">{leito.status}</Badge>
                          <span className="text-muted-foreground">|</span>
                          <span className="text-sm">{leito.setorData?.sigla}</span>
                          <span className="text-muted-foreground">|</span>
                          <span className="text-sm">{leito.tipo}</span>
                          {leito.ehPCP && <Badge variant="secondary">PCP</Badge>}
                        </div>
                        {leito.alertas && leito.alertas.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Alertas:</strong> {leito.alertas.join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLeitoEditando({ leito })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Leito</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o leito "{leito.codigo}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleExcluirLeito(leito.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {leitosFiltrados.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {filtroSetorLeitos === 'todos' 
                        ? 'Nenhum leito cadastrado ainda.' 
                        : 'Nenhum leito encontrado para este setor.'
                      }
                    </div>
                  )}
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
