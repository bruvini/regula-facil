
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

interface Paciente {
  id: string;
  nomePaciente: string;
  sexoPaciente: string;
  dataPedidoUTI: any;
}

const PacientesUTI = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  // Calcular tempo de espera
  const calcularTempoEspera = (dataPedido: any) => {
    if (!dataPedido) return '0h 0min';

    const agora = new Date();
    const inicio = dataPedido.toDate ? dataPedido.toDate() : new Date(dataPedido);
    const diff = agora.getTime() - inicio.getTime();

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${horas}h ${minutos}min`;
  };

  useEffect(() => {
    const q = query(
      collection(db, "pacientesRegulaFacil"),
      where("aguardaUTI", "==", true)
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const dados = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          nomePaciente: data.nomePaciente,
          sexoPaciente: data.sexoPaciente,
          dataPedidoUTI: data.dataPedidoUTI,
        } as Paciente;
      });
      setPacientes(dados);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Atualizar tempo de espera a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setPacientes(prev => [...prev]); // Force re-render to update time
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null;
  }

  // Só renderiza o card se houver pacientes aguardando UTI
  if (pacientes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Pacientes aguardando UTI
            <Badge variant="secondary">
              {pacientes.length}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pacientes.map(paciente => (
            <div key={paciente.id} className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-base mb-1">
                    {paciente.nomePaciente}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {paciente.sexoPaciente === 'F' ? 'Feminino' : 'Masculino'}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    Aguardando há {calcularTempoEspera(paciente.dataPedidoUTI)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PacientesUTI;
