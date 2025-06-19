
import { DocumentReference, Timestamp } from 'firebase/firestore';

export interface Setor {
  id: string;
  nomeCompleto: string;
  sigla: string;
  andar: string;
  tipo: 'crítico' | 'clínico' | 'cirúrgico';
}

export interface Leito {
  id: string;
  codigo: string;
  status: 'vago' | 'ocupado' | 'bloqueado' | 'reservado' | 'limpeza' | 'mecânica';
  tipo: 'clínico' | 'crítico' | 'isolamento';
  setor: DocumentReference;
  pacienteAtual?: DocumentReference;
  ehPCP: boolean;
  alertas: string[];
  dataUltimaAtualizacaoStatus: Timestamp;
}

export interface Paciente {
  id: string;
  nome: string;
  sexo: 'M' | 'F';
  idade: number;
  dataNascimento: Date;
  leitoAtual?: DocumentReference;
  setorAtual?: DocumentReference;
  statusInternacao: 'internado' | 'alta' | 'óbito';
  regulacaoAtual?: DocumentReference;
  isolamentosAtivos: DocumentReference[];
  cirurgiaAgendada?: DocumentReference;
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

export interface LeitoWithData extends Leito {
  setorData?: Setor;
  pacienteData?: Paciente;
}
