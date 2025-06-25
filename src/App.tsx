
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import useDynamicTitle from "./hooks/useDynamicTitle";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import RegulacaoLeitos from "./pages/RegulacaoLeitos";
import MapaLeitos from "./pages/MapaLeitos";
import CCIHNHE from "./pages/CCIHNHE";
import MarcacaoCirurgica from "./pages/MarcacaoCirurgica";
import Huddle from "./pages/Huddle";
import Indicadores from "./pages/Indicadores";
import Auditoria from "./pages/Auditoria";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const TitleUpdater = () => {
  useDynamicTitle();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TitleUpdater />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/regulacao-leitos" element={<RegulacaoLeitos />} />
          <Route path="/mapa-leitos" element={<MapaLeitos />} />
          <Route path="/ccih-nhe" element={<CCIHNHE />} />
          <Route path="/marcacao-cirurgica" element={<MarcacaoCirurgica />} />
          <Route path="/huddle" element={<Huddle />} />
          <Route path="/indicadores" element={<Indicadores />} />
          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
