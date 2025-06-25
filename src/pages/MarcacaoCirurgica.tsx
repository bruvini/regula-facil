import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarIcon, Plus, Search, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ModalExcluirPedido from "@/components/regulacao-leitos/ModalExcluirPedido";

interface PedidoCirurgia {
  id: string;
  nomePaciente: string;
  dataNascimentoPaciente: Date;
  sexoPaciente: 'M' | 'F';
  dataPrevistaInternacao: Date;
  dataPrevistaCirurgia: Date;
  medicoSolicitante: string;
  procedimentoCirurgico: string;
  preparacaoProcedimento: string[];
  dataSolicitacao: Date;
  statusSolicitacao: 'PENDENTE_LEITO' | 'LEITO_RESERVADO';
  leitoReservado?: string;
}

const MarcacaoCirurgica = () => {
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState<Date>();
  const [filtroDataFim, setFiltroDataFim] = useState<Date>();
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [pedidosCirurgia, setPedidosCirurgia] = useState<PedidoCirurgia[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<PedidoCirurgia | null>(null);
  const { toast } = useToast();

  // Estados do formulário
  const [nomePaciente, setNomePaciente] = useState("");
  const [dataNascimentoPaciente, setDataNascimentoPaciente] = useState<Date>();
  const [sexoPaciente, setSexoPaciente] = useState<'M' | 'F'>('M');
  const [dataPrevistaInternacao, setDataPrevistaInternacao] = useState<Date>();
  const [dataPrevistaCirurgia, setDataPrevistaCirurgia] = useState<Date>();
  const [medicoSolicitante, setMedicoSolicitante] = useState("");
  const [procedimentoCirurgico, setProcedimentoCirurgico] = useState("");
  const [preparacaoProcedimento, setPreparacaoProcedimento] = useState("");

  useEffect(() => {
    carregarPedidosCirurgia();
  }, []);

  const carregarPedidosCirurgia = async () => {
    try {
      console.log('Carregando pedidos de cirurgia...');
      
      // Buscar todos os pedidos com status PENDENTE_LEITO ou LEITO_RESERVADO
      const q = query(
        collection(db, 'pedidosCirurgia'),
        where('statusSolicitacao', 'in', ['PENDENTE_LEITO', 'LEITO_RESERVADO']),
        orderBy('dataPrevistaCirurgia', 'asc')
      );

      const querySnapshot = await getDocs(q);
      console.log('Documentos encontrados:', querySnapshot.size);
      
      const pedidos = await Promise.all(querySnapshot.docs.map(async docRef => {
        const data = docRef.data();
        console.log('Dados do documento:', docRef.id, data);
        
        // Buscar código do leito se houver leitoReservado
        let leitoReservadoCodigo = null;
        if (data.leitoReservado) {
          try {
            const leitoDoc = await getDoc(doc(db, 'leitosRegulaFacil', data.leitoReservado));
            if (leitoDoc.exists()) {
              leitoReservadoCodigo = leitoDoc.data().codigo;
            }
          } catch (error) {
            console.error('Erro ao buscar código do leito:', error);
          }
        }
        
        return {
          id: docRef.id,
          ...data,
          dataNascimentoPaciente: data.dataNascimentoPaciente.toDate(),
          dataPrevistaInternacao: data.dataPrevistaInternacao.toDate(),
          dataPrevistaCirurgia: data.dataPrevistaCirurgia.toDate(),
          dataSolicitacao: data.dataSolicitacao.toDate(),
          leitoReservado: leitoReservadoCodigo, // Usar o código do leito
        };
      })) as PedidoCirurgia[];

      console.log('Pedidos processados:', pedidos);
      setPedidosCirurgia(pedidos);
    } catch (error) {
      console.error('Erro ao carregar pedidos de cirurgia:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos de cirurgia",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nomePaciente || !dataNascimentoPaciente || !dataPrevistaInternacao || 
        !dataPrevistaCirurgia || !medicoSolicitante || !procedimentoCirurgico) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const novoPedido = {
        nomePaciente,
        dataNascimentoPaciente: Timestamp.fromDate(dataNascimentoPaciente),
        sexoPaciente,
        dataPrevistaInternacao: Timestamp.fromDate(dataPrevistaInternacao),
        dataPrevistaCirurgia: Timestamp.fromDate(dataPrevistaCirurgia),
        medicoSolicitante,
        procedimentoCirurgico,
        preparacaoProcedimento: preparacaoProcedimento.split('\n').filter(item => item.trim()),
        dataSolicitacao: Timestamp.fromDate(new Date()),
        statusSolicitacao: 'PENDENTE_LEITO',
      };

      await addDoc(collection(db, 'pedidosCirurgia'), novoPedido);

      // Gerar log
      const logTexto = `${format(new Date(), 'dd/MM/yyyy HH:mm')} - Novo pedido de cirurgia para paciente ${nomePaciente}, internação prevista para ${format(dataPrevistaInternacao, 'dd/MM/yyyy')}, cirurgia prevista para ${format(dataPrevistaCirurgia, 'dd/MM/yyyy')}, solicitado pelo Dr(a). ${medicoSolicitante}`;
      
      await addDoc(collection(db, 'logsSistema'), {
        pagina: 'Marcação Cirúrgica',
        acao: 'Novo Pedido',
        alvo: nomePaciente,
        usuario: 'Sistema',
        timestamp: Timestamp.fromDate(new Date()),
        descricao: logTexto
      });

      toast({
        title: "Sucesso",
        description: "Pedido de cirurgia cadastrado com sucesso",
      });

      // Limpar formulário
      setNomePaciente("");
      setDataNascimentoPaciente(undefined);
      setSexoPaciente('M');
      setDataPrevistaInternacao(undefined);
      setDataPrevistaCirurgia(undefined);
      setMedicoSolicitante("");
      setProcedimentoCirurgico("");
      setPreparacaoProcedimento("");
      setIsDialogOpen(false);

      // Recarregar lista
      carregarPedidosCirurgia();
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar pedido de cirurgia",
        variant: "destructive",
      });
    }
  };

  const handleExcluirPedido = (pedido: PedidoCirurgia) => {
    setPedidoSelecionado(pedido);
    setModalExcluirAberto(true);
  };

  const handleSucessoExclusao = () => {
    carregarPedidosCirurgia();
    toast({
      title: "Sucesso",
      description: "Pedido excluído com sucesso",
    });
  };

  const pedidosFiltrados = pedidosCirurgia.filter(pedido => {
    const matchNome = !filtroNome || 
      pedido.nomePaciente.toLowerCase().includes(filtroNome.toLowerCase()) ||
      pedido.medicoSolicitante.toLowerCase().includes(filtroNome.toLowerCase());
    
    const matchStatus = filtroStatus === "todos" || pedido.statusSolicitacao === filtroStatus;
    
    let matchData = true;
    if (filtroDataInicio && filtroDataFim) {
      matchData = pedido.dataPrevistaCirurgia >= filtroDataInicio && 
                  pedido.dataPrevistaCirurgia <= filtroDataFim;
    }
    
    return matchNome && matchStatus && matchData;
  });

  return (
    <TooltipProvider>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Marcação Cirúrgica</h1>
          </div>

          {/* Bloco Explicativo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Sobre esta Funcionalidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>
                  Esta página auxilia na comunicação entre a equipe de <strong>Marcação Cirúrgica</strong>, <strong>NIR</strong> e <strong>Internação</strong> 
                  na garantia de leitos para cirurgias eletivas.
                </p>
                <p>
                  Os pacientes aparecerão para o regulador tentar reserva de leito <strong>24h antes da data prevista da internação</strong>. 
                  Quando conseguirem leito, farão a reserva e aparecerá na tabela para que a marcação e internação tenham visibilidade.
                </p>
                <p>
                  Este controle também ajuda a gerar indicadores sobre a <strong>demanda cirúrgica eletiva</strong> e o 
                  <strong> impacto na lotação do serviço</strong> e <strong>produtividade do NIR</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Indicadores - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Indicadores</CardTitle>
              <CardDescription>Métricas da marcação cirúrgica</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center py-8">
                Indicadores serão implementados em breve
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="filtro-nome">Paciente ou Médico</Label>
                  <Input
                    id="filtro-nome"
                    placeholder="Buscar por nome..."
                    value={filtroNome}
                    onChange={(e) => setFiltroNome(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filtroDataInicio ? format(filtroDataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <input
                        type="date"
                        className="p-2 border rounded"
                        onChange={(e) => setFiltroDataInicio(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>Data Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filtroDataFim ? format(filtroDataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <input
                        type="date"
                        className="p-2 border rounded"
                        onChange={(e) => setFiltroDataFim(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="filtro-status">Status</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="PENDENTE_LEITO">Pendente Leito</SelectItem>
                      <SelectItem value="LEITO_RESERVADO">Leito Reservado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pedidos de Cirurgia</h2>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Pedido
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Pedido de Cirurgia</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome do Paciente *</Label>
                      <Input
                        id="nome"
                        value={nomePaciente}
                        onChange={(e) => setNomePaciente(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Data de Nascimento *</Label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded"
                        onChange={(e) => setDataNascimentoPaciente(e.target.value ? new Date(e.target.value) : undefined)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="sexo">Sexo *</Label>
                      <Select value={sexoPaciente} onValueChange={(value: 'M' | 'F') => setSexoPaciente(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Data Prevista Internação *</Label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded"
                        onChange={(e) => setDataPrevistaInternacao(e.target.value ? new Date(e.target.value) : undefined)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Data Prevista Cirurgia *</Label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded"
                        onChange={(e) => setDataPrevistaCirurgia(e.target.value ? new Date(e.target.value) : undefined)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="medico">Médico Solicitante *</Label>
                      <Input
                        id="medico"
                        value={medicoSolicitante}
                        onChange={(e) => setMedicoSolicitante(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="procedimento">Procedimento Cirúrgico *</Label>
                    <Input
                      id="procedimento"
                      value={procedimentoCirurgico}
                      onChange={(e) => setProcedimentoCirurgico(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="preparacao">Preparação do Procedimento</Label>
                    <Textarea
                      id="preparacao"
                      placeholder="Digite cada item de preparação em uma linha..."
                      value={preparacaoProcedimento}
                      onChange={(e) => setPreparacaoProcedimento(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Salvar Pedido
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabela de Pedidos */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Nascimento</TableHead>
                    <TableHead>Sexo</TableHead>
                    <TableHead>Internação</TableHead>
                    <TableHead>Cirurgia</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Leito Reservado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosFiltrados.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-medium">{pedido.nomePaciente}</TableCell>
                      <TableCell>{format(pedido.dataNascimentoPaciente, "dd/MM/yyyy")}</TableCell>
                      <TableCell>{pedido.sexoPaciente}</TableCell>
                      <TableCell>{format(pedido.dataPrevistaInternacao, "dd/MM/yyyy")}</TableCell>
                      <TableCell>{format(pedido.dataPrevistaCirurgia, "dd/MM/yyyy")}</TableCell>
                      <TableCell>{pedido.medicoSolicitante}</TableCell>
                      <TableCell className="max-w-xs truncate">{pedido.procedimentoCirurgico}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-semibold",
                          pedido.statusSolicitacao === 'PENDENTE_LEITO' ? "bg-yellow-100 text-yellow-800" :
                          pedido.statusSolicitacao === 'LEITO_RESERVADO' ? "bg-green-100 text-green-800" : ""
                        )}>
                          {pedido.statusSolicitacao === 'PENDENTE_LEITO' ? 'Pendente Leito' : 'Leito Reservado'}
                        </span>
                      </TableCell>
                      <TableCell>{pedido.leitoReservado || '-'}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExcluirPedido(pedido)}
                              className="h-8 w-8 p-0 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Excluir Pedido
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {pedidosFiltrados.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pedido de cirurgia encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Exclusão */}
        {pedidoSelecionado && (
          <ModalExcluirPedido
            aberto={modalExcluirAberto}
            onFechar={() => setModalExcluirAberto(false)}
            pedido={{
              id: pedidoSelecionado.id,
              nomePaciente: pedidoSelecionado.nomePaciente
            }}
            onSucesso={handleSucessoExclusao}
          />
        )}
      </Layout>
    </TooltipProvider>
  );
};

export default MarcacaoCirurgica;
