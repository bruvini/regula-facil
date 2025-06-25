
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Import, FileText } from "lucide-react";
import ModalImportarPacientes from './ModalImportarPacientes';
import ModalPassagemPlantao from './ModalPassagemPlantao';

const AcoesRegulacao = () => {
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [modalPassagemAberto, setModalPassagemAberto] = useState(false);

  const handleImportarPacientes = () => {
    setModalImportarAberto(true);
  };

  const handlePassagemPlantao = () => {
    setModalPassagemAberto(true);
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
            
            <Button onClick={handlePassagemPlantao} variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Gerar Passagem de Plantão
            </Button>
          </div>
        </CardContent>
      </Card>

      <ModalImportarPacientes 
        aberto={modalImportarAberto}
        onFechar={() => setModalImportarAberto(false)}
      />

      <ModalPassagemPlantao
        aberto={modalPassagemAberto}
        onFechar={() => setModalPassagemAberto(false)}
      />
    </>
  );
};

export default AcoesRegulacao;
