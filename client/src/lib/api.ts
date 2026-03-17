const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Meetings
  getMeetings: () => request<Meeting[]>('/meetings'),
  getMeeting: (id: string) => request<MeetingDetail>(`/meetings/${id}`),
  createMeeting: (data: { title: string; transcript?: string; contactIds?: string[] }) =>
    request<Meeting>('/meetings', { method: 'POST', body: JSON.stringify(data) }),
  processMeeting: (id: string) =>
    request<{ message: string }>(`/meetings/${id}/process`, { method: 'POST' }),
  deleteMeeting: (id: string) =>
    request<{ message: string }>(`/meetings/${id}`, { method: 'DELETE' }),
  uploadAudio: async (title: string, file: File): Promise<Meeting> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('audio', file);
    const res = await fetch(`${API_BASE}/meetings/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || 'Upload failed');
    }
    return res.json();
  },

  // Contacts
  getContacts: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<Contact[]>(`/contacts${qs ? `?${qs}` : ''}`);
  },
  getContact: (id: string) => request<ContactDetail>(`/contacts/${id}`),
  createContact: (data: Partial<Contact>) =>
    request<Contact>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id: string, data: Partial<Contact>) =>
    request<Contact>(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteContact: (id: string) =>
    request<{ message: string }>(`/contacts/${id}`, { method: 'DELETE' }),
};

// Types
export interface Meeting {
  id: string;
  title: string;
  date: string;
  transcript: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  summary: string | null;
  createdAt: string;
  contacts: { contact: Contact }[];
  actionItems: ActionItem[];
  _count?: { crmChanges: number };
}

export interface MeetingDetail extends Meeting {
  crmChanges: CRMFieldChange[];
  followUpEmail: FollowUpEmail | null;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  role: string | null;
  phone: string | null;
  status: 'PROSPECT' | 'ONBOARDING' | 'ACTIVE' | 'INACTIVE';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { meetings: number };
}

export interface ContactDetail extends Contact {
  meetings: { meeting: Meeting }[];
  crmChanges: CRMFieldChange[];
}

export interface ActionItem {
  id: string;
  meetingId: string;
  description: string;
  assignee: string | null;
  dueDate: string | null;
  status: 'TODO' | 'DONE' | 'OVERDUE';
}

export interface CRMFieldChange {
  id: string;
  meetingId: string;
  contactId: string | null;
  contact: Contact | null;
  fieldName: string;
  oldValue: string | null;
  newValue: string;
  status: 'PENDING' | 'APPROVED' | 'DISMISSED';
  createdAt: string;
}

export interface FollowUpEmail {
  id: string;
  meetingId: string;
  subject: string;
  body: string;
  to: string[];
  createdAt: string;
}
