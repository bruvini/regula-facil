import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PacienteImportado, ResultadoImportacao, AcaoPacienteRemovido } from '@/types/importacao';

interface ImportacaoConfirmacaoProps {
  dadosValidados: PacienteImportado[];
  onVoltar: () => void;
  onFinalizar: (resultado: ResultadoImportacao) => void;
}

const ImportacaoConfirmacao = ({ dadosValidados, onVoltar, onFinalizar }: ImportacaoConfirmacaoProps) => {
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('');
  const [pacientesRemovidos, setPacientesRemovidos] = useState<any[]>([]);
  const [acoesRemovedores, setAcoesRemovedores] = useState<AcaoPacienteRemovido[]>([]);
  const [etapaConfirmacao, setEtapaConfirmacao] = useState<'carregando' | 'confirmacao' | 'processando'>('carregando');
  const { toast } = useToast();

  const carregarPacientesRemovidos = async () => {
    try {
      setMensagemProgresso('Identificando pacientes removidos...');
      setProgresso(10);

      const pacientesSnapshot = await getDocs(collection(db, 'pacientesRegulaFacil'));
      const pacientesExistentes = pacientesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      const nomesPlanilha = dadosValidados.map(p => p.nomePaciente.toLowerCase());
      const removidos = pacientesExistentes
        .filter((p: any) => p.statusInternacao === 'internado')
        .filter((p: any) => !nomesPlanilha.includes(p.nomePaciente?.toLowerCase() || ''))
        .map((p: any) => ({
          id: p.id,
          nome: p.nomePaciente,
          leitoAtual: p.leitoAtualPaciente,
          setorAtual: p.setorAtualPaciente
        }));

      setPacientesRemovidos(removidos);
      setAcoesRemovedores(removidos.map(p => ({
        pacienteId: p.id,
        acao: 'alta' as const
      })));

      setProgresso(100);
      setEtapaConfirmacao('confirmacao');
    } catch (error) {
      console.error('Erro ao carregar pacientes removidos:', error);
      toast({
        title: "Erro ao carregar dados",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    carregarPacientesRemovidos();
  }, []);

  const atualizarAcaoRemovido = (pacienteId: string, acao: 'alta' | 'obito' | 'realocar') => {
    setAcoesRemovedores(prev => prev.map(a => 
      a.pacienteId === pacienteId ? { ...a, acao } : a
    ));
  };

  const processarImportacao = async () => {
    setProcessando(true);
    setEtapaConfirmacao('processando');
    setProgresso(0);
    
    try {
      const resultado: ResultadoImportacao = {
        pacientesIncluidos: 0,
        pacientesAlterados: 0,
        pacientesMantidos: 0,
        pacientesRemovidos: 0,
        leitosLiberados: 0,
        detalhes: []
      };

      // Buscar dados necessários
      setMensagemProgresso('Carregando dados do banco...');
      setProgresso(5);

      const [setoresSnapshot, leitosSnapshot, pacientesSnapshot] = await Promise.all([
        getDocs(collection(db, 'setoresRegulaFacil')),
        getDocs(collection(db, 'leitosRegulaFacil')),
        getDocs(collection(db, 'pacientesRegulaFacil'))
      ]);

      const setoresDB = setoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const leitosDB = leitosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const pacientesExistentes = pacientesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Array<{
        id: string;
        nomePaciente?: string;
        leitoAtualPaciente?: string;
        setorAtualPaciente?: string;
        statusInternacao?: string;
        [key: string]: any;
      }>;

      setProgresso(10);
      setMensagemProgresso('Processando pacientes da planilha...');

      // Processar cada paciente da planilha
      const totalPacientes = dadosValidados.length;
      for (let i = 0; i < dadosValidados.length; i++) {
        const pacientePlanilha = dadosValidados[i];
        const progressoAtual = 10 + ((i / totalPacientes) * 50);
        setProgresso(Math.round(progressoAtual));

        // Encontrar setor e leito
        const setor = setoresDB.find((s: any) => s.nomeCompleto === pacientePlanilha.setorAtualPaciente);
        const leito = leitosDB.find((l: any) => 
          l.codigo === pacientePlanilha.leitoAtualPaciente ||
          l.codigo === pacientePlanilha.leitoAtualPaciente.replace(/^[A-Z\s]+/, '').trim()
        );

        if (!setor || !leito) continue;

        // Verificar se paciente já existe
        const pacienteExistente = pacientesExistentes.find((p) => 
          p.nomePaciente?.toLowerCase() === pacientePlanilha.nomePaciente.toLowerCase()
        );

        if (!pacienteExistente) {
          // Novo paciente
          await addDoc(collection(db, 'pacientesRegulaFacil'), {
            nomePaciente: pacientePlanilha.nomePaciente,
            dataNascimentoPaciente: pacientePlanilha.dataNascimentoPaciente,
            sexoPaciente: pacientePlanilha.sexoPaciente,
            dataInternacaoPaciente: pacientePlanilha.dataInternacaoPaciente,
            setorAtualPaciente: pacientePlanilha.setorAtualPaciente,
            leitoAtualPaciente: pacientePlanilha.leitoAtualPaciente,
            especialidadePaciente: pacientePlanilha.especialidadePaciente,
            statusInternacao: 'internado',
            statusRegulacao: pacientePlanilha.statusRegulacao,
            dataCriacao: Timestamp.now()
          });

          // Atualizar status do leito para ocupado
          const leitoRef = doc(db, 'leitosRegulaFacil', leito.id);
          await updateDoc(leitoRef, {
            status: 'ocupado',
            pacienteAtual: pacientePlanilha.nomePaciente,
            dataUltimaAtualizacaoStatus: Timestamp.now()
          });

          resultado.pacientesIncluidos++;
          resultado.detalhes.push({
            tipo: 'novo',
            paciente: pacientePlanilha.nomePaciente,
            detalhe: `Adicionado no leito ${pacientePlanilha.leitoAtualPaciente}`
          });
        } else {
          // Paciente existente - verificar mudança de leito
          if (pacienteExistente.leitoAtualPaciente !== pacientePlanilha.leitoAtualPaciente) {
            // Liberar leito antigo
            const leitoAntigoQuery = query(
              collection(db, 'leitosRegulaFacil'),
              where('codigo', '==', pacienteExistente.leitoAtualPaciente)
            );
            const leitoAntigoSnapshot = await getDocs(leitoAntigoQuery);
            if (!leitoAntigoSnapshot.empty) {
              const leitoAntigoRef = doc(db, 'leitosRegulaFacil', leitoAntigoSnapshot.docs[0].id);
              await updateDoc(leitoAntigoRef, {
                status: 'vago',
                pacienteAtual: null,
                dataUltimaAtualizacaoStatus: Timestamp.now()
              });
            }

            // Atualizar novo leito
            const leitoRef = doc(db, 'leitosRegulaFacil', leito.id);
            await updateDoc(leitoRef, {
              status: 'ocupado',
              pacienteAtual: pacientePlanilha.nomePaciente,
              dataUltimaAtualizacaoStatus: Timestamp.now()
            });

            // Atualizar dados do paciente
            const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteExistente.id);
            await updateDoc(pacienteRef, {
              setorAtualPaciente: pacientePlanilha.setorAtualPaciente,
              leitoAtualPaciente: pacientePlanilha.leitoAtualPaciente,
              statusRegulacao: pacientePlanilha.statusRegulacao
            });

            resultado.pacientesAlterados++;
            resultado.detalhes.push({
              tipo: 'alterado',
              paciente: pacientePlanilha.nomePaciente,
              detalhe: `Movido de ${pacienteExistente.leitoAtualPaciente} para ${pacientePlanilha.leitoAtualPaciente}`
            });
          } else {
            resultado.pacientesMantidos++;
            resultado.detalhes.push({
              tipo: 'mantido',
              paciente: pacientePlanilha.nomePaciente,
              detalhe: `Permanece no leito ${pacientePlanilha.leitoAtualPaciente}`
            });
          }
        }
      }

      setProgresso(60);
      setMensagemProgresso('Processando pacientes removidos...');

      // Processar pacientes removidos
      for (const acao of acoesRemovedores) {
        const paciente = pacientesRemovidos.find(p => p.id === acao.pacienteId);
        if (!paciente) continue;

        if (acao.acao === 'alta' || acao.acao === 'obito') {
          // Liberar leito
          const leitoQuery = query(
            collection(db, 'leitosRegulaFacil'),
            where('codigo', '==', paciente.leitoAtual)
          );
          const leitoSnapshot = await getDocs(leitoQuery);
          if (!leitoSnapshot.empty) {
            const leitoRef = doc(db, 'leitosRegulaFacil', leitoSnapshot.docs[0].id);
            await updateDoc(leitoRef, {
              status: 'vago',
              pacienteAtual: null,
              dataUltimaAtualizacaoStatus: Timestamp.now()
            });
            resultado.leitosLiberados++;
          }

          // Remover paciente
          await deleteDoc(doc(db, 'pacientesRegulaFacil', acao.pacienteId));
          resultado.pacientesRemovidos++;
          resultado.detalhes.push({
            tipo: 'removido',
            paciente: paciente.nome,
            detalhe: acao.acao === 'alta' ? 'Alta hospitalar' : 'Óbito'
          });
        }
        // TODO: Implementar realocação manual quando necessário
      }

      setProgresso(90);
      setMensagemProgresso('Registrando logs...');

      // Registrar log da importação
      await addDoc(collection(db, 'logsSistemaRegulaFacil'), {
        pagina: 'Regulação de Leitos',
        acao: 'Importação de planilha',
        alvo: 'sistema',
        usuario: 'Sistema',
        timestamp: Timestamp.now(),
        descricao: `Importação realizada: ${resultado.pacientesIncluidos} incluídos, ${resultado.pacientesAlterados} alterados, ${resultado.pacientesRemovidos} removidos`
      });

      setProgresso(100);
      onFinalizar(resultado);

    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante a importação.",
        variant: "destructive"
      });
    } finally {
      setProcessando(false);
    }
  };

  if (etapaConfirmacao === 'carregando') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>{mensagemProgresso}</span>
          <span>{progresso}%</span>
        </div>
        <Progress value={progresso} className="w-full" />
      </div>
    );
  }

  if (etapaConfirmacao === 'processando') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>{mensagemProgresso}</span>
          <span>{progresso}%</span>
        </div>
        <Progress value={progresso} className="w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium">Confirmação necessária</p>
          <p className="text-sm mt-1">
            Foram encontrados {pacientesRemovidos.length} pacientes que não estão na planilha. 
            Defina o que aconteceu com cada um:
          </p>
        </AlertDescription>
      </Alert>

      {pacientesRemovidos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pacientes não encontrados na planilha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pacientesRemovidos.map((paciente, index) => (
              <div key={paciente.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{paciente.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {paciente.setorAtual} - Leito {paciente.leitoAtual}
                  </p>
                </div>
                <Select 
                  value={acoesRemovedores[index]?.acao} 
                  onValueChange={(value: 'alta' | 'obito' | 'realocar') => 
                    atualizarAcaoRemovido(paciente.id, value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="obito">Óbito</SelectItem>
                    <SelectItem value="realocar" disabled>Realocar (em breve)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pacientesRemovidos.length === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <p className="font-medium text-green-800">Nenhum paciente removido encontrado</p>
            <p className="text-sm text-green-700 mt-1">
              Todos os pacientes internados estão presentes na planilha.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onVoltar} disabled={processando}>
          Voltar
        </Button>
        
        <Button onClick={processarImportacao} disabled={processando}>
          {processando ? 'Processando...' : 'Confirmar e Importar'}
        </Button>
      </div>
    </div>
  );
};

export default ImportacaoConfirmacao;
