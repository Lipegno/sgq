import { SingletonWithYearsPage } from "@/components/singleton-with-years-page";
import {
  getManagementReview,
  updateManagementReview,
  uploadManagementReviewDocument,
  getManagementReviewByYear,
} from "@/api/core";
import { ClipboardList } from "lucide-react";

export default function ManagementReviewPage() {
  return (
    <SingletonWithYearsPage
      title="Revisão pela Gestão"
      descriptionLabel="Atas e decisões da revisão pela gestão"
      descriptionPlaceholder="Descreva as atas e decisões da revisão pela gestão..."
      emptyDescriptionText={'Nenhuma ata ou decisão registada. Clique em "Editar" para adicionar.'}
      queryKey={["management-review"]}
      fetchFn={getManagementReview}
      updateFn={updateManagementReview}
      uploadFn={uploadManagementReviewDocument}
      yearDetailQueryKey={(yearId: number) => ["management-review", "year", yearId]}
      yearDetailFetchFn={getManagementReviewByYear}
      entityType="MANAGEMENT_REVIEW"
      icon={<ClipboardList size={24} />}
    />
  );
}
