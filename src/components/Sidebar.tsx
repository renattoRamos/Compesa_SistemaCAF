import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";
import { FileText, Receipt, FileSpreadsheet, ExternalLink } from "lucide-react";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

const navItems = [
  {
    title: "Autorização SCDI",
    href: "/autorizacao-scdi",
    icon: FileText,
  },
  {
    title: "Lançamento de NF",
    href: "/lancamento-nf",
    icon: Receipt,
  },
];

export function Sidebar({ className, onLinkClick }: SidebarProps) {
  const { spreadsheetId, spreadsheetTitle, spreadsheetUrl } = useGoogleSheets();

  return (
    <div className={cn("flex flex-col justify-between h-full py-4", className)}>
      <div className="px-3 py-2">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onLinkClick}
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </NavLink>
          ))}
        </div>
      </div>

      {spreadsheetId && spreadsheetUrl && (
        <div className="px-3 py-2 mt-auto">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-sidebar-foreground">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span className="truncate">{spreadsheetTitle}</span>
            </div>
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline pt-0.5"
            >
              Abrir Planilha Google
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}