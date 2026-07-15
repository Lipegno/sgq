import { SingletonDocumentPage } from "@/components/singleton-document-page";
import { getScope, updateScope, uploadScopeDocument } from "@/api/core";
import { Maximize } from "lucide-react";

export default function ScopePage() {
  return (
    <SingletonDocumentPage
      title="Âmbito do SGQ"
      descriptionLabel="Definição do âmbito do sistema de gestão da qualidade."
      descriptionPlaceholder="Descreva o âmbito do SGQ..."
      emptyDescriptionText={'Nenhuma definição de âmbito definida. Clique em "Editar" para adicionar.'}
      documentCardTitle="Estado do Documento"
      queryKey={["scope"]}
      fetchFn={getScope}
      updateFn={updateScope}
      uploadFn={uploadScopeDocument}
      entityType="SCOPE"
      icon={<Maximize size={24} />}
    />
  );
}