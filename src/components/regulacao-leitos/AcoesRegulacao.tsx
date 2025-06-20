
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Import } from "lucide-react";
import ModalImportarPacientes from './ModalImportarPacientes';

const AcoesRegulacao = () => {
  const [modalImportarAberto, setModalImportarAberto] = useState(false);

  const handleImportarPacientes = () => {
    setModalImportarAberto(true);
  };

  return (
    <>
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

      <ModalImportarPacientes 
        aberto={modalImportarAberto}
        onFechar={() => setModalImportarAberto(false)}
      />
    </>
  );
};

export default AcoesRegulacao;
