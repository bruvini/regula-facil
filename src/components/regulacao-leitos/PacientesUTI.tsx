import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Paciente {
  id: string;
  nomePaciente: string;
  sexoPaciente: string;
}

const PacientesUTI = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      {pacientes.length === 0 ? (
        <p>Nenhum paciente aguardando UTI no momento.</p>
      ) : (
        pacientes.map(paciente => (
          <div key={paciente.id} className="bg-white p-4 rounded shadow mb-2">
            <strong>{paciente.nomePaciente}</strong> —{' '}
            {paciente.sexoPaciente === 'F' ? 'Feminino' : 'Masculino'}
          </div>
        ))
      )}
    </div>
  );
};

export default PacientesUTI;
