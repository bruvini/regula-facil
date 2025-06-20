
import { Timestamp } from "firebase/firestore";

export interface Usuario {
  id: string;
  nomeUsuario: string;
  matriculaUsuario: string;
  emailUsuario: string;
  setoresUsuario: string[];
  tipoPrevilegioUsuario: 'administrador' | 'comum';
  paginasLiberadas: string[];
  dataCadastroUsuario: Timestamp;
  firebaseUid?: string;
}

export interface LogSistema {
  id: string;
  pagina: string;
  acao: string;
  alvo: string;
  usuario: string;
  timestamp: Timestamp;
  descricao: string;
}
