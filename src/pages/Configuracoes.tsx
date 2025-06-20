
import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  telefone: string;
  status: string;
  dataCadastro: Timestamp;
}

interface FormUsuario {
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  telefone: string;
}

const Configuracoes = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormUsuario>();

  // Carregar usuários do Firestore
  const carregarUsuarios = async () => {
    try {
      setIsLoading(true);
      const usuariosQuery = query(
        collection(db, "usuariosRegulaFacil"),
        orderBy("dataCadastro", "desc")
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

  // Cadastrar novo usuário
  const onSubmit = async (data: FormUsuario) => {
    try {
      const novoUsuario = {
        ...data,
        status: "ATIVO",
        dataCadastro: Timestamp.now()
      };

      await addDoc(collection(db, "usuariosRegulaFacil"), novoUsuario);

      // Gerar log da ação
      await addDoc(collection(db, "logsSistemaRegulaFacil"), {
        pagina: "Configurações",
        acao: "Cadastro de Usuário",
        alvo: data.nome,
        usuario: "Sistema", // Pode ser alterado quando houver autenticação
        timestamp: Timestamp.now(),
        descricao: `Novo usuário cadastrado: ${data.nome} (${data.email}) - Cargo: ${data.cargo}, Setor: ${data.setor}`
      });

      toast({
        title: "Usuário cadastrado",
        description: `${data.nome} foi cadastrado com sucesso`,
      });

      reset();
      setDialogOpen(false);
      await carregarUsuarios();
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar usuário",
        variant: "destructive",
      });
    }
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
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do novo usuário do sistema
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome Completo *</Label>
                        <Input
                          id="nome"
                          {...register("nome", { required: "Nome é obrigatório" })}
                          placeholder="Digite o nome completo"
                        />
                        {errors.nome && (
                          <p className="text-sm text-destructive">{errors.nome.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email", { 
                            required: "E-mail é obrigatório",
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: "E-mail inválido"
                            }
                          })}
                          placeholder="Digite o e-mail"
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cargo">Cargo *</Label>
                        <Input
                          id="cargo"
                          {...register("cargo", { required: "Cargo é obrigatório" })}
                          placeholder="Ex: Enfermeiro, Médico, Técnico"
                        />
                        {errors.cargo && (
                          <p className="text-sm text-destructive">{errors.cargo.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="setor">Setor *</Label>
                        <Input
                          id="setor"
                          {...register("setor", { required: "Setor é obrigatório" })}
                          placeholder="Ex: NIR, UTI, Enfermaria"
                        />
                        {errors.setor && (
                          <p className="text-sm text-destructive">{errors.setor.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          {...register("telefone")}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
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
                    <TableHead>E-mail</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando usuários...
                      </TableCell>
                    </TableRow>
                  ) : usuarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nome}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>{usuario.cargo}</TableCell>
                        <TableCell>{usuario.setor}</TableCell>
                        <TableCell>{usuario.telefone || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            usuario.status === "ATIVO" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {usuario.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatarData(usuario.dataCadastro)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Configuracoes;
