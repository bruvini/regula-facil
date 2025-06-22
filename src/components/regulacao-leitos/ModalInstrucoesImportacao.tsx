
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Download, Database, Save } from 'lucide-react';

interface ModalInstrucoesImportacaoProps {
  aberto: boolean;
  onFechar: () => void;
}

const ModalInstrucoesImportacao = ({ aberto, onFechar }: ModalInstrucoesImportacaoProps) => {
  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Como Baixar a Planilha do MV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Siga este passo a passo exatamente como descrito. 
                Qualquer dúvida, consulte o responsável pelo NIR antes de prosseguir.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                1
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Acesse o Sistema MV</h3>
                <p className="text-sm text-gray-700">
                  Clique no link abaixo para acessar o sistema MV. O link vai abrir em uma nova aba do seu navegador.
                </p>
                <a 
                  href="https://1495prd.cloudmv.com.br/Painel/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Acessar Sistema MV
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                2
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Faça o Login no Sistema</h3>
                <p className="text-sm text-gray-700">
                  Quando a página carregar, você verá uma tela de login. Use as credenciais abaixo:
                </p>
                <div className="bg-gray-50 p-3 rounded-md border">
                  <p className="text-sm"><strong>Usuário:</strong> NIR</p>
                  <p className="text-sm"><strong>Senha:</strong> nir@2025</p>
                </div>
                <p className="text-xs text-gray-600">
                  Digitie exatamente como mostrado acima, respeitando maiúsculas e minúsculas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                3
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Localize a Aba "NIR - Ocupação setores"</h3>
                <p className="text-sm text-gray-700">
                  Após fazer o login, você verá o painel principal do sistema. 
                  Procure pela aba chamada <strong>"NIR - Ocupação setores"</strong>.
                </p>
                <p className="text-sm text-gray-700">
                  Nesta aba, você encontrará uma tabela com todos os pacientes atualmente internados no hospital.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                4
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Exporte a Planilha</h3>
                <p className="text-sm text-gray-700">
                  Agora vamos exportar os dados. Siga esta sequência exata:
                </p>
                <div className="space-y-2 ml-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span>Clique no <strong>ícone de banco de dados</strong> ao lado do texto "NIR - Ocupação setores"</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Download className="h-4 w-4 text-green-600" />
                    <span>No menu que aparecer, clique em <strong>"Exportar"</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 bg-orange-500 rounded text-xs text-white flex items-center justify-center font-bold">XLS</span>
                    <span>Selecione o formato <strong>"XLS"</strong> (não Excel)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Save className="h-4 w-4 text-purple-600" />
                    <span>Clique no <strong>botão do disquete</strong> para salvar</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                5
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Escolha Onde Salvar</h3>
                <p className="text-sm text-gray-700">
                  O sistema vai abrir uma janela perguntando onde você quer salvar o arquivo. 
                  Escolha uma pasta de fácil acesso, como a área de trabalho ou pasta de downloads.
                </p>
                <p className="text-xs text-gray-600">
                  Lembre-se do local onde salvou, pois você precisará encontrar este arquivo no próximo passo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                6
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Importe no RegulaFácil</h3>
                <p className="text-sm text-gray-700">
                  Agora é só voltar para o RegulaFácil e clicar em "Escolher Arquivo" para selecionar 
                  a planilha que você acabou de baixar.
                </p>
                <p className="text-sm text-gray-700">
                  O RegulaFácil vai automaticamente:
                </p>
                <ul className="text-sm text-gray-600 list-disc ml-6 space-y-1">
                  <li>Ler todos os dados da planilha</li>
                  <li>Validar se os setores e leitos existem no sistema</li>
                  <li>Identificar pacientes que estão aguardando regulação</li>
                  <li>Mostrar um resumo dos dados antes de importar</li>
                  <li>Salvar os pacientes no banco de dados do RegulaFácil</li>
                </ul>
              </div>
            </div>
          </div>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <p className="text-sm text-green-800">
                <strong>Dica:</strong> Se tiver algum erro na importação, verifique se baixou o arquivo 
                no formato XLS (não XLSX) e se os setores/leitos estão cadastrados no RegulaFácil.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onFechar}>
              Entendi, Vou Seguir o Passo a Passo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalInstrucoesImportacao;
