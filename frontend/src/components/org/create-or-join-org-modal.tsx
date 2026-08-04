import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Building2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api, getErrorMessage, unwrapResponse } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { AuthResponse } from "../../types/api";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";

const createSchema = z.object({ name: z.string().trim().min(2) });
const joinSchema = z.object({ joinCode: z.string().trim().min(4) });

type CreateValues = z.infer<typeof createSchema>;
type JoinValues = z.infer<typeof joinSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateOrJoinOrgModal({ open, onClose }: Props) {
  const { setAuthState } = useAuth();

  const createForm = useForm<CreateValues>({ resolver: zodResolver(createSchema) });
  const joinForm = useForm<JoinValues>({ resolver: zodResolver(joinSchema) });

  const createMutation = useMutation({
    mutationFn: async (values: CreateValues) =>
      unwrapResponse<AuthResponse>(await api.post("/organizations", values)),
    onSuccess: (result) => {
      setAuthState(result);
      createForm.reset();
      onClose();
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (values: JoinValues) =>
      unwrapResponse<AuthResponse>(await api.post("/organizations/join", values)),
    onSuccess: (result) => {
      setAuthState(result);
      joinForm.reset();
      onClose();
    },
  });

  return (
    <Dialog onClose={onClose} open={open} title="Create or join organization">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-[12px] bg-amber-50 p-2.5 text-amber-700">
              <Building2 className="size-4" />
            </div>
            <h3 className="font-semibold text-slate-900">Create</h3>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Organization name</span>
              <Input placeholder="Acme Learning Lab" {...createForm.register("name")} />
              {createForm.formState.errors.name ? (
                <p className="mt-1.5 text-xs text-rose-500">{createForm.formState.errors.name.message}</p>
              ) : null}
            </label>

            {createMutation.isError ? (
              <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(createMutation.error)}
              </p>
            ) : null}

            <Button className="w-full" disabled={createMutation.isPending} type="submit">
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </form>
        </div>

        <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-[12px] bg-emerald-50 p-2.5 text-emerald-700">
              <Users className="size-4" />
            </div>
            <h3 className="font-semibold text-slate-900">Join with code</h3>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={joinForm.handleSubmit((v) => joinMutation.mutate(v))}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Join code</span>
              <Input placeholder="AB12CD34" {...joinForm.register("joinCode")} />
              {joinForm.formState.errors.joinCode ? (
                <p className="mt-1.5 text-xs text-rose-500">{joinForm.formState.errors.joinCode.message}</p>
              ) : null}
            </label>

            {joinMutation.isError ? (
              <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {getErrorMessage(joinMutation.error)}
              </p>
            ) : null}

            <Button className="w-full" disabled={joinMutation.isPending} type="submit" variant="secondary">
              {joinMutation.isPending ? "Joining..." : "Join"}
            </Button>
          </form>
        </div>
      </div>
    </Dialog>
  );
}
