
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RegulacoesRemanejamentos = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Regulações */}
      <Card>
        <CardHeader>
          <CardTitle>Regulações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Conteúdo das regulações será desenvolvido
          </div>
        </CardContent>
      </Card>

      {/* Remanejamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Remanejamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Conteúdo dos remanejamentos será desenvolvido
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegulacoesRemanejamentos;
