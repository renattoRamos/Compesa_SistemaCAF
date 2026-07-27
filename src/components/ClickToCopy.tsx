import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClickToCopyProps {
  children: React.ReactNode;
  copyText: string;
  className?: string;
}

const ClickToCopy = ({ children, copyText, className }: ClickToCopyProps) => {
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyText) return;

    try {
      await navigator.clipboard.writeText(copyText);
      toast.success(`"${copyText}" copiado!`);
    } catch (err) {
      console.error("Falha ao copiar texto: ", err);
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <span
      onClick={handleCopy}
      className={cn(
        "cursor-pointer transition-colors hover:text-primary hover:bg-primary/10 p-1 -m-1 rounded-md",
        className,
      )}
      title={`Clique para copiar: ${copyText}`}
    >
      {children}
    </span>
  );
};

export default ClickToCopy;