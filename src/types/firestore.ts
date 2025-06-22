
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

export interface Setor {
  id: string;
  nomeCompleto: string;
  sigla: string;
  andar: string;
  tipo: string;
  alertas: string[];
}

export interface Leito {
  id: string;
  codigo: string;
  setor: any; // DocumentReference
  status: 'vago' | 'ocupado' | 'reservado' | 'bloqueado' | 'limpeza' | 'mecânica';
  tipo: 'clínico' | 'crítico' | 'isolamento';
  ehPCP: boolean;
  pacienteAtual?: any; // DocumentReference
  dataUltimaAtualizacaoStatus: Timestamp;
  motivoBloqueio?: string;
  alertas: string[];
}

export interface Paciente {
  id: string;
  nome: string;
  idade: number;
  sexo: 'M' | 'F';
  statusInternacao: string;
  leitoAtual?: any; // DocumentReference
  regulacaoAtual?: any; // DocumentReference
  isolamentosAtivos?: string[];
  especialidade?: string;
  statusRegulacao?: string;
}

export interface LeitoWithData extends Leito {
  setorData?: Setor;
  pacienteData?: Paciente;
}
