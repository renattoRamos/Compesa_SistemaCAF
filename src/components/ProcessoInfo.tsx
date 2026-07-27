import { Badge } from "@/components/ui/badge";
import { Processo } from "@/types/processo";
import ClickToCopy from "./ClickToCopy";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProcessoInfoProps {
  processo: Processo;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const getStatusBadgeVariant = (status: Processo["status"]) => {
  switch (status) {
    case "Aprovado":
      return "default";
    case "Rejeitado":
      return "destructive";
    case "Aguardando Entrega":
      return "secondary"; // Mantém secondary para a base, mas usa classes customizadas
    case "Pendente":
    default:
      return "secondary";
  }
};

const getPendenteClasses = (status: Processo["status"]) => {
  if (status === "Pendente") {
    return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700 hover:bg-red-100/80";
  }
  if (status === "Aguardando Entrega") {
    // Novo tom de verde/ciano para 'Aguardando Entrega'
    return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700";
  }
  return "";
};

export function ProcessoInfo({ processo }: ProcessoInfoProps) {
  const formattedDate = processo.dataProcesso
    ? format(new Date(`${processo.dataProcesso}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })
    : "N/A";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-muted p-4 rounded-lg">
      <div>
        <p className="text-sm text-muted-foreground">Data do Processo</p>
        <p className="font-medium">{formattedDate}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Nº da Requisição</p>
        <p className="font-medium">
          <ClickToCopy copyText={processo.numeroRequisicao}>{processo.numeroRequisicao}</ClickToCopy>
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Nº do Processo SCDI</p>
        <p className="font-medium">
          <ClickToCopy copyText={processo.numeroProcesso}>{processo.numeroProcesso}</ClickToCopy>
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Coordenação</p>
        <p className="font-medium">{processo.coordenacao}</p>
      </div>
      <div className="col-span-full md:col-span-4">
        <p className="text-sm text-muted-foreground">Aplicação</p>
        <p className="font-medium">{processo.aplicacao}</p>
      </div>
      <div className="col-span-full sm:col-span-1">
        <p className="text-sm text-muted-foreground">Valor Total</p>
        <p className="font-medium text-primary text-lg">
          <ClickToCopy copyText={processo.valorTotal.toString().replace(".", ",")}>
            {formatCurrency(processo.valorTotal)}
          </ClickToCopy>
        </p>
      </div>
      <div className="col-span-full sm:col-span-1">
        <p className="text-sm text-muted-foreground">Status</p>
        <Badge
          variant={getStatusBadgeVariant(processo.status)}
          className={cn(getPendenteClasses(processo.status))}
        >
          {processo.status}
        </Badge>
      </div>
      {processo.status === "Aguardando Entrega" && processo.prazoEntrega && (
        <div className="col-span-full sm:col-span-2">
          <p className="text-sm text-muted-foreground">Prazo de Entrega</p>
          <p className="font-medium text-green-700 dark:text-green-400">
            {format(new Date(`${processo.prazoEntrega}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
      )}
    </div>
  );
}