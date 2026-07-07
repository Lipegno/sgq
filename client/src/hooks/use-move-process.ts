import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moveProcess } from "@/api/core";
import { toast } from "sonner";

export const useMoveProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      processYearId,
      targetMacroProcessYearId,
    }: {
      processYearId: number;
      targetMacroProcessYearId: number | null;
    }) => {
      await moveProcess({ processYearId, targetMacroProcessYearId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      toast.success("Processo movido com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Erro ao mover o processo");
    },
  });
};