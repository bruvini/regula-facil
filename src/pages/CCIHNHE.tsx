
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Users, AlertTriangle, Eye, Settings, Plus, TrendingUp, Activity, Clock, Bed } from "lucide-react";
import { useState } from "react";

const CCIHNHE = () => {
  const [busca, setBusca] = useState("");
  const [sexoSelecionado, setSexoSelecionado] = useState("todos");
  const [isolamentosSelecionados, setIsolamentosSelecionados] = useState<string[]>([]);

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
    { titulo: "Taxa de Ocupação UTI", valor: "85%", icone: TrendingUp, cor: "text-green-600" }
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

        {/* Bloco Explicativo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sobre CCIH/NHE e Integração com NIR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">CCIH - Comissão de Controle de Infecção Hospitalar</h3>
                <p>
                  A CCIH é responsável por implementar e monitorar medidas de prevenção e controle de infecções relacionadas à assistência à saúde (IRAS). 
                  Atua na vigilância epidemiológica, elaboração de protocolos e treinamento das equipes assistenciais.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">NHE - Núcleo Hospitalar de Epidemiologia</h3>
                <p>
                  O NHE trabalha na identificação, investigação e controle de surtos e eventos adversos. 
                  Realiza a vigilância ativa de infecções e coordena as ações de prevenção em conjunto com a CCIH.
                </p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-2">Integração com NIR (Núcleo Interno de Regulação)</h3>
              <p>
                A comunicação efetiva entre CCIH/NHE e NIR é fundamental para uma regulação de leitos mais assertiva. 
                Esta integração permite:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Gestão de Isolamentos:</strong> Identificação rápida de leitos adequados para pacientes com precauções especiais</li>
                <li><strong>Prevenção de Surtos:</strong> Distribuição estratégica de pacientes para evitar transmissão cruzada</li>
                <li><strong>Otimização de Fluxos:</strong> Redução do tempo de permanência através do controle preventivo de infecções</li>
                <li><strong>Impacto na Lotação:</strong> Diminuição de bloqueios desnecessários e melhor aproveitamento da capacidade instalada</li>
              </ul>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {indicadores.map((indicador, index) => (
                <div key={index} className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <indicador.icone className={`h-5 w-5 ${indicador.cor}`} />
                    <span className="text-2xl font-bold">{indicador.valor}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{indicador.titulo}</p>
                </div>
              ))}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Botões de Ação */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ações</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar Isolamentos
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Incluir em Isolamento
                  </Button>
                </div>
              </div>
            </div>

            {/* Isolamentos Multi-select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipos de Isolamento</label>
              <div className="flex flex-wrap gap-2">
                {isolamentosDisponiveis.map((isolamento) => (
                  <Badge
                    key={isolamento.id}
                    variant={isolamentosSelecionados.includes(isolamento.id) ? "default" : "outline"}
                    className="cursor-pointer transition-colors hover:bg-primary/80"
                    onClick={() => toggleIsolamento(isolamento.id)}
                  >
                    {isolamento.tipo}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas CCIH/NHE
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">3</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">Possível surto de infecção respiratória - UTI</p>
                  <p className="text-xs text-orange-700 mt-1">3 casos confirmados nas últimas 48h</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3 text-orange-600" />
                    <span className="text-xs text-orange-600">Há 2 horas</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center py-4 text-sm text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                Mais alertas serão exibidos aqui conforme implementação
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pacientes em Vigilância */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Eye className="h-5 w-5" />
              Pacientes em Vigilância
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">8</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bed className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">João Silva - Leito 308-1</p>
                  <p className="text-xs text-blue-700">Vigilância pós-cirúrgica - Dia 3</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Contato
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600">UTI</p>
                  <p className="text-xs text-muted-foreground">M, 65 anos</p>
                </div>
              </div>
              
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                Lista completa de pacientes será implementada
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CCIHNHE;
