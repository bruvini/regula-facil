import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface LogData {
  pagina: string;
  acao: string;
  alvo: string;
  descricao: string;
  usuario?: string;
}

export const registrarLog = async ({ pagina, acao, alvo, descricao, usuario = 'Sistema' }: LogData) => {
  await addDoc(collection(db, 'logsSistemaRegulaFacil'), {
    pagina,
    acao,
    alvo,
    descricao,
    usuario,
    timestamp: serverTimestamp()
  });
};
