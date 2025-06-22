
export interface PacienteImportado {
  nomePaciente: string;
  dataNascimentoPaciente: string;
  sexoPaciente: 'M' | 'F';
  dataInternacaoPaciente: string;
  setorAtualPaciente: string;
  leitoAtualPaciente: string;
  especialidadePaciente: string;
  statusRegulacao?: 'AGUARDANDO_REGULACAO' | null;
}

export interface PacienteExistente {
  id: string;
  nome: string;
  leitoAtual: string;
  setorAtual: string;
}

export interface ConflitoPaciente {
  paciente: PacienteExistente;
  novoLeito: string;
  novoSetor: string;
  tipo: 'mudanca_leito' | 'paciente_removido';
}

export interface ResultadoValidacao {
  pacientesNovos: PacienteImportado[];
  pacientesMudancaLeito: ConflitoPaciente[];
  pacientesRemovidos: PacienteExistente[];
  erros: {
    setoresNaoEncontrados: string[];
    leitosNaoEncontrados: string[];
  };
}

export interface ResultadoImportacao {
  pacientesIncluidos: number;
  pacientesAlterados: number;
  pacientesMantidos: number;
  pacientesRemovidos: number;
  leitosLiberados: number;
  detalhes: {
    tipo: 'novo' | 'alterado' | 'mantido' | 'removido';
    paciente: string;
    detalhe: string;
  }[];
}

export interface AcaoPacienteRemovido {
  pacienteId: string;
  acao: 'alta' | 'obito' | 'realocar';
  novoLeito?: string;
}
