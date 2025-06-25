
import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, addDoc, Timestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { registrarLog } from "@/lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Usuario } from "@/types/firestore";
import FormularioCadastroUsuario from "./FormularioCadastroUsuario";
import FormularioEdicaoUsuario from "./FormularioEdicaoUsuario";
import TabelaUsuarios from "./TabelaUsuarios";

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

const BlocoUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  // Verificar se nome de usuário, matrícula e email são únicos
  const verificarUnicidade = async (nomeUsuario: string, matriculaUsuario: string, emailUsuario: string, usuarioId?: string) => {
    const nomeExistente = usuarios.find(u => 
      u.nomeUsuario === nomeUsuario.toUpperCase() && u.id !== usuarioId
    );
    const matriculaExistente = usuarios.find(u => 
      u.matriculaUsuario === matriculaUsuario && u.id !== usuarioId  
    );
    const emailExistente = usuarios.find(u => 
      u.emailUsuario === emailUsuario && u.id !== usuarioId
    );

    if (nomeExistente) {
      throw new Error("Nome de usuário já existe no sistema");
    }
    if (matriculaExistente) {
      throw new Error("Matrícula já existe no sistema");
    }
    if (emailExistente) {
      throw new Error("E-mail já existe no sistema");
    }
  };

  // Cadastrar novo usuário
  const onSubmit = async (data: FormUsuario) => {
    try {
      setIsSubmitting(true);
      
      // Verificar unicidade
      await verificarUnicidade(data.nomeUsuario, data.matriculaUsuario, data.emailUsuario);

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
        await registrarLog({
          pagina: "Configurações",
          acao: "Cadastro de Usuário",
          alvo: data.nomeUsuario.toUpperCase(),
          descricao: `Novo usuário cadastrado: ${data.nomeUsuario.toUpperCase()} (${data.emailUsuario}) - Matrícula: ${data.matriculaUsuario}, Tipo: ${data.tipoPrevilegioUsuario}`,
          usuario: "Sistema"
        });

      toast({
        title: "Usuário cadastrado",
        description: `${data.nomeUsuario.toUpperCase()} foi cadastrado com sucesso`,
      });

      setDialogOpen(false);
      await carregarUsuarios();
    } catch (error: any) {
      console.error("Erro ao cadastrar usuário:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar usuário",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editar usuário
  const onEditSubmit = async (data: FormUsuario) => {
    if (!editingUser) return;

    try {
      setIsSubmitting(true);
      await verificarUnicidade(data.nomeUsuario, data.matriculaUsuario, data.emailUsuario, editingUser.id);

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
        await registrarLog({
          pagina: "Configurações",
          acao: "Edição de Usuário",
          alvo: data.nomeUsuario.toUpperCase(),
          descricao: `Usuário editado: ${data.nomeUsuario.toUpperCase()} (${data.emailUsuario})`,
          usuario: "Sistema"
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir usuário
  const excluirUsuario = async (usuario: Usuario) => {
    try {
      await deleteDoc(doc(db, "usuariosRegulaFacil", usuario.id));

      // Gerar log da ação
        await registrarLog({
          pagina: "Configurações",
          acao: "Exclusão de Usuário",
          alvo: usuario.nomeUsuario,
          descricao: `Usuário excluído: ${usuario.nomeUsuario} (${usuario.emailUsuario})`,
          usuario: "Sistema"
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
    setEditDialogOpen(true);
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const formatarData = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString("pt-BR");
  };

  return (
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
              <FormularioCadastroUsuario
                onSubmit={onSubmit}
                onCancel={() => setDialogOpen(false)}
                setoresDisponiveis={setoresDisponiveis}
                paginasDisponiveis={paginasDisponiveis}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de usuários */}
        <TabelaUsuarios
          usuarios={usuarios}
          isLoading={isLoading}
          onView={visualizarUsuario}
          onEdit={editarUsuario}
          onDelete={excluirUsuario}
        />

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
            <div className="flex justify-end">
              <Button onClick={() => setViewDialogOpen(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <FormularioEdicaoUsuario
                usuario={editingUser}
                onSubmit={onEditSubmit}
                onCancel={() => setEditDialogOpen(false)}
                setoresDisponiveis={setoresDisponiveis}
                paginasDisponiveis={paginasDisponiveis}
                isSubmitting={isSubmitting}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BlocoUsuarios;
