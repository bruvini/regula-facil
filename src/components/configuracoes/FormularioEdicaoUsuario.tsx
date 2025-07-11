
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Usuario } from "@/types/firestore";

interface FormUsuario {
  nomeUsuario: string;
  matriculaUsuario: string;
  emailUsuario: string;
  setoresUsuario: string[];
  tipoPrevilegioUsuario: 'administrador' | 'comum';
  paginasLiberadas: string[];
}

interface FormularioEdicaoUsuarioProps {
  usuario: Usuario;
  onSubmit: (data: FormUsuario) => Promise<void>;
  onCancel: () => void;
  setoresDisponiveis: string[];
  paginasDisponiveis: string[];
  isSubmitting: boolean;
}

const FormularioEdicaoUsuario = ({ 
  usuario,
  onSubmit, 
  onCancel, 
  setoresDisponiveis, 
  paginasDisponiveis, 
  isSubmitting 
}: FormularioEdicaoUsuarioProps) => {
  const [tipoPrivilegio, setTipoPrivilegio] = useState<'administrador' | 'comum'>(usuario.tipoPrevilegioUsuario);
  const [setoresSelecionados, setSetoresSelecionados] = useState<string[]>(usuario.setoresUsuario);
  const [paginasSelecionadas, setPaginasSelecionadas] = useState<string[]>(usuario.paginasLiberadas);

  const emailSemDominio = usuario.emailUsuario.replace("@joinville.sc.gov.br", "");

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormUsuario>({
    defaultValues: {
      nomeUsuario: usuario.nomeUsuario,
      matriculaUsuario: usuario.matriculaUsuario,
      emailUsuario: emailSemDominio,
      setoresUsuario: usuario.setoresUsuario,
      tipoPrevilegioUsuario: usuario.tipoPrevilegioUsuario,
      paginasLiberadas: usuario.paginasLiberadas
    }
  });

  const handleSetorChange = (setor: string, checked: boolean) => {
    if (checked) {
      setSetoresSelecionados([...setoresSelecionados, setor]);
    } else {
      setSetoresSelecionados(setoresSelecionados.filter(s => s !== setor));
    }
  };

  const handlePaginaChange = (pagina: string, checked: boolean) => {
    if (checked) {
      setPaginasSelecionadas([...paginasSelecionadas, pagina]);
    } else {
      setPaginasSelecionadas(paginasSelecionadas.filter(p => p !== pagina));
    }
  };

  const onFormSubmit = async (data: Omit<FormUsuario, 'setoresUsuario' | 'paginasLiberadas'>) => {
    const formData: FormUsuario = {
      ...data,
      emailUsuario: data.emailUsuario + "@joinville.sc.gov.br",
      setoresUsuario: setoresSelecionados,
      paginasLiberadas: tipoPrivilegio === 'administrador' ? paginasDisponiveis : paginasSelecionadas,
      tipoPrevilegioUsuario: tipoPrivilegio
    };
    
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-nomeUsuario">Nome do Usuário *</Label>
          <Input
            id="edit-nomeUsuario"
            {...register("nomeUsuario", { required: "Nome é obrigatório" })}
            placeholder="Digite o nome do usuário"
          />
          {errors.nomeUsuario && (
            <p className="text-sm text-destructive">{errors.nomeUsuario.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-matriculaUsuario">Matrícula *</Label>
          <Input
            id="edit-matriculaUsuario"
            {...register("matriculaUsuario", { required: "Matrícula é obrigatória" })}
            placeholder="Digite a matrícula"
          />
          {errors.matriculaUsuario && (
            <p className="text-sm text-destructive">{errors.matriculaUsuario.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-emailUsuario">E-mail *</Label>
          <div className="flex">
            <Input
              id="edit-emailUsuario"
              {...register("emailUsuario", { 
                required: "E-mail é obrigatório"
              })}
              placeholder="usuario"
              className="rounded-r-none"
            />
            <span className="bg-gray-100 border border-l-0 border-input px-3 py-2 text-sm text-gray-600 rounded-r-md">
              @joinville.sc.gov.br
            </span>
          </div>
          {errors.emailUsuario && (
            <p className="text-sm text-destructive">{errors.emailUsuario.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Setores *</Label>
          <div className="grid grid-cols-2 gap-2">
            {setoresDisponiveis.map((setor) => (
              <div key={setor} className="flex items-center space-x-2">
                <Checkbox
                  id={`edit-setor-${setor}`}
                  checked={setoresSelecionados.includes(setor)}
                  onCheckedChange={(checked) => handleSetorChange(setor, checked as boolean)}
                />
                <Label htmlFor={`edit-setor-${setor}`} className="text-sm">
                  {setor}
                </Label>
              </div>
            ))}
          </div>
          {setoresSelecionados.length === 0 && (
            <p className="text-sm text-destructive">Selecione pelo menos um setor</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-tipoPrevilegioUsuario">Tipo de Privilégio *</Label>
          <Select 
            defaultValue={usuario.tipoPrevilegioUsuario}
            onValueChange={(value) => setTipoPrivilegio(value as 'administrador' | 'comum')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de privilégio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="administrador">Administrador</SelectItem>
              <SelectItem value="comum">Comum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tipoPrivilegio === 'comum' && (
          <div className="space-y-2">
            <Label>Páginas Liberadas *</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {paginasDisponiveis.map((pagina) => (
                <div key={pagina} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-pagina-${pagina}`}
                    checked={paginasSelecionadas.includes(pagina)}
                    onCheckedChange={(checked) => handlePaginaChange(pagina, checked as boolean)}
                  />
                  <Label htmlFor={`edit-pagina-${pagina}`} className="text-sm">
                    {pagina}
                  </Label>
                </div>
              ))}
            </div>
            {tipoPrivilegio === 'comum' && paginasSelecionadas.length === 0 && (
              <p className="text-sm text-destructive">Selecione pelo menos uma página</p>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || setoresSelecionados.length === 0 || (tipoPrivilegio === 'comum' && paginasSelecionadas.length === 0)}
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default FormularioEdicaoUsuario;
