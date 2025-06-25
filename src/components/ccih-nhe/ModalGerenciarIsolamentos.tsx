
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface Isolamento {
  id: string;
  nomeIsolamento: string;
  descricaoIsolamento?: string;
}

interface ModalGerenciarIsolamentosProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModalGerenciarIsolamentos = ({ open, onOpenChange }: ModalGerenciarIsolamentosProps) => {
  const [isolamentos, setIsolamentos] = useState<Isolamento[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [nomeIsolamento, setNomeIsolamento] = useState("");
  const [descricaoIsolamento, setDescricaoIsolamento] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carregar isolamentos em tempo real
  useEffect(() => {
    if (!open) return;

    const unsubscribe = onSnapshot(
      collection(db, 'isolamentosRegulaFacil'),
      (snapshot) => {
        const isolamentosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Isolamento[];
        setIsolamentos(isolamentosData);
      },
      (error) => {
        console.error('Erro ao carregar isolamentos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar isolamentos",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [open, toast]);

  const limparFormulario = () => {
    setNomeIsolamento("");
    setDescricaoIsolamento("");
    setEditando(null);
    setMostrarFormulario(false);
  };

  const salvarIsolamento = async () => {
    if (!nomeIsolamento.trim()) {
      toast({
        title: "Erro",
        description: "Nome do isolamento é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dados = {
        nomeIsolamento: nomeIsolamento.trim(),
        descricaoIsolamento: descricaoIsolamento.trim() || ""
      };

      if (editando) {
        // Atualizar isolamento existente
        await updateDoc(doc(db, 'isolamentosRegulaFacil', editando), dados);
        toast({
          title: "Sucesso",
          description: "Isolamento atualizado com sucesso",
        });
      } else {
        // Criar novo isolamento
        await addDoc(collection(db, 'isolamentosRegulaFacil'), {
          ...dados,
          dataCriacao: Timestamp.now()
        });
        toast({
          title: "Sucesso",
          description: "Isolamento cadastrado com sucesso",
        });
      }

      limparFormulario();
    } catch (error) {
      console.error('Erro ao salvar isolamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar isolamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const editarIsolamento = (isolamento: Isolamento) => {
    setNomeIsolamento(isolamento.nomeIsolamento);
    setDescricaoIsolamento(isolamento.descricaoIsolamento || "");
    setEditando(isolamento.id);
    setMostrarFormulario(true);
  };

  const excluirIsolamento = async (id: string, nome: string) => {
    try {
      await deleteDoc(doc(db, 'isolamentosRegulaFacil', id));
      toast({
        title: "Sucesso",
        description: `Isolamento "${nome}" excluído com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao excluir isolamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir isolamento",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Gerenciar Isolamentos
          </DialogTitle>
          <DialogDescription>
            Cadastre, edite e gerencie os tipos de isolamento do hospital
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Botão para mostrar formulário */}
          {!mostrarFormulario && (
            <Button onClick={() => setMostrarFormulario(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar novo isolamento
            </Button>
          )}

          {/* Formulário */}
          {mostrarFormulario && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editando ? "Editar Isolamento" : "Novo Isolamento"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Isolamento *</label>
                  <Input
                    placeholder="Ex: Contato, Gotícula, Aerossol..."
                    value={nomeIsolamento}
                    onChange={(e) => setNomeIsolamento(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    placeholder="Descrição opcional do tipo de isolamento..."
                    value={descricaoIsolamento}
                    onChange={(e) => setDescricaoIsolamento(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={salvarIsolamento} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button variant="outline" onClick={limparFormulario}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de isolamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Isolamentos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {isolamentos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p>Nenhum isolamento cadastrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {isolamentos.map((isolamento) => (
                    <div key={isolamento.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{isolamento.nomeIsolamento}</Badge>
                        </div>
                        {isolamento.descricaoIsolamento && (
                          <p className="text-sm text-muted-foreground">
                            {isolamento.descricaoIsolamento}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editarIsolamento(isolamento)}
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
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o isolamento "{isolamento.nomeIsolamento}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => excluirIsolamento(isolamento.id, isolamento.nomeIsolamento)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalGerenciarIsolamentos;
