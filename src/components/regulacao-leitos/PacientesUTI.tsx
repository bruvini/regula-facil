import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Paciente {
  id: string;
  nomePaciente: string;
  sexoPaciente: string;
  dataPedidoUTI?: any;
}

const PacientesUTI = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  const calcularTempoEspera = (dataPedido: any) => {
    if (!dataPedido) return "0h 0min";
    const inicio = dataPedido.toDate ? dataPedido.toDate() : new Date(dataPedido);
    const diff = Date.now() - inicio.getTime();
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

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (pacientes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Pacientes aguardando UTI
          <Badge variant="secondary">{pacientes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pacientes.map(paciente => (
          <div key={paciente.id} className="bg-white p-4 rounded shadow">
            <strong>{paciente.nomePaciente}</strong> —{' '}
            {paciente.sexoPaciente === 'F' ? 'Feminino' : 'Masculino'}
            <div className="text-sm text-muted-foreground">
              Tempo de espera: {calcularTempoEspera(paciente.dataPedidoUTI)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PacientesUTI;
