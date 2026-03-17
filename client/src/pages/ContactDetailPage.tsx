import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type ContactDetail } from '../lib/api';

const statusColors: Record<string, string> = {
  PROSPECT: 'bg-purple-100 text-purple-800',
  ONBOARDING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
};

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getContact(id).then(setContact).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Contact not found</p>
        <Link to="/contacts" className="text-indigo-600 text-sm mt-2 inline-block">Back to contacts</Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link to="/contacts" className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
        &larr; Back to contacts
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{contact.name}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {contact.email && <span>{contact.email}</span>}
            {contact.company && <span>{contact.company}</span>}
            {contact.role && <span>{contact.role}</span>}
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[contact.status]}`}>
          {contact.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meeting History */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Meeting History ({contact.meetings.length})
          </h3>
          {contact.meetings.length === 0 ? (
            <p className="text-sm text-gray-400">No meetings yet</p>
          ) : (
            <ul className="space-y-3">
              {contact.meetings.map(({ meeting }) => (
                <li key={meeting.id}>
                  <Link
                    to={`/meetings/${meeting.id}`}
                    className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{meeting.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(meeting.date).toLocaleDateString()}
                    </p>
                    {meeting.summary && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{meeting.summary}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* CRM Changes */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            CRM Field History ({contact.crmChanges.length})
          </h3>
          {contact.crmChanges.length === 0 ? (
            <p className="text-sm text-gray-400">No CRM changes recorded</p>
          ) : (
            <ul className="space-y-3">
              {contact.crmChanges.map((change) => (
                <li key={change.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{change.fieldName}</p>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    {change.oldValue && (
                      <>
                        <span className="text-red-600 line-through">{change.oldValue}</span>
                        <span className="text-gray-400">&rarr;</span>
                      </>
                    )}
                    <span className="text-green-700 font-medium">{change.newValue}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(change.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {contact.notes && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mt-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Notes</h3>
          <p className="text-sm text-gray-700">{contact.notes}</p>
        </div>
      )}
    </div>
  );
}
