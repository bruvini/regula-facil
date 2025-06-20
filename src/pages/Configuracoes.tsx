
import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, addDoc, Timestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, UserPlus, Users, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

interface Usuario {
  id: string;
  nomeUsuario: string;
  matriculaUsuario: string;
  emailUsuario: string;
  setoresUsuario: string[];
  tipoPrevilegioUsuario: 'administrador' | 'comum';
  paginasLiberadas: string[];
  dataCadastroUsuario: Timestamp;
}

interface FormUsuario {
  nomeUsuario: string;
  matriculaUsuario: string;
  emailUsuario: string;
  setoresUsuario: string[];
  tipoPrevilegioUsuario: 'administrador' | 'comum';
  paginasLiberadas: string[];
}

const setoresDisponiveis = [
  "NIR",
  "Marcação Cirúrgica", 
  "Internação",
  "CCIH"
];

const paginasDisponiveis = [
  "Início",
  "Regulação de Leitos",
  "Mapa de Leitos", 
  "CCIH/NHE",
  "Marcação Cirúrgica",
  "Huddle",
  "Indicadores",
  "Auditoria",
  "Configurações"
];

const Configuracoes = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormUsuario>({
    defaultValues: {
      setoresUsuario: [],
      paginasLiberadas: [],
      tipoPrevilegioUsuario: 'comum'
    }
  });

  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    reset: editReset,
    watch: editWatch,
    setValue: editSetValue,
    formState: { errors: editErrors, isSubmitting: editIsSubmitting }
  } = useForm<FormUsuario>();

  const watchTipoPrivilegio = watch("tipoPrevilegioUsuario");
  const watchEditTipoPrivilegio = editWatch("tipoPrevilegioUsuario");

  // Carregar usuários do Firestore
  const carregarUsuarios = async () => {
    try {
      setIsLoading(true);
      const usuariosQuery = query(
        collection(db, "usuariosRegulaFacil"),
        orderBy("dataCadastroUsuario", "desc")
      );
      
      const querySnapshot = await getDocs(usuariosQuery);
      const usuariosData: Usuario[] = [];
      
      querySnapshot.forEach((doc) => {
        usuariosData.push({
          id: doc.id,
          ...doc.data()
        } as Usuario);
      });
      
      setUsuarios(usuariosData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar se nome de usuário e matrícula são únicos
  const verificarUnicidade = async (nomeUsuario: string, matriculaUsuario: string, usuarioId?: string) => {
    const nomeExistente = usuarios.find(u => 
      u.nomeUsuario === nomeUsuario.toUpperCase() && u.id !== usuarioId
    );
    const matriculaExistente = usuarios.find(u => 
      u.matriculaUsuario === matriculaUsuario && u.id !== usuarioId  
    );

    if (nomeExistente) {
      throw new Error("Nome de usuário já existe no sistema");
    }
    if (matriculaExistente) {
      throw new Error("Matrícula já existe no sistema");
    }
  };

  // Cadastrar novo usuário
  const onSubmit = async (data: FormUsuario) => {
    try {
      // Verificar unicidade
      await verificarUnicidade(data.nomeUsuario, data.matriculaUsuario);

      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.emailUsuario,
        "hmsj@123"
      );

      const novoUsuario = {
        nomeUsuario: data.nomeUsuario.toUpperCase(),
        matriculaUsuario: data.matriculaUsuario,
        emailUsuario: data.emailUsuario,
        setoresUsuario: data.setoresUsuario,
        tipoPrevilegioUsuario: data.tipoPrevilegioUsuario,
        paginasLiberadas: data.tipoPrevilegioUsuario === 'administrador' ? paginasDisponiveis : data.paginasLiberadas,
        dataCadastroUsuario: Timestamp.now(),
        firebaseUid: userCredential.user.uid
      };

      await addDoc(collection(db, "usuariosRegulaFacil"), novoUsuario);

      // Gerar log da ação
      await addDoc(collection(db, "logsSistemaRegulaFacil"), {
        pagina: "Configurações",
        acao: "Cadastro de Usuário",
        alvo: data.nomeUsuario.toUpperCase(),
        usuario: "Sistema",
        timestamp: Timestamp.now(),
        descricao: `Novo usuário cadastrado: ${data.nomeUsuario.toUpperCase()} (${data.emailUsuario}) - Matrícula: ${data.matriculaUsuario}, Tipo: ${data.tipoPrevilegioUsuario}`
      });

      toast({
        title: "Usuário cadastrado",
        description: `${data.nomeUsuario.toUpperCase()} foi cadastrado com sucesso`,
      });

      reset();
      setDialogOpen(false);
      await carregarUsuarios();
    } catch (error: any) {
      console.error("Erro ao cadastrar usuário:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar usuário",
        variant: "destructive",
      });
    }
  };

  // Editar usuário
  const onEditSubmit = async (data: FormUsuario) => {
    if (!editingUser) return;

    try {
      await verificarUnicidade(data.nomeUsuario, data.matriculaUsuario, editingUser.id);

      const usuarioAtualizado = {
        nomeUsuario: data.nomeUsuario.toUpperCase(),
        matriculaUsuario: data.matriculaUsuario,
        emailUsuario: data.emailUsuario,
        setoresUsuario: data.setoresUsuario,
        tipoPrevilegioUsuario: data.tipoPrevilegioUsuario,
        paginasLiberadas: data.tipoPrevilegioUsuario === 'administrador' ? paginasDisponiveis : data.paginasLiberadas,
      };

      await updateDoc(doc(db, "usuariosRegulaFacil", editingUser.id), usuarioAtualizado);

      // Gerar log da ação
      await addDoc(collection(db, "logsSistemaRegulaFacil"), {
        pagina: "Configurações",
        acao: "Edição de Usuário",
        alvo: data.nomeUsuario.toUpperCase(),
        usuario: "Sistema",
        timestamp: Timestamp.now(),
        descricao: `Usuário editado: ${data.nomeUsuario.toUpperCase()} (${data.emailUsuario})`
      });

      toast({
        title: "Usuário atualizado",
        description: `${data.nomeUsuario.toUpperCase()} foi atualizado com sucesso`,
      });

      setEditDialogOpen(false);
      setEditingUser(null);
      await carregarUsuarios();
    } catch (error: any) {
      console.error("Erro ao editar usuário:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao editar usuário",
        variant: "destructive",
      });
    }
  };

  // Excluir usuário
  const excluirUsuario = async (usuario: Usuario) => {
    try {
      await deleteDoc(doc(db, "usuariosRegulaFacil", usuario.id));

      // Gerar log da ação
      await addDoc(collection(db, "logsSistemaRegulaFacil"), {
        pagina: "Configurações",
        acao: "Exclusão de Usuário",
        alvo: usuario.nomeUsuario,
        usuario: "Sistema",
        timestamp: Timestamp.now(),
        descricao: `Usuário excluído: ${usuario.nomeUsuario} (${usuario.emailUsuario})`
      });

      toast({
        title: "Usuário excluído",
        description: `${usuario.nomeUsuario} foi excluído com sucesso`,
      });

      await carregarUsuarios();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive",
      });
    }
  };

  // Abrir modal de visualização
  const visualizarUsuario = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setViewDialogOpen(true);
  };

  // Abrir modal de edição
  const editarUsuario = (usuario: Usuario) => {
    setEditingUser(usuario);
    editReset({
      nomeUsuario: usuario.nomeUsuario,
      matriculaUsuario: usuario.matriculaUsuario,
      emailUsuario: usuario.emailUsuario,
      setoresUsuario: usuario.setoresUsuario,
      tipoPrevilegioUsuario: usuario.tipoPrevilegioUsuario,
      paginasLiberadas: usuario.paginasLiberadas
    });
    setEditDialogOpen(true);
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const formatarData = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString("pt-BR");
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Título da página */}
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>

        {/* Bloco de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciamento de Usuários
            </CardTitle>
            <CardDescription>
              Gerencie os usuários que têm acesso ao sistema RegulaFácil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Botão de cadastrar usuário */}
            <div className="flex justify-end">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do novo usuário do sistema
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nomeUsuario">Nome do Usuário *</Label>
                        <Input
                          id="nomeUsuario"
                          {...register("nomeUsuario", { required: "Nome é obrigatório" })}
                          placeholder="Digite o nome do usuário"
                        />
                        {errors.nomeUsuario && (
                          <p className="text-sm text-destructive">{errors.nomeUsuario.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="matriculaUsuario">Matrícula *</Label>
                        <Input
                          id="matriculaUsuario"
                          {...register("matriculaUsuario", { required: "Matrícula é obrigatória" })}
                          placeholder="Digite a matrícula"
                        />
                        {errors.matriculaUsuario && (
                          <p className="text-sm text-destructive">{errors.matriculaUsuario.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emailUsuario">E-mail *</Label>
                        <Input
                          id="emailUsuario"
                          type="email"
                          {...register("emailUsuario", { 
                            required: "E-mail é obrigatório",
                            pattern: {
                              value: /^[^\s@]+@joinville\.sc\.gov\.br$/,
                              message: "E-mail deve ser do domínio @joinville.sc.gov.br"
                            }
                          })}
                          placeholder="usuario@joinville.sc.gov.br"
                        />
                        {errors.emailUsuario && (
                          <p className="text-sm text-destructive">{errors.emailUsuario.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Setores *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {setoresDisponiveis.map((setor) => (
                            <div key={setor} className="flex items-center space-x-2">
                              <Checkbox
                                id={`setor-${setor}`}
                                {...register("setoresUsuario", { required: "Selecione pelo menos um setor" })}
                                value={setor}
                              />
                              <Label htmlFor={`setor-${setor}`} className="text-sm">
                                {setor}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {errors.setoresUsuario && (
                          <p className="text-sm text-destructive">{errors.setoresUsuario.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tipoPrevilegioUsuario">Tipo de Privilégio *</Label>
                        <Select onValueChange={(value) => setValue("tipoPrevilegioUsuario", value as 'administrador' | 'comum')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de privilégio" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="administrador">Administrador</SelectItem>
                            <SelectItem value="comum">Comum</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.tipoPrevilegioUsuario && (
                          <p className="text-sm text-destructive">{errors.tipoPrevilegioUsuario.message}</p>
                        )}
                      </div>

                      {watchTipoPrivilegio === 'comum' && (
                        <div className="space-y-2">
                          <Label>Páginas Liberadas *</Label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {paginasDisponiveis.map((pagina) => (
                              <div key={pagina} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`pagina-${pagina}`}
                                  {...register("paginasLiberadas", { 
                                    required: watchTipoPrivilegio === 'comum' ? "Selecione pelo menos uma página" : false 
                                  })}
                                  value={pagina}
                                />
                                <Label htmlFor={`pagina-${pagina}`} className="text-sm">
                                  {pagina}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {errors.paginasLiberadas && (
                            <p className="text-sm text-destructive">{errors.paginasLiberadas.message}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Cadastrando..." : "Cadastrar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Tabela de usuários */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo de Privilégio</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Carregando usuários...
                      </TableCell>
                    </TableRow>
                  ) : usuarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nomeUsuario}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            usuario.tipoPrevilegioUsuario === "administrador" 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {usuario.tipoPrevilegioUsuario === "administrador" ? "Administrador" : "Comum"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => visualizarUsuario(usuario)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editarUsuario(usuario)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o usuário {usuario.nomeUsuario}? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => excluirUsuario(usuario)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Visualização */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Informações do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Nome:</Label>
                  <p className="text-sm">{selectedUser.nomeUsuario}</p>
                </div>
                <div>
                  <Label className="font-medium">Matrícula:</Label>
                  <p className="text-sm">{selectedUser.matriculaUsuario}</p>
                </div>
                <div>
                  <Label className="font-medium">E-mail:</Label>
                  <p className="text-sm">{selectedUser.emailUsuario}</p>
                </div>
                <div>
                  <Label className="font-medium">Setores:</Label>
                  <p className="text-sm">{selectedUser.setoresUsuario.join(", ")}</p>
                </div>
                <div>
                  <Label className="font-medium">Tipo de Privilégio:</Label>
                  <p className="text-sm">{selectedUser.tipoPrevilegioUsuario === "administrador" ? "Administrador" : "Comum"}</p>
                </div>
                <div>
                  <Label className="font-medium">Páginas Liberadas:</Label>
                  <p className="text-sm">{selectedUser.paginasLiberadas.join(", ")}</p>
                </div>
                <div>
                  <Label className="font-medium">Data de Cadastro:</Label>
                  <p className="text-sm">{formatarData(selectedUser.dataCadastroUsuario)}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={editHandleSubmit(onEditSubmit)} className="space-y-4">
                {/* ... formulário de edição similar ao de cadastro ... */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nomeUsuario">Nome do Usuário *</Label>
                    <Input
                      id="edit-nomeUsuario"
                      {...editRegister("nomeUsuario", { required: "Nome é obrigatório" })}
                      placeholder="Digite o nome do usuário"
                    />
                    {editErrors.nomeUsuario && (
                      <p className="text-sm text-destructive">{editErrors.nomeUsuario.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-matriculaUsuario">Matrícula *</Label>
                    <Input
                      id="edit-matriculaUsuario"
                      {...editRegister("matriculaUsuario", { required: "Matrícula é obrigatória" })}
                      placeholder="Digite a matrícula"
                    />
                    {editErrors.matriculaUsuario && (
                      <p className="text-sm text-destructive">{editErrors.matriculaUsuario.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-emailUsuario">E-mail *</Label>
                    <Input
                      id="edit-emailUsuario"
                      type="email"
                      {...editRegister("emailUsuario", { 
                        required: "E-mail é obrigatório",
                        pattern: {
                          value: /^[^\s@]+@joinville\.sc\.gov\.br$/,
                          message: "E-mail deve ser do domínio @joinville.sc.gov.br"
                        }
                      })}
                      placeholder="usuario@joinville.sc.gov.br"
                    />
                    {editErrors.emailUsuario && (
                      <p className="text-sm text-destructive">{editErrors.emailUsuario.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Setores *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {setoresDisponiveis.map((setor) => (
                        <div key={setor} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-setor-${setor}`}
                            {...editRegister("setoresUsuario", { required: "Selecione pelo menos um setor" })}
                            value={setor}
                            defaultChecked={editingUser.setoresUsuario.includes(setor)}
                          />
                          <Label htmlFor={`edit-setor-${setor}`} className="text-sm">
                            {setor}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {editErrors.setoresUsuario && (
                      <p className="text-sm text-destructive">{editErrors.setoresUsuario.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-tipoPrevilegioUsuario">Tipo de Privilégio *</Label>
                    <Select 
                      defaultValue={editingUser.tipoPrevilegioUsuario}
                      onValueChange={(value) => editSetValue("tipoPrevilegioUsuario", value as 'administrador' | 'comum')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de privilégio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrador">Administrador</SelectItem>
                        <SelectItem value="comum">Comum</SelectItem>
                      </SelectContent>
                    </Select>
                    {editErrors.tipoPrevilegioUsuario && (
                      <p className="text-sm text-destructive">{editErrors.tipoPrevilegioUsuario.message}</p>
                    )}
                  </div>

                  {watchEditTipoPrivilegio === 'comum' && (
                    <div className="space-y-2">
                      <Label>Páginas Liberadas *</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {paginasDisponiveis.map((pagina) => (
                          <div key={pagina} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-pagina-${pagina}`}
                              {...editRegister("paginasLiberadas", { 
                                required: watchEditTipoPrivilegio === 'comum' ? "Selecione pelo menos uma página" : false 
                              })}
                              value={pagina}
                              defaultChecked={editingUser.paginasLiberadas.includes(pagina)}
                            />
                            <Label htmlFor={`edit-pagina-${pagina}`} className="text-sm">
                              {pagina}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {editErrors.paginasLiberadas && (
                        <p className="text-sm text-destructive">{editErrors.paginasLiberadas.message}</p>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={editIsSubmitting}>
                    {editIsSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Configuracoes;
