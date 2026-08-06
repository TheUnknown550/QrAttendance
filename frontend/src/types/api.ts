export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Membership = {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  joinCode: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

export type AuthResponse = {
  token: string;
  user: User;
  memberships: Membership[];
  activeOrganizationId: string | null;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
};

export type OrganizationSummaryResponse = {
  items: Membership[];
  activeOrganizationId: string | null;
};

export type OrganizationDetail = {
  id: string;
  name: string;
  joinCode: string;
  requireAttendeeEmail: boolean;
  requireAttendeePhone: boolean;
  requireAttendeeNumber: boolean;
  lifecycle: {
    status: "ACTIVE" | "INACTIVE";
    lastActivityAt: string;
    inactiveSinceAt?: string | null;
    scheduledDeletionAt?: string | null;
    warningThresholdDays: number;
    hardDeleteThresholdDays: number;
  };
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER";
  permissions: {
    canManageOrganization: boolean;
    canManageMembers: boolean;
    canCreateInvites: boolean;
  };
  members: Array<{
    membershipId: string;
    userId: string;
    name: string;
    email: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    createdAt: string;
  }>;
  invites: Array<{
    id: string;
    token: string;
    expiresAt?: string | null;
    usedCount: number;
    createdAt: string;
    createdByName: string;
  }>;
};

export type InvitePublicInfo = {
  organizationId: string;
  organizationName: string;
  expiresAt?: string | null;
  createdByName: string;
};

export type EventSession = {
  id: string;
  title: string;
  description?: string | null;
  sessionDate: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    attendance: number;
  };
};

export type SessionAttendanceRecord = {
  id: string;
  attendeeId: string;
  eventSessionId: string;
  checkedInAt: string;
  createdAt: string;
  updatedAt: string;
  attendee: Attendee;
};

export type EventSeriesSettings = {
  requireCheckInApproval: boolean;
  showOrganizationName: boolean;
  showAttendeeType: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showAttendeeNumber: boolean;
  requireCheckInPhoto: boolean;
};

export type EventSessionDetail = EventSession & {
  eventSeries: {
    id: string;
    name: string;
  } & EventSeriesSettings;
  attendance: SessionAttendanceRecord[];
  allAttendees: Attendee[];
};

export type EventSeries = {
  id: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  sessions: EventSession[];
  _count?: {
    sessions: number;
  };
} & EventSeriesSettings;

export type AttendanceHistory = {
  id: string;
  checkedInAt: string;
  eventSession: EventSession & {
    eventSeries: {
      id: string;
      name: string;
    };
  };
};

export type Attendee = {
  id: string;
  firstName: string;
  surname: string;
  organizationName?: string | null;
  attendeeType?: string | null;
  email?: string | null;
  phone?: string | null;
  attendeeNumber?: number | null;
  profileImageUrl?: string | null;
  qrToken: string;
  createdAt: string;
  updatedAt: string;
};

export type AttendeeDetail = Attendee & {
  attendance: AttendanceHistory[];
};

export type AttendeeType = {
  id: string;
  organizationId: string;
  label: string;
  createdAt: string;
};

export type QrTemplate = {
  canvasWidth: number;
  canvasHeight: number;
  imageUrl: string | null;
  qrX: number;
  qrY: number;
  qrSize: number;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ScanResult = {
  status: "found" | "success" | "already_checked_in" | "invalid_qr" | "wrong_event_session";
  attendee?: {
    id: string;
    firstName: string;
    surname: string;
    organizationName?: string | null;
    attendeeType?: string | null;
    email?: string | null;
    phone?: string | null;
    attendeeNumber?: number | null;
    profileImageUrl?: string | null;
  };
  checkedInAt?: string;
  checkInPhotoUrl?: string | null;
};

export type ScannerShareLink = {
  token: string;
  path: string;
  session: {
    id: string;
    title: string;
    sessionDate: string;
    eventSeries: {
      id: string;
      name: string;
    } & EventSeriesSettings;
  };
};

export type PublicScannerSession = {
  token: string;
  session: {
    id: string;
    title: string;
    description?: string | null;
    sessionDate: string;
    eventSeries: {
      id: string;
      name: string;
    } & EventSeriesSettings;
  };
};

export type ReportItem = {
  attendeeId: string;
  profileImageUrl?: string | null;
  firstName: string;
  surname: string;
  organizationName?: string | null;
  attendeeType?: string | null;
  email?: string | null;
  attendedSessions: number;
  totalSessions: number;
  attendancePercentage: number;
  sessionAttendance: Array<{
    sessionId: string;
    title: string;
    sessionDate: string;
    attended: boolean;
    checkedInAt?: string | null;
    checkInPhotoUrl?: string | null;
  }>;
};

export type SeriesReport = {
  series: {
    id: string;
    name: string;
    description?: string | null;
  };
  sessions: EventSession[];
  items: ReportItem[];
};

export type ImportTargetField =
  | "fullName"
  | "firstName"
  | "surname"
  | "organizationName"
  | "attendeeType"
  | "email"
  | "phone"
  | "attendeeNumber";

export type ImportColumnMapping = Partial<Record<ImportTargetField, number>>;

export type ParseAttendeeImportResult = {
  headers: string[];
  rows: string[][];
  previewRows: string[][];
  totalRows: number;
  suggestedMapping: ImportColumnMapping;
};

export type ConfirmAttendeeImportResult = {
  created: number;
  skippedCount: number;
  skipped: Array<{ row: number; reason: string }>;
};
