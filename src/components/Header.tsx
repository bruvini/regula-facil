
import { SidebarTrigger } from "@/components/ui/sidebar";

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground shadow-lg border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold">RegulaFácil</h1>
            <p className="text-xs md:text-sm opacity-90">Hospital São José - Joinville</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block text-sm">
            Sistema de Gerenciamento de Leitos
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
