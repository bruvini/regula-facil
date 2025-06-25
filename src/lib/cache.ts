import { collection, getDocs, Query } from 'firebase/firestore';
import { db } from './firebase';
import { toast as toastSonner } from '@/components/ui/sonner';
import { registrarLog } from './logger';

interface CacheItem<T> {
  data: T[];
  timestamp: number;
}

export async function getCachedCollection<T>(
  name: string,
  expiration: number,
  q?: Query
): Promise<T[]> {
  const cachedRaw = localStorage.getItem(name);
  if (cachedRaw) {
    try {
      const cached: CacheItem<T> = JSON.parse(cachedRaw);
      if (Date.now() - cached.timestamp < expiration) {
        return cached.data;
      }
    } catch (e) {
      localStorage.removeItem(name);
    }
  }

  try {
    const snapshot = await getDocs(q ?? collection(db, name));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
    localStorage.setItem(name, JSON.stringify({ data, timestamp: Date.now() }));
    await registrarLog({
      pagina: 'cache',
      acao: 'leitura firestore',
      alvo: name,
      descricao: `Coleção ${name} lida do Firestore`,
      usuario: 'Sistema'
    });
    return data;
  } catch (error) {
    console.error('Erro ao buscar coleção:', name, error);
    toastSonner('Limite de uso do sistema atingido, tente novamente mais tarde.');
    if (cachedRaw) {
      try {
        const cached: CacheItem<T> = JSON.parse(cachedRaw);
        return cached.data;
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}

export function clearCache(keys: string[]) {
  keys.forEach(key => localStorage.removeItem(key));
}
