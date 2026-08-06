import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api, unwrapResponse } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { AttendeeType } from "../../types/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

const ADD_NEW_VALUE = "__add_new__";

interface Props {
  value: string;
  onChange: (label: string) => void;
}

export function AttendeeTypeSelect({ value, onChange }: Props) {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const typesQuery = useQuery({
    queryKey: ["attendee-types", auth?.activeOrganizationId],
    queryFn: async () => unwrapResponse<AttendeeType[]>(await api.get("/attendee-types")),
  });

  const createMutation = useMutation({
    mutationFn: async (label: string) =>
      unwrapResponse<AttendeeType>(await api.post("/attendee-types", { label })),
    onSuccess: (attendeeType) => {
      queryClient.invalidateQueries({ queryKey: ["attendee-types"] });
      onChange(attendeeType.label);
      setIsAdding(false);
      setNewLabel("");
    },
  });

  const attendeeTypes = typesQuery.data ?? [];
  const hasCurrentValueInList = value === "" || attendeeTypes.some((type) => type.label === value);

  if (isAdding) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          autoFocus
          onChange={(event) => setNewLabel(event.target.value)}
          placeholder={t("attendeeTypeSelect.newTypePlaceholder")}
          value={newLabel}
        />
        <div className="flex gap-2">
          <Button
            disabled={!newLabel.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate(newLabel.trim())}
            type="button"
          >
            {createMutation.isPending ? t("attendeeTypeSelect.adding") : t("common.create")}
          </Button>
          <Button
            onClick={() => {
              setIsAdding(false);
              setNewLabel("");
            }}
            type="button"
            variant="ghost"
          >
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Select
      onChange={(event) => {
        if (event.target.value === ADD_NEW_VALUE) {
          setIsAdding(true);
          return;
        }
        onChange(event.target.value);
      }}
      value={hasCurrentValueInList ? value : ""}
    >
      <option value="">{t("attendeeTypeSelect.none")}</option>
      {!hasCurrentValueInList && value ? <option value={value}>{value}</option> : null}
      {attendeeTypes.map((type) => (
        <option key={type.id} value={type.label}>
          {type.label}
        </option>
      ))}
      <option value={ADD_NEW_VALUE}>+ {t("attendeeTypeSelect.addNewType")}</option>
    </Select>
  );
}
