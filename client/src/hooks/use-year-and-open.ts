import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

/**
 * Estado do ano de uma página + "abrir este registo ao chegar" vindo do URL
 * (?ano=<yearId>&abrir=<id>, ver lib/entity-links.ts).
 *
 * Substitui o `useState<number | null>(null)` do ano em cada página: o ano
 * arranca com o do URL (se for válido) e a página recebe `openId` para abrir o
 * registo quando os dados chegarem, chamando `clearOpen()` logo a seguir (para o
 * Voltar não o reabrir).
 */
export function useYearAndOpen() {
  const { isExternal, allowedYearIds } = useAuth();
  const [params, setParams] = useSearchParams();

  const urlYear = Number(params.get("ano")) || null;
  const openId = Number(params.get("abrir")) || null;

  // Um externo só pode aterrar num ano que lhe foi atribuído (enquanto não souber
  // quais são, não aceita nenhum — o efeito abaixo corre outra vez quando souber).
  const wantedYear =
    urlYear !== null && (!isExternal || (allowedYearIds?.includes(urlYear) ?? false)) ? urlYear : null;

  const [yearId, setYearId] = useState<number | null>(wantedYear);

  // Já estando na página, um link novo pode pedir outro ano.
  useEffect(() => {
    if (wantedYear !== null) setYearId(wantedYear);
  }, [wantedYear]);

  const clearOpen = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("abrir");
        next.delete("ano");
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  return { yearId, setYearId, openId, clearOpen };
}
