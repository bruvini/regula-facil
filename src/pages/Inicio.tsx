
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bed, 
  Map, 
  Shield, 
  Calendar, 
  Users, 
  BarChart, 
  FileText, 
  Settings 
} from "lucide-react";

const navigationCards = [
  {
    title: "Regulação de Leitos",
    description: "Gerencie solicitações de internação, transferências e ocupações",
    icon: Bed,
    route: "/regulacao-leitos",
    color: "bg-blue-50 hover:bg-blue-100 border-blue-200"
  },
  {
    title: "Mapa de Leitos",
    description: "Visualize todos os leitos em tempo real",
    icon: Map,
    route: "/mapa-leitos",
    color: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
  },
  {
    title: "CCIH/NHE",
    description: "Controle os pacientes com isolamento e precauções",
    icon: Shield,
    route: "/ccih-nhe",
    color: "bg-amber-50 hover:bg-amber-100 border-amber-200"
  },
  {
    title: "Marcação Cirúrgica",
    description: "Acompanhe as cirurgias agendadas e suas reservas de leito",
    icon: Calendar,
    route: "/marcacao-cirurgica",
    color: "bg-purple-50 hover:bg-purple-100 border-purple-200"
  },
  {
    title: "Huddle",
    description: "Consulte dados essenciais para passagem de plantão",
    icon: Users,
    route: "/huddle",
    color: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200"
  },
  {
    title: "Indicadores",
    description: "Analise dados e indicadores da regulação hospitalar",
    icon: BarChart,
    route: "/indicadores",
    color: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
  },
  {
    title: "Auditoria",
    description: "Acesse logs e históricos de movimentações",
    icon: FileText,
    route: "/auditoria",
    color: "bg-rose-50 hover:bg-rose-100 border-rose-200"
  },
  {
    title: "Configurações",
    description: "Gerencie usuários e permissões",
    icon: Settings,
    route: "/configuracoes",
    color: "bg-slate-50 hover:bg-slate-100 border-slate-200"
  }
];

const Inicio = () => {
  const navigate = useNavigate();
  const [userName] = useState(""); // Placeholder for future user data

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 to-muted/30">
      {/* Full-width header */}
      <div className="bg-white shadow-sm border-b border-border mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Bed className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">RegulaFácil</h1>
                <p className="text-sm text-muted-foreground">Hospital São José - Joinville</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {userName ? `Olá, ${userName}!` : "Olá, [nome do usuário]!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome card */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-bold text-primary mb-2">
              Bem-vindo ao RegulaFácil
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="max-w-4xl mx-auto space-y-4 text-muted-foreground leading-relaxed">
              <p>
                O NIR (Núcleo Interno de Regulação) é o setor responsável por gerenciar as internações hospitalares, 
                otimizando o uso dos leitos, garantindo a segurança dos pacientes e colaborando para a fluidez do atendimento.
              </p>
              <p>
                O sistema <strong className="text-primary">RegulaFácil</strong> foi criado para facilitar o trabalho da equipe do NIR, 
                promovendo mais organização, rastreabilidade e inteligência na regulação de leitos.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-8">
          {navigationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={card.title}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${card.color} border-2`}
                onClick={() => handleCardClick(card.route)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/70 rounded-lg">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-primary">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Inicio;
