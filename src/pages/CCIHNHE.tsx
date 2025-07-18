import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Users, AlertTriangle, Eye, Settings, Plus, Activity } from "lucide-react";
import { useState } from "react";
import ModalGerenciarIsolamentos from "@/components/ccih-nhe/ModalGerenciarIsolamentos";
import ModalIncluirIsolamento from "@/components/ccih-nhe/ModalIncluirIsolamento";
import MultiSelectIsolamentos from "@/components/ccih-nhe/MultiSelectIsolamentos";
import PacientesVigilancia from "@/components/ccih-nhe/PacientesVigilancia";
import AlertasCCIH from "@/components/ccih-nhe/AlertasCCIH";

const CCIHNHE = () => {
  const [busca, setBusca] = useState("");
  const [sexoSelecionado, setSexoSelecionado] = useState("todos");
  const [isolamentosSelecionados, setIsolamentosSelecionados] = useState<string[]>([]);
  const [modalIsolamentosAberto, setModalIsolamentosAberto] = useState(false);
  const [modalIncluirIsolamentoAberto, setModalIncluirIsolamentoAberto] = useState(false);

  // Mock data - will be replaced with real data later
  const isolamentosDisponiveis = [
    { id: "1", tipo: "Contato" },
    { id: "2", tipo: "Gotícula" },
    { id: "3", tipo: "Aerossol" },
    { id: "4", tipo: "Protetor" }
  ];

  const indicadores = [
    { titulo: "Pacientes em Isolamento", valor: "12", icone: Shield, cor: "text-orange-600" },
    { titulo: "Alertas Ativos", valor: "3", icone: AlertTriangle, cor: "text-red-600" },
    { titulo: "Em Vigilância", valor: "8", icone: Eye, cor: "text-blue-600" },
    { titulo: "Taxa de Ocupação UTI", valor: "85%", icone: Activity, cor: "text-green-600" }
  ];

  const toggleIsolamento = (isolamentoId: string) => {
    setIsolamentosSelecionados(prev => 
      prev.includes(isolamentoId)
        ? prev.filter(id => id !== isolamentoId)
        : [...prev, isolamentoId]
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">CCIH/NHE</h1>
            <p className="text-muted-foreground">Comissão de Controle de Infecção Hospitalar e Núcleo Hospitalar de Epidemiologia</p>
          </div>
        </div>

        {/* Bloco Explicativo Compacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Sobre CCIH/NHE e Integração com NIR
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            <p>
              A CCIH e o NHE trabalham no controle de infecções hospitalares e vigilância epidemiológica. 
              A integração efetiva com o NIR permite uma regulação de leitos mais assertiva, identificando rapidamente 
              leitos adequados para precauções especiais, prevenindo surtos através da distribuição estratégica de pacientes 
              e otimizando fluxos internos para reduzir bloqueios desnecessários e melhorar o aproveitamento da capacidade instalada.
            </p>
          </CardContent>
        </Card>

        {/* Indicadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Indicadores CCIH/NHE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg mb-2">Indicadores em Desenvolvimento</p>
              <p>Os indicadores de controle de infecção e vigilância epidemiológica serão implementados em breve.</p>
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros e Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
              {/* Busca */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome do paciente ou leito..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sexo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sexo</label>
                <Select value={sexoSelecionado} onValueChange={setSexoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipos de Isolamento */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipos de Isolamento</label>
                <MultiSelectIsolamentos
                  selectedIsolamentos={isolamentosSelecionados}
                  onSelectionChange={setIsolamentosSelecionados}
                />
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ações</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setModalIsolamentosAberto(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar Isolamentos
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setModalIncluirIsolamentoAberto(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Incluir em Isolamento
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas CCIH/NHE - Novo componente */}
        <AlertasCCIH />

        {/* Pacientes em Vigilância - Novo componente */}
        <PacientesVigilancia />

        {/* Modal de Gerenciar Isolamentos */}
        <ModalGerenciarIsolamentos 
          open={modalIsolamentosAberto}
          onOpenChange={setModalIsolamentosAberto}
        />

        {/* Modal de Incluir em Isolamento */}
        <ModalIncluirIsolamento 
          open={modalIncluirIsolamentoAberto}
          onOpenChange={setModalIncluirIsolamentoAberto}
        />
      </div>
    </Layout>
  );
};

export default CCIHNHE;
