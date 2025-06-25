
import { useState, useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
}

const LoadingOverlay = ({ isLoading }: LoadingOverlayProps) => {
  const [fraseAtual, setFraseAtual] = useState('');

  const frases = [
    "Otimizando o uso de cada leito...",
    "A regulação nunca dorme.",
    "Conectando pacientes ao cuidado certo.",
    "Buscando o melhor destino possível...",
    "Regulando como uma verdadeira central de inteligência.",
    "Segurando a ansiedade do plantonista...",
    "Carregando a dignidade do cuidado em tempo real.",
    "Atenção! Transferência em andamento...",
    "Monitorando os fluxos com precisão clínica.",
    "Um leito bem alocado é meio tratamento."
  ];

  useEffect(() => {
    if (isLoading) {
      // Selecionar frase aleatória
      const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
      setFraseAtual(fraseAleatoria);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="relative">
          <LoaderCircle className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-200 border-t-transparent animate-spin"></div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">RegulaFácil</h3>
          <p className="text-sm text-gray-600 animate-pulse">
            {fraseAtual}
          </p>
        </div>
        
        <div className="flex justify-center space-x-1">
          <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
