import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { clearCache } from '@/lib/cache';

const cacheKeys = [
  'setoresRegulaFacil',
  'leitosRegulaFacil',
  'usuariosRegulaFacil',
  'tiposIsolamentoRegulaFacil',
  'frasesCarregamentoRegulaFacil',
  'pacientesRegulaFacil',
  'logsSistemaRegulaFacil'
];

const BlocoCache = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const limpar = () => {
    clearCache(cacheKeys);
    toast({ title: 'Cache limpo com sucesso!' });
    setOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Limpeza de Cache</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
            🧹 Limpar Cache Manualmente
          </Button>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Limpeza
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">Tem certeza que deseja limpar todos os dados em cache?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={limpar}>Limpar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BlocoCache;
