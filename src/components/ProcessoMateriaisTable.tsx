import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ClickToCopy from "./ClickToCopy";
import { Processo } from "@/types/processo";

interface ProcessoMateriaisTableProps {
  materiais: Processo["materiais"];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function ProcessoMateriaisTable({ materiais }: ProcessoMateriaisTableProps) {
  return (
    <div className="border border-border rounded-lg overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Código</TableHead>
            <TableHead className="text-right">Qtd.</TableHead>
            <TableHead>Unid.M</TableHead>
            <TableHead className="text-right">Valor Unit.</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead>Almoxarifado</TableHead>
            <TableHead>Estoque CD</TableHead>
            <TableHead>ATA/ARP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materiais.map((material, index) => (
            <TableRow key={`${material.codigo}-${index}`}>
              <TableCell className="font-medium">
                <ClickToCopy copyText={material.descricao}>{material.descricao}</ClickToCopy>
              </TableCell>
              <TableCell>
                <ClickToCopy copyText={material.codigo}>{material.codigo}</ClickToCopy>
              </TableCell>
              <TableCell className="text-right">{material.quantidade}</TableCell>
              <TableCell className="uppercase">{material.unidadeMedida || "un"}</TableCell>
              <TableCell className="text-right">
                <ClickToCopy copyText={material.valorUnitario.toString().replace(".", ",")}>
                  {formatCurrency(material.valorUnitario)}
                </ClickToCopy>
              </TableCell>
              <TableCell className="text-right font-medium">
                <ClickToCopy
                  copyText={(material.quantidade * material.valorUnitario)
                    .toString()
                    .replace(".", ",")}
                >
                  {formatCurrency(material.quantidade * material.valorUnitario)}
                </ClickToCopy>
              </TableCell>
              <TableCell>
                <Badge variant={material.almoxarifado === "disponivel" ? "default" : "secondary"}>
                  {material.almoxarifado === "disponivel" ? "Disponível" : "Indisponível"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={material.estoqueCD === "disponivel" ? "default" : "secondary"}>
                  {material.estoqueCD === "disponivel" ? "Disponível" : "Indisponível"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={material.ataArp === "disponivel" ? "default" : "secondary"}>
                  {material.ataArp === "disponivel" ? "Disponível" : "Indisponível"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}