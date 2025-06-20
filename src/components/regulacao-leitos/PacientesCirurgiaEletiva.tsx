
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PacientesCirurgiaEletiva = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Pacientes Aguardando Vaga para Cirurgia Eletiva
          <Badge variant="secondary">0</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground text-center py-8">
          Nenhum paciente aguardando vaga para cirurgia eletiva
        </div>
      </CardContent>
    </Card>
  );
};

export default PacientesCirurgiaEletiva;
