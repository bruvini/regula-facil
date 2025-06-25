
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Isolamento {
  nomeIsolamento: string;
  dataInclusao: any;
}

interface IsolationBadgeProps {
  isolamentos: Isolamento[];
}

const IsolationBadge = ({ isolamentos }: IsolationBadgeProps) => {
  if (!isolamentos || isolamentos.length === 0) {
    return null;
  }

  const isolamentosTexto = isolamentos
    .map(iso => iso.nomeIsolamento)
    .join(', ');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-lg cursor-pointer">🦠</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">
            <strong>Isolamentos ativos:</strong><br />
            {isolamentosTexto}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default IsolationBadge;
