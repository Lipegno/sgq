import { SingletonWithYearsPage } from "@/components/singleton-with-years-page";
import {
  getAwareness,
  updateAwareness,
  uploadAwarenessDocument,
  getAwarenessByYear,
} from "@/api/core";
import { Lightbulb } from "lucide-react";

export default function AwarenessPage() {
  return (
    <SingletonWithYearsPage
      title="Consciencialização"
      descriptionLabel="Promoção da sensibilização e consciencialização para o SGQ."
      descriptionPlaceholder="Descreva as ações de consciencialização do SGQ..."
      emptyDescriptionText={'Nenhuma descrição definida. Clique em "Editar" para adicionar.'}
      queryKey={["awareness"]}
      fetchFn={getAwareness}
      updateFn={updateAwareness}
      uploadFn={uploadAwarenessDocument}
      yearDetailQueryKey={(yearId: number) => ["awareness", "year", yearId]}
      yearDetailFetchFn={getAwarenessByYear}
      entityType="AWARENESS"
      icon={<Lightbulb size={24} />}
    />
  );
}