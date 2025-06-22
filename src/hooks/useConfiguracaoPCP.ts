
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ConfiguracaoPCP } from '@/types/pcp';
import { useToast } from '@/hooks/use-toast';

export const useConfiguracaoPCP = () => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoPCP[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'configuracaoPCPRegulaFacil'), orderBy('ordem')),
      (snapshot) => {
        const configs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ConfiguracaoPCP[];
        setConfiguracoes(configs);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar configurações PCP:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const adicionarConfiguracao = async (config: Omit<ConfiguracaoPCP, 'id'>) => {
    try {
      await addDoc(collection(db, 'configuracaoPCPRegulaFacil'), config);
      toast({
        title: "Configuração PCP adicionada",
        description: "Nova configuração foi criada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao adicionar configuração PCP:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a configuração.",
        variant: "destructive",
      });
    }
  };

  const editarConfiguracao = async (id: string, config: Partial<ConfiguracaoPCP>) => {
    try {
      await updateDoc(doc(db, 'configuracaoPCPRegulaFacil', id), config);
      toast({
        title: "Configuração PCP atualizada",
        description: "Configuração foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao editar configuração PCP:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a configuração.",
        variant: "destructive",
      });
    }
  };

  const excluirConfiguracao = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'configuracaoPCPRegulaFacil', id));
      toast({
        title: "Configuração PCP excluída",
        description: "Configuração foi removida com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir configuração PCP:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a configuração.",
        variant: "destructive",
      });
    }
  };

  return {
    configuracoes,
    loading,
    adicionarConfiguracao,
    editarConfiguracao,
    excluirConfiguracao
  };
};
