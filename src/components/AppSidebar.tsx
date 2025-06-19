
import { Home, Bed, Map, Shield, Calendar, Users, BarChart, FileText, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Início", url: "/inicio", icon: Home },
  { title: "Regulação de Leitos", url: "/regulacao-leitos", icon: Bed },
  { title: "Mapa de Leitos", url: "/mapa-leitos", icon: Map },
  { title: "CCIH/NHE", url: "/ccih-nhe", icon: Shield },
  { title: "Marcação Cirúrgica", url: "/marcacao-cirurgica", icon: Calendar },
  { title: "Huddle", url: "/huddle", icon: Users },
  { title: "Indicadores", url: "/indicadores", icon: BarChart },
  { title: "Auditoria", url: "/auditoria", icon: FileText },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
            <Bed className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-sm">RegulaFácil</h2>
            <p className="text-xs text-muted-foreground">HSJ</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="text-xs text-center text-muted-foreground">
          v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
