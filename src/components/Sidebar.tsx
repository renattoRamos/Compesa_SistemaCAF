import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";
import { FileText, Receipt } from "lucide-react";

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
  return (
    <div className={cn("space-y-4 py-4", className)}>
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
    </div>
  );
}