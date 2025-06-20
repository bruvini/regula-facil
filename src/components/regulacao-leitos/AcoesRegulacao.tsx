
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Import } from "lucide-react";

const AcoesRegulacao = () => {
  const handleImportarPacientes = () => {
    console.log("Importar pacientes");
    // Funcionalidade será implementada posteriormente
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Button onClick={handleImportarPacientes} className="flex items-center gap-2">
            <Import className="h-4 w-4" />
            Importar Pacientes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AcoesRegulacao;
