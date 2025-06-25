
import { useState, useEffect } from "react";
import { collection, query, orderBy, where, deleteDoc, doc, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2, Search, FileText, Activity } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LogSistema } from "@/types/firestore";
import { getCachedCollection } from "@/lib/cache";

const Auditoria = () => {
  const [logs, setLogs] = useState<LogSistema[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogSistema[]>([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState<Date>();
  const [filtroDataFim, setFiltroDataFim] = useState<Date>();
  const [indicadores, setIndicadores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Carregar logs do Firestore
  const carregarLogs = async () => {
    try {
      setIsLoading(true);
      const logsQuery = query(
        collection(db, "logsSistemaRegulaFacil"),
        orderBy("timestamp", "desc")
      );

      const logsData = await getCachedCollection<LogSistema>(
        "logsSistemaRegulaFacil",
        1000 * 60 * 10,
        logsQuery
      );
      
      setLogs(logsData);
      calcularIndicadores(logsData);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar os logs do sistema",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular indicadores por página
  const calcularIndicadores = (logsData: LogSistema[]) => {
    const contadores: Record<string, number> = {};
    
    logsData.forEach((log) => {
      const pagina = log.pagina || "Outras";
      contadores[pagina] = (contadores[pagina] || 0) + 1;
    });
    
    setIndicadores(contadores);
  };

  // Filtrar logs
  const filtrarLogs = () => {
    let logsFiltrados = [...logs];

    // Filtro por texto
    if (filtroTexto) {
      logsFiltrados = logsFiltrados.filter((log) =>
        log.descricao.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        log.acao.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        log.usuario.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        log.pagina.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        log.alvo.toLowerCase().includes(filtroTexto.toLowerCase())
      );
    }

    // Filtro por data
    if (filtroDataInicio && filtroDataFim) {
      logsFiltrados = logsFiltrados.filter((log) => {
        const dataLog = log.timestamp.toDate();
        const inicio = new Date(filtroDataInicio);
        inicio.setHours(0, 0, 0, 0);
        const fim = new Date(filtroDataFim);
        fim.setHours(23, 59, 59, 999);
        
        return dataLog >= inicio && dataLog <= fim;
      });
    }

    setFilteredLogs(logsFiltrados);
  };

  // Excluir logs antigos (15+ dias)
  const excluirLogsAntigos = async () => {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 15);
      
      const logsAntigos = query(
        collection(db, "logsSistemaRegulaFacil"),
        where("timestamp", "<=", Timestamp.fromDate(dataLimite))
      );
      
      const querySnapshot = await getDocs(logsAntigos);
      let quantidadeExcluida = 0;
      
      // Excluir cada log antigo
      const deletePromises = querySnapshot.docs.map(async (docRef) => {
        await deleteDoc(doc(db, "logsSistemaRegulaFacil", docRef.id));
        quantidadeExcluida++;
      });
      
      await Promise.all(deletePromises);
      
      // Criar log da exclusão
      if (quantidadeExcluida > 0) {
        await addDoc(collection(db, "logsSistemaRegulaFacil"), {
          pagina: "Auditoria",
          acao: "Exclusão de Logs Antigos",
          alvo: "Sistema",
          usuario: "Sistema",
          timestamp: Timestamp.now(),
          descricao: `Exclusão automática de ${quantidadeExcluida} registros de logs com mais de 15 dias - ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
        });
      }
      
      toast({
        title: "Logs excluídos com sucesso",
        description: `${quantidadeExcluida} registros antigos foram removidos`,
      });
      
      // Recarregar logs
      await carregarLogs();
    } catch (error) {
      console.error("Erro ao excluir logs antigos:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir logs antigos",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    carregarLogs();
  }, []);

  useEffect(() => {
    filtrarLogs();
  }, [logs, filtroTexto, filtroDataInicio, filtroDataFim]);

  const formatarDataHora = (timestamp: Timestamp) => {
    return format(timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Título da página */}
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Auditoria do Sistema</h1>
        </div>

        {/* Bloco explicativo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              O que são os Logs do Sistema?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Os logs do sistema são registros automáticos de todas as ações realizadas no RegulaFácil, 
              proporcionando total rastreabilidade e transparência das operações.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Para que servem:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Auditoria de ações dos usuários</li>
                  <li>Rastreamento de mudanças nos dados</li>
                  <li>Investigação de problemas operacionais</li>
                  <li>Compliance e conformidade regulatória</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Importância:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Garantia da integridade dos dados</li>
                  <li>Responsabilização das ações</li>
                  <li>Suporte à tomada de decisões</li>
                  <li>Evidências para processos de melhoria</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores por página */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade por Módulo</CardTitle>
            <CardDescription>Quantidade de logs registrados por página do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(indicadores).map(([pagina, quantidade]) => (
                <div key={pagina} className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{quantidade}</div>
                  <div className="text-xs text-muted-foreground">{pagina}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filtros de Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              {/* Filtro por texto */}
              <div className="space-y-2">
                <Label htmlFor="filtro-texto">Pesquisar</Label>
                <Input
                  id="filtro-texto"
                  placeholder="Digite qualquer termo..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                />
              </div>

              {/* Data início */}
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filtroDataInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filtroDataInicio ? format(filtroDataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filtroDataInicio}
                      onSelect={setFiltroDataInicio}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data fim */}
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filtroDataFim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filtroDataFim ? format(filtroDataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filtroDataFim}
                      onSelect={setFiltroDataFim}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Botão de exclusão */}
              <div className="space-y-2">
                <Label>Manutenção</Label>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Logs Antigos
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá excluir permanentemente todos os logs com mais de 15 dias. 
                        Esta operação não pode ser desfeita. Deseja continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={excluirLogsAntigos}>
                        Confirmar Exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de logs */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Auditoria</CardTitle>
            <CardDescription>
              {isLoading ? "Carregando..." : `${filteredLogs.length} registros encontrados`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum log encontrado com os filtros aplicados
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 border rounded-lg bg-muted/30 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-mono text-muted-foreground">
                        {formatarDataHora(log.timestamp)}
                      </div>
                      <div className="text-right">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                          {log.pagina}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <span className="font-semibold">Usuário:</span> {log.usuario}
                      </div>
                      <div>
                        <span className="font-semibold">Ação:</span> {log.acao}
                      </div>
                      <div>
                        <span className="font-semibold">Alvo:</span> {log.alvo}
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-semibold">Descrição:</span> {log.descricao}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Auditoria;
