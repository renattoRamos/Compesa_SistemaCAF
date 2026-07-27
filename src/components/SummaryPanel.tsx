import { FileText, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Processo } from "@/types/processo";
import { cn } from "@/lib/utils";

interface SummaryPanelProps {
  processos: Processo[];
  currentFilter: string;
  onFilterChange: (status: string) => void;
}

const formatBRL = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const SummaryPanel = ({ processos, currentFilter, onFilterChange }: SummaryPanelProps) => {
  const totalProcessos = processos.length;
  const valorTotalGeral = processos.reduce((acc, processo) => acc + processo.valorTotal, 0);

  const processosPendente = processos.filter(p => p.status === "Pendente");
  const processosAguardandoEntrega = processos.filter(p => p.status === "Aguardando Entrega");

  const cardData = [
    {
      title: "Total de Processos",
      value: totalProcessos,
      description: "Processos cadastrados no total",
      icon: FileText,
      filterValue: "Todos",
      colorClass: "text-primary",
    },
    {
      title: "Processos Pendentes",
      value: processosPendente.length,
      description: "Pendentes de Autorização GPM",
      icon: AlertTriangle,
      filterValue: "Pendente",
      colorClass: "text-destructive",
    },
    {
      title: "Aguardando Entrega",
      value: processosAguardandoEntrega.length,
      description: "Aguardando Entrega do Fornecedor",
      icon: Clock,
      filterValue: "Aguardando Entrega",
      colorClass: "text-green-700 dark:text-green-400",
    },
    {
      title: "Valor Total Geral",
      value: formatBRL(valorTotalGeral),
      description: "Soma do valor de todos os processos",
      icon: DollarSign,
      filterValue: "Todos", // Não filtra, apenas exibe o total
      colorClass: "text-primary",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {cardData.map((card, index) => {
        const isClickable = card.filterValue !== "Todos" || index === 0; // Permite clicar no 'Total' para resetar
        const isActive = card.filterValue === currentFilter;

        return (
          <Card
            key={card.title}
            className={cn(
              "transition-all duration-200",
              isClickable && "cursor-pointer hover:shadow-md",
              isActive && "ring-2 ring-primary ring-offset-2 dark:ring-offset-background",
            )}
            onClick={() => isClickable && onFilterChange(card.filterValue)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={cn("h-4 w-4", card.colorClass)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SummaryPanel;