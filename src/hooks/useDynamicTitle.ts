import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
  "/": "Login",
  "/inicio": "In\u00edcio",
  "/regulacao-leitos": "Regula\u00e7\u00e3o de Leitos",
  "/mapa-leitos": "Mapa de Leitos",
  "/ccih-nhe": "CCIH/NHE",
  "/marcacao-cirurgica": "Marca\u00e7\u00e3o Cir\u00fargica",
  "/huddle": "Huddle",
  "/indicadores": "Indicadores",
  "/auditoria": "Auditoria",
  "/configuracoes": "Configura\u00e7\u00f5es",
};

export default function useDynamicTitle() {
  const location = useLocation();

  useEffect(() => {
    const title = routeTitles[location.pathname];
    document.title = title ? `${title} - RegulaFacil` : "RegulaFacil";
  }, [location.pathname]);
}
