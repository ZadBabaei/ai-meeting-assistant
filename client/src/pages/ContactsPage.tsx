import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Contact } from '../lib/api';

const statusColors: Record<string, string> = {
  PROSPECT: 'bg-purple-100 text-purple-800',
  ONBOARDING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
};

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', company: '', role: '' });

  const fetchContacts = () => {
    setLoading(true);
    api.getContacts({ search: search || undefined, status: statusFilter || undefined })
      .then(setContacts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContacts();
  }, [statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim()) return;
    await api.createContact(newContact);
    setNewContact({ name: '', email: '', company: '', role: '' });
    setShowNew(false);
    fetchContacts();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Contacts</h2>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Contact
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleCreateContact} className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Name *"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <input
              placeholder="Email"
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              placeholder="Company"
              value={newContact.company}
              onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              placeholder="Role"
              value={newContact.role}
              onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              Create
            </button>
            <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PROSPECT">Prospect</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No contacts found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Company</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Role</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Meetings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link to={`/contacts/${contact.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                      {contact.name}
                    </Link>
                    {contact.email && (
                      <p className="text-xs text-gray-500">{contact.email}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">{contact.company || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{contact.role || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[contact.status]}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{contact._count?.meetings || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
