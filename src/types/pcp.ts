
export interface ConfiguracaoPCP {
  id: string;
  nomeNivelPCP: string;
  qtdMinimaPCP: number;
  qtdMaximaPCP: number;
  corNivelPCP: string;
  orientacoesNivelPCP: string[];
  ordem: number; // Para ordenar os níveis
}

export interface DadosPCP {
  nivelAtual: ConfiguracaoPCP | null;
  totalPacientes: number;
  pacientesDCL: number;
  pacientesDCX: number;
  pacientesPCP: number;
  pacientesSalaLaranja: number;
  pacientesSalaEmergencia: number;
  salasBloqueadas: number;
}
