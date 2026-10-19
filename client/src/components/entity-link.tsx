import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { entityPath, type LinkableEntity } from "@/lib/entity-links";

interface EntityLinkProps {
  entity: LinkableEntity;
  /** id do registo no ano indicado (ex.: processYearId) */
  id: number | null | undefined;
  yearId: number | null | undefined;
  /** Dentro de um diálogo: fecha-o antes de navegar. */
  onNavigate?: () => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * Nome de um registo ligado a outro, que leva a esse registo e o abre.
 * Sem id/ano (ex.: o registo não existe neste ano) fica como texto simples,
 * nunca como um link que não leva a lado nenhum.
 */
export function EntityLink({ entity, id, yearId, onNavigate, className, children }: EntityLinkProps) {
  if (id == null || yearId == null) {
    return <span className={className}>{children}</span>;
  }
  return (
    <Link
      to={entityPath(entity, id, yearId)}
      title="Abrir"
      onClick={(e) => {
        e.stopPropagation();
        onNavigate?.();
      }}
      className={cn("text-primary hover:underline underline-offset-2", className)}
    >
      {children}
      <ArrowUpRight size={12} className="inline ml-1 -mt-0.5 opacity-70" />
    </Link>
  );
}
