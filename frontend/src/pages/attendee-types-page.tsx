import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { AttendeeType } from "../types/api";

export function AttendeeTypesPage() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState("");

  const typesQuery = useQuery({
    queryKey: ["attendee-types", auth?.activeOrganizationId],
    queryFn: async () => unwrapResponse<AttendeeType[]>(await api.get("/attendee-types")),
  });

  const createMutation = useMutation({
    mutationFn: async (label: string) =>
      unwrapResponse<AttendeeType>(await api.post("/attendee-types", { label })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendee-types"] });
      setNewLabel("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/attendee-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendee-types"] });
    },
  });

  const attendeeTypes = typesQuery.data ?? [];

  return (
    <Card className="p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
          <Tag className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{t("attendeeTypesPage.eyebrow")}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-slate-900">{t("attendeeTypesPage.title")}</h1>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{t("attendeeTypesPage.description")}</p>

      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (newLabel.trim()) {
            createMutation.mutate(newLabel.trim());
          }
        }}
      >
        <Input
          onChange={(event) => setNewLabel(event.target.value)}
          placeholder={t("attendeeTypesPage.newTypePlaceholder")}
          value={newLabel}
        />
        <Button
          className="shrink-0 sm:w-auto"
          disabled={!newLabel.trim() || createMutation.isPending}
          icon={<Plus className="size-4" />}
          type="submit"
        >
          {createMutation.isPending ? t("attendeeTypesPage.adding") : t("attendeeTypesPage.addType")}
        </Button>
      </form>

      {createMutation.isError ? (
        <p className="mt-4 rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {getErrorMessage(createMutation.error)}
        </p>
      ) : null}

      <div className="mt-6 space-y-2">
        {attendeeTypes.map((attendeeType) => (
          <div
            key={attendeeType.id}
            className="flex items-center justify-between gap-3 rounded-[8px] bg-[var(--color-surface-soft)] p-4"
          >
            <span className="break-words text-sm font-medium text-slate-900">{attendeeType.label}</span>
            <Button
              disabled={deleteMutation.isPending}
              icon={<Trash2 className="size-4" />}
              onClick={() => {
                if (window.confirm(t("attendeeTypesPage.confirmDelete", { label: attendeeType.label }))) {
                  deleteMutation.mutate(attendeeType.id);
                }
              }}
              type="button"
              variant="danger"
            >
              {t("common.delete")}
            </Button>
          </div>
        ))}

        {!typesQuery.isLoading && attendeeTypes.length === 0 ? (
          <p className="rounded-[8px] bg-[var(--color-surface-soft)] p-4 text-sm text-slate-500">
            {t("attendeeTypesPage.noTypesYet")}
          </p>
        ) : null}
      </div>

      {deleteMutation.isError ? (
        <p className="mt-4 rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {getErrorMessage(deleteMutation.error)}
        </p>
      ) : null}
    </Card>
  );
}
