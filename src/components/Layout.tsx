
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isInicioPage = location.pathname === "/inicio";

  if (isInicioPage) {
    // For the inicio page, render without sidebar
    return (
      <div className="min-h-screen flex flex-col w-full">
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // For all other pages, render with sidebar collapsed by default
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
