import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Search, Users } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import { resolveMediaUrl } from "../lib/utils";
import type { Attendee, PaginatedResult } from "../types/api";

const attendeeSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  attendeeNumber: z
    .string()
    .optional()
    .refine((value) => !value || /^\d+$/.test(value.trim()), {
      message: "Attendee number must be a whole number",
    }),
});

type AttendeeFormValues = z.infer<typeof attendeeSchema>;

function normalizeAttendeeResult(data: PaginatedResult<Attendee> | Attendee[] | undefined) {
  if (Array.isArray(data)) {
    return {
      items: data,
      pagination: {
        page: 1,
        pageSize: data.length,
        total: data.length,
        totalPages: 1,
      },
    };
  }

  return data ?? null;
}

export function AttendeesPage() {
  const queryClient = useQueryClient();
  const { auth } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AttendeeFormValues>({
    resolver: zodResolver(attendeeSchema),
  });

  const attendeesQuery = useQuery({
    queryKey: ["attendees", auth?.activeOrganizationId, deferredSearch, page],
    queryFn: async () =>
      unwrapResponse<PaginatedResult<Attendee>>(
        await api.get("/attendees", {
          params: {
            search: deferredSearch || undefined,
            page,
            pageSize: 12,
          },
        }),
      ),
  });

  const mutation = useMutation({
    mutationFn: async (values: AttendeeFormValues) =>
      unwrapResponse<Attendee>(
        await api.post(
          "/attendees",
          (() => {
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("email", values.email);
            if (values.phone) {
              formData.append("phone", values.phone);
            }
            if (values.attendeeNumber && values.attendeeNumber.trim()) {
              formData.append("attendeeNumber", values.attendeeNumber.trim());
            }
            if (profileImageFile) {
              formData.append("profileImage", profileImageFile);
            }
            return formData;
          })(),
        ),
      ),
    onSuccess: () => {
      reset();
      setSearch("");
      setPage(1);
      setProfileImageFile(null);
      setImageInputKey((value) => value + 1);
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      queryClient.invalidateQueries({ queryKey: ["attendees-summary"] });
    },
  });

  const attendeeResult = normalizeAttendeeResult(attendeesQuery.data as PaginatedResult<Attendee> | Attendee[] | undefined);
  const attendees = attendeeResult?.items ?? [];
  const pagination = attendeeResult?.pagination;

  useEffect(() => {
    if (page > 1 && pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-amber-50 p-3 text-amber-700">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Attendees</p>
            <p className="text-sm text-slate-500">Create profile</p>
          </div>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Full name</span>
            <Input placeholder="Alex Morgan" {...register("name")} />
            {errors.name ? <p className="mt-2 text-xs text-rose-500">{errors.name.message}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
            <Input placeholder="alex@example.com" {...register("email")} />
            {errors.email ? <p className="mt-2 text-xs text-rose-500">{errors.email.message}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Phone</span>
            <Input placeholder="555-0101" {...register("phone")} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Attendee number</span>
            <Input
              inputMode="numeric"
              placeholder="Optional, e.g. 1"
              type="number"
              min={0}
              {...register("attendeeNumber")}
            />
            {errors.attendeeNumber ? (
              <p className="mt-2 text-xs text-rose-500">{errors.attendeeNumber.message}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Photo</span>
            <Input
              key={imageInputKey}
              accept="image/*"
              onChange={(event) => setProfileImageFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            {profileImageFile ? (
              <p className="mt-2 text-xs text-slate-500">Selected: {profileImageFile.name}</p>
            ) : null}
          </label>

          {mutation.isError ? (
            <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getErrorMessage(mutation.error)}
            </p>
          ) : null}

          <Button className="w-full" icon={<Plus className="size-4" />} type="submit">
            {mutation.isPending ? "Creating..." : "Create attendee"}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Directory</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{pagination?.total ?? 0}</h2>
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
            <Input
              className="pl-11"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone"
              value={search}
            />
          </div>
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-[10px] bg-[var(--color-surface-soft)] md:block">
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_140px] border-b border-[var(--color-border)] px-5 py-3 text-xs uppercase tracking-[0.22em] text-slate-500">
            <span>Attendee</span>
            <span>Contact</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-[var(--color-border)] [content-visibility:auto]">
            {attendeesQuery.isError ? (
              <p className="p-5 text-sm text-rose-700">{getErrorMessage(attendeesQuery.error)}</p>
            ) : null}

            {attendees.map((attendee) => (
              <div
                key={attendee.id}
                className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_140px] items-center gap-4 bg-white px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    alt={attendee.name}
                    className="size-12 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
                    src={
                      resolveMediaUrl(attendee.profileImageUrl) ??
                      "https://placehold.co/120x120/f7f5f0/334155?text=QR"
                    }
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {attendee.attendeeNumber != null ? (
                        <span className="mr-2 inline-flex items-center rounded-[6px] bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          #{attendee.attendeeNumber}
                        </span>
                      ) : null}
                      {attendee.name}
                    </p>
                    <p className="truncate text-sm text-slate-500">{attendee.email}</p>
                  </div>
                </div>

                <div className="min-w-0 text-sm text-slate-500">
                  <p className="truncate">{attendee.phone ?? "No phone"}</p>
                  <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-400">
                    QR token ready
                  </p>
                </div>

                <div className="text-right">
                  <Link
                    className="inline-flex rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-white"
                    to={`/app/attendees/${attendee.id}`}
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}

            {!attendeesQuery.isError && attendees.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No attendees match the current search.</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 space-y-3 md:hidden">
          {attendeesQuery.isError ? (
            <p className="rounded-[8px] bg-rose-50 p-5 text-sm text-rose-700">
              {getErrorMessage(attendeesQuery.error)}
            </p>
          ) : null}

          {attendees.map((attendee) => (
            <div
              key={attendee.id}
              className="rounded-[8px] bg-[var(--color-surface-soft)] p-4"
            >
              <div className="flex items-center gap-3">
                <img
                  alt={attendee.name}
                  className="size-12 rounded-[8px] object-cover ring-1 ring-[var(--color-border)]"
                  src={
                    resolveMediaUrl(attendee.profileImageUrl) ??
                    "https://placehold.co/120x120/f7f5f0/334155?text=QR"
                  }
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {attendee.attendeeNumber != null ? (
                      <span className="mr-2 inline-flex items-center rounded-[6px] bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        #{attendee.attendeeNumber}
                      </span>
                    ) : null}
                    {attendee.name}
                  </p>
                  <p className="truncate text-sm text-slate-500">{attendee.email}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-600">{attendee.phone ?? "No phone"}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">QR ready</p>
                </div>
                <Link
                  className="inline-flex rounded-[8px] bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-[var(--color-surface-soft)]"
                  to={`/app/attendees/${attendee.id}`}
                >
                  Open
                </Link>
              </div>
            </div>
          ))}

          {!attendeesQuery.isError && attendees.length === 0 ? (
            <p className="rounded-[8px] bg-[var(--color-surface-soft)] p-5 text-sm text-slate-500">
              No attendees match the current search.
            </p>
          ) : null}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-between gap-3 rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                disabled={pagination.page <= 1 || attendeesQuery.isFetching}
                icon={<ChevronLeft className="size-4" />}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                type="button"
                variant="ghost"
              >
                Previous
              </Button>
              <Button
                disabled={pagination.page >= pagination.totalPages || attendeesQuery.isFetching}
                icon={<ChevronRight className="size-4" />}
                onClick={() => setPage((current) => current + 1)}
                type="button"
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
