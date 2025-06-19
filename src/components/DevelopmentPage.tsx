
import { AlertCircle } from "lucide-react";

interface DevelopmentPageProps {
  title: string;
  description?: string;
}

const DevelopmentPage = ({ title, description }: DevelopmentPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-card rounded-lg shadow-md p-6 md:p-8 max-w-md w-full">
        <AlertCircle className="w-16 h-16 text-secondary mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {title}
        </h1>
        <p className="text-muted-foreground mb-4">
          {description || "Esta página está atualmente em desenvolvimento."}
        </p>
        <div className="bg-accent/20 border border-accent rounded-lg p-4">
          <p className="text-sm text-accent-foreground">
            🚧 Em breve esta funcionalidade estará disponível
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentPage;
