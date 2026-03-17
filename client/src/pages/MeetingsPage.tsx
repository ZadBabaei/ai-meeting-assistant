import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Meeting } from '../lib/api';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

export function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMeetings().then(setMeetings).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Meetings</h2>
        <Link
          to="/meetings/new"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Meeting
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No meetings yet</p>
          <p className="text-sm mt-1">Upload a transcript to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              to={`/meetings/${meeting.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(meeting.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {meeting.summary && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{meeting.summary}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {meeting.actionItems.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {meeting.actionItems.length} action items
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[meeting.status]}`}>
                    {meeting.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
