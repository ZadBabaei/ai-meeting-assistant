import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type MeetingDetail } from '../lib/api';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const actionStatusColors: Record<string, string> = {
  TODO: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
};

const crmStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-600',
};

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchMeeting = () => {
    if (!id) return;
    api.getMeeting(id).then(setMeeting).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  // Poll while processing
  useEffect(() => {
    if (meeting?.status !== 'PROCESSING') return;
    const interval = setInterval(fetchMeeting, 3000);
    return () => clearInterval(interval);
  }, [meeting?.status]);

  const handleProcess = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      await api.processMeeting(id);
      setMeeting((prev) => prev ? { ...prev, status: 'PROCESSING' } : prev);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Meeting not found</p>
        <Link to="/" className="text-indigo-600 text-sm mt-2 inline-block">Back to meetings</Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
        &larr; Back to meetings
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{meeting.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(meeting.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[meeting.status]}`}>
            {meeting.status}
          </span>
          {meeting.status === 'PENDING' && meeting.transcript && (
            <button
              onClick={handleProcess}
              disabled={processing}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {processing ? 'Starting...' : 'Process with AI'}
            </button>
          )}
        </div>
      </div>

      {meeting.status === 'PROCESSING' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-blue-800">AI is analyzing this transcript...</p>
        </div>
      )}

      {meeting.summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Summary</h3>
          <p className="text-gray-800">{meeting.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Action Items */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Action Items ({meeting.actionItems.length})
          </h3>
          {meeting.actionItems.length === 0 ? (
            <p className="text-sm text-gray-400">No action items extracted</p>
          ) : (
            <ul className="space-y-3">
              {meeting.actionItems.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${actionStatusColors[item.status]}`}>
                    {item.status}
                  </span>
                  <div>
                    <p className="text-sm text-gray-800">{item.description}</p>
                    <div className="flex gap-3 mt-1">
                      {item.assignee && (
                        <span className="text-xs text-gray-500">Assignee: {item.assignee}</span>
                      )}
                      {item.dueDate && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* CRM Changes */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            CRM Field Changes ({meeting.crmChanges.length})
          </h3>
          {meeting.crmChanges.length === 0 ? (
            <p className="text-sm text-gray-400">No CRM changes detected</p>
          ) : (
            <ul className="space-y-3">
              {meeting.crmChanges.map((change) => (
                <li key={change.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{change.fieldName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${crmStatusColors[change.status]}`}>
                      {change.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {change.oldValue && (
                      <>
                        <span className="text-red-600 line-through">{change.oldValue}</span>
                        <span className="text-gray-400">&rarr;</span>
                      </>
                    )}
                    <span className="text-green-700 font-medium">{change.newValue}</span>
                  </div>
                  {change.contact && (
                    <p className="text-xs text-gray-500 mt-1">Contact: {change.contact.name}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Follow-up Email */}
      {meeting.followUpEmail && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Follow-up Email Draft
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-gray-500">To:</span>
              <span className="text-sm text-gray-800">{meeting.followUpEmail.to.join(', ')}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-gray-500">Subject:</span>
              <span className="text-sm text-gray-800 font-medium">{meeting.followUpEmail.subject}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{meeting.followUpEmail.body}</pre>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(meeting.followUpEmail!.body)}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-300 rounded-md hover:bg-indigo-50 transition-colors"
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      )}

      {/* Transcript */}
      {meeting.transcript && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Transcript
          </h3>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
            {meeting.transcript}
          </pre>
        </div>
      )}
    </div>
  );
}
