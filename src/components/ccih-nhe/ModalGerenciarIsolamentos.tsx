
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, ListChecks } from "lucide-react";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface RegraLiberacao {
  textoRegra: string;
  operadorLogico: 'E' | 'OU' | null;
}

interface Isolamento {
  id: string;
  nomeIsolamento: string;
  descricaoIsolamento?: string;
  regrasLiberacaoIsolamento?: RegraLiberacao[];
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
  const [regrasLiberacao, setRegrasLiberacao] = useState<RegraLiberacao[]>([]);
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
    setRegrasLiberacao([]);
    setEditando(null);
    setMostrarFormulario(false);
  };

  const adicionarRegra = () => {
    setRegrasLiberacao(prev => [...prev, { textoRegra: "", operadorLogico: null }]);
  };

  const atualizarRegra = (index: number, campo: 'textoRegra' | 'operadorLogico', valor: string) => {
    setRegrasLiberacao(prev => prev.map((regra, i) => 
      i === index 
        ? { ...regra, [campo]: campo === 'operadorLogico' ? (valor as 'E' | 'OU' | null) : valor }
        : regra
    ));
  };

  const removerRegra = (index: number) => {
    setRegrasLiberacao(prev => prev.filter((_, i) => i !== index));
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

    // Validar regras
    const regrasValidas = regrasLiberacao.filter(regra => regra.textoRegra.trim() !== "");
    
    setLoading(true);
    try {
      const dados = {
        nomeIsolamento: nomeIsolamento.trim(),
        descricaoIsolamento: descricaoIsolamento.trim() || "",
        regrasLiberacaoIsolamento: regrasValidas
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
    setRegrasLiberacao(isolamento.regrasLiberacaoIsolamento || []);
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
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
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
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {/* Regras de Liberação */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5" />
                      <label className="text-sm font-medium">Regras de Liberação</label>
                    </div>
                    <Button variant="outline" size="sm" onClick={adicionarRegra}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Regra
                    </Button>
                  </div>

                  {regrasLiberacao.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                      <ListChecks className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p>Nenhuma regra cadastrada</p>
                      <p className="text-xs">Clique em "Adicionar Regra" para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {regrasLiberacao.map((regra, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">
                                Regra {index + 1}
                              </label>
                              <Textarea
                                placeholder="Ex: Paciente deve estar há 3 dias sem febre"
                                value={regra.textoRegra}
                                onChange={(e) => atualizarRegra(index, 'textoRegra', e.target.value)}
                                rows={2}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removerRegra(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {index < regrasLiberacao.length - 1 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Esta regra está conectada à próxima por:
                              </span>
                              <Select
                                value={regra.operadorLogico || ""}
                                onValueChange={(value) => atualizarRegra(index, 'operadorLogico', value)}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue placeholder="E/OU" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="E">E</SelectItem>
                                  <SelectItem value="OU">OU</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
                <div className="space-y-4">
                  {isolamentos.map((isolamento) => (
                    <div key={isolamento.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{isolamento.nomeIsolamento}</Badge>
                            {isolamento.regrasLiberacaoIsolamento && isolamento.regrasLiberacaoIsolamento.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {isolamento.regrasLiberacaoIsolamento.length} regra{isolamento.regrasLiberacaoIsolamento.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          {isolamento.descricaoIsolamento && (
                            <p className="text-sm text-muted-foreground mb-2">
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

                      {/* Mostrar regras de liberação */}
                      {isolamento.regrasLiberacaoIsolamento && isolamento.regrasLiberacaoIsolamento.length > 0 && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <ListChecks className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Regras de Liberação:</span>
                          </div>
                          <div className="space-y-1">
                            {isolamento.regrasLiberacaoIsolamento.map((regra, index) => (
                              <div key={index} className="text-sm">
                                <span className="text-muted-foreground">• </span>
                                {regra.textoRegra}
                                {index < isolamento.regrasLiberacaoIsolamento!.length - 1 && regra.operadorLogico && (
                                  <span className="ml-2 text-xs font-medium text-primary">
                                    ({regra.operadorLogico})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
