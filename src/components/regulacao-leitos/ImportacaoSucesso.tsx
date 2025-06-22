
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Eye } from 'lucide-react';
import { ResultadoImportacao } from '@/types/importacao';

interface ImportacaoSucessoProps {
  resultado: ResultadoImportacao;
  onFechar: () => void;
}

const ImportacaoSucesso = ({ resultado, onFechar }: ImportacaoSucessoProps) => {
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'novo': return 'default';
      case 'alterado': return 'secondary';
      case 'mantido': return 'outline';
      case 'removido': return 'destructive';
      default: return 'default';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'novo': return 'Novo';
      case 'alterado': return 'Alterado';
      case 'mantido': return 'Mantido';
      case 'removido': return 'Removido';
      default: return tipo;
    }
  };

  return (
    <>
      <div className="text-center space-y-6 py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        
        <div>
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            Importação Concluída com Sucesso!
          </h3>
          <p className="text-muted-foreground">
            A planilha foi processada e todos os dados foram atualizados no sistema.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Incluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-green-600">{resultado.pacientesIncluidos}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Alterados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-blue-600">{resultado.pacientesAlterados}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Mantidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-gray-600">{resultado.pacientesMantidos}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Removidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-orange-600">{resultado.pacientesRemovidos}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Leitos Liberados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-purple-600">{resultado.leitosLiberados}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => setModalDetalhesAberto(true)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Ver Detalhes
          </Button>
          
          <Button onClick={onFechar}>
            Fechar
          </Button>
        </div>
      </div>

      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Importação</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Lista completa de todas as alterações realizadas durante a importação:
            </p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {resultado.detalhes.map((detalhe, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{detalhe.paciente}</p>
                    <p className="text-sm text-muted-foreground">{detalhe.detalhe}</p>
                  </div>
                  <Badge variant={getTipoBadgeVariant(detalhe.tipo)}>
                    {getTipoLabel(detalhe.tipo)}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setModalDetalhesAberto(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportacaoSucesso;
