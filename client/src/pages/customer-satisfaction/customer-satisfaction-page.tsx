import { SingletonWithYearsPage } from "@/components/singleton-with-years-page";
import {
  getCustomerSatisfaction,
  updateCustomerSatisfaction,
  uploadCustomerSatisfactionDocument,
  getCustomerSatisfactionByYear,
} from "@/api/core";
import { Smile } from "lucide-react";

export default function CustomerSatisfactionPage() {
  return (
    <SingletonWithYearsPage
      title="Satisfação dos Estudantes"
      descriptionLabel="Avaliação da perceção dos estudantes sobre a qualidade."
      descriptionPlaceholder="Descreva os resultados de satisfação dos estudantes..."
      emptyDescriptionText={'Nenhum resultado registado. Clique em "Editar" para adicionar.'}
      queryKey={["customer-satisfaction"]}
      fetchFn={getCustomerSatisfaction}
      updateFn={updateCustomerSatisfaction}
      uploadFn={uploadCustomerSatisfactionDocument}
      yearDetailQueryKey={(yearId: number) => ["customer-satisfaction", "year", yearId]}
      yearDetailFetchFn={getCustomerSatisfactionByYear}
      entityType="CUSTOMER_SATISFACTION"
      icon={<Smile size={24} />}
      versioned={false}
    />
  );
}
