
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

const AlertasIsolamento = () => {
  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-orange-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Pacientes com Alertas de Isolamento (CCIH/NHE)
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">0</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground text-center py-8">
          Nenhum alerta de isolamento no momento
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertasIsolamento;
