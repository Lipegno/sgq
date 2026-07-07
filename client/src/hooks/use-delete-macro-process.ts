import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMacroProcess } from "@/api/core";
import { toast } from "sonner";

export const useDeleteMacroProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await deleteMacroProcess(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["macroprocesses"] });
      toast.success("Macroprocesso apagado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Erro ao apagar o macro processo");
    },
  });
};
