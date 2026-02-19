"use client";

/**
 * Provider certifications page.
 *
 * WHY: Certifications are a critical trust signal for hospitals choosing a
 * provider. This page displays all certifications and allows adding new ones
 * via the addCertification mutation. Expiry tracking helps providers stay
 * compliant with Vietnamese medical device regulations.
 *
 * vi: "Chứng chỉ" / en: "Certifications"
 */
import { useState } from "react";

import { useActiveOrganization } from "~/auth/client";
import { CertificationTable } from "~/features/providers/components/certification-table";
import { useProviderMutations } from "~/features/providers/hooks/use-provider-mutations";
import { useProviderProfile } from "~/features/providers/hooks/use-provider-profile";

interface AddCertFormState {
  nameVi: string;
  nameEn: string;
  issuingBody: string;
}

export default function ProviderCertificationsPage() {
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();
  const organizationId = activeOrg?.id ?? "";

  const { certifications, isLoading } = useProviderProfile(organizationId);
  const { addCertification } = useProviderMutations();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddCertFormState>({
    nameVi: "",
    nameEn: "",
    issuingBody: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAddCert(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId || !form.nameVi || !form.nameEn) return;

    setIsSubmitting(true);
    try {
      await addCertification({
        organizationId,
        nameVi: form.nameVi,
        nameEn: form.nameEn,
        issuingBody: form.issuingBody || undefined,
      });
      setForm({ nameVi: "", nameEn: "", issuingBody: "" });
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orgPending) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Chứng chỉ {/* Certifications */}
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý chứng nhận và giấy phép hoạt động{" "}
            {/* Manage certifications and operating licenses */}
          </p>
        </div>
        <button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium"
          onClick={() => setShowForm((prev) => !prev)}
        >
          {
            showForm
              ? "Hủy" /* Cancel */
              : "Thêm chứng nhận" /* Add Certification */
          }
        </button>
      </div>

      {/* Inline add certification form */}
      {showForm && (
        <form
          onSubmit={handleAddCert}
          className="space-y-3 rounded-lg border p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="certNameVi" className="text-sm font-medium">
                Tên chứng nhận (Tiếng Việt) *
                {/* Certification Name (Vietnamese) */}
              </label>
              <input
                id="certNameVi"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={form.nameVi}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nameVi: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="certNameEn" className="text-sm font-medium">
                Tên chứng nhận (Tiếng Anh) *{/* Certification Name (English) */}
              </label>
              <input
                id="certNameEn"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={form.nameEn}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nameEn: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="certIssuingBody" className="text-sm font-medium">
              Cơ quan cấp {/* Issuing Body */}
            </label>
            <input
              id="certIssuingBody"
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              value={form.issuingBody}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, issuingBody: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "Thêm"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-muted h-12 animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <CertificationTable certifications={certifications} locale="vi" />
      )}
    </div>
  );
}
