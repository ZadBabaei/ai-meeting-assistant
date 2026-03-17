import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Contact } from '../lib/api';

const columns = [
  { status: 'PROSPECT', label: 'Prospect', color: 'border-purple-300 bg-purple-50' },
  { status: 'ONBOARDING', label: 'Onboarding', color: 'border-blue-300 bg-blue-50' },
  { status: 'ACTIVE', label: 'Active', color: 'border-green-300 bg-green-50' },
  { status: 'INACTIVE', label: 'Inactive', color: 'border-gray-300 bg-gray-50' },
];

export function PipelinePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    api.getContacts().then(setContacts).finally(() => setLoading(false));
  }, []);

  const handleDragStart = (contactId: string) => {
    setDraggedId(contactId);
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedId) return;
    const contact = contacts.find((c) => c.id === draggedId);
    if (!contact || contact.status === newStatus) {
      setDraggedId(null);
      return;
    }

    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === draggedId ? { ...c, status: newStatus as Contact['status'] } : c))
    );
    setDraggedId(null);

    try {
      await api.updateContact(draggedId, { status: newStatus as Contact['status'] });
    } catch {
      // Revert on failure
      api.getContacts().then(setContacts);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Pipeline</h2>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Pipeline</h2>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => {
          const columnContacts = contacts.filter((c) => c.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.status)}
              className={`rounded-lg border-2 border-dashed p-4 min-h-[400px] ${col.color}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                  {columnContacts.length}
                </span>
              </div>

              <div className="space-y-2">
                {columnContacts.map((contact) => (
                  <div
                    key={contact.id}
                    draggable
                    onDragStart={() => handleDragStart(contact.id)}
                    className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Link to={`/contacts/${contact.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                      {contact.name}
                    </Link>
                    {contact.company && (
                      <p className="text-xs text-gray-500 mt-0.5">{contact.company}</p>
                    )}
                    {contact.role && (
                      <p className="text-xs text-gray-400">{contact.role}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
