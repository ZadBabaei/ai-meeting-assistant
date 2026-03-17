import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

type InputMode = 'transcript' | 'audio';

export function NewMeetingPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [mode, setMode] = useState<InputMode>('transcript');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      if (mode === 'audio' && audioFile) {
        const meeting = await api.uploadAudio(title.trim(), audioFile);
        navigate(`/meetings/${meeting.id}`);
      } else {
        const meeting = await api.createMeeting({
          title: title.trim(),
          transcript: transcript.trim() || undefined,
        });
        navigate(`/meetings/${meeting.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      setMode('transcript');
      const reader = new FileReader();
      reader.onload = (ev) => setTranscript(ev.target?.result as string);
      reader.readAsText(file);
    } else if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|webm|mp4)$/i.test(file.name)) {
      setMode('audio');
      setAudioFile(file);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">New Meeting</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meeting Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Q1 Portfolio Review with John Smith"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            required
          />
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('transcript')}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              mode === 'transcript'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Paste Transcript
          </button>
          <button
            type="button"
            onClick={() => setMode('audio')}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              mode === 'audio'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Upload Audio
          </button>
        </div>

        {mode === 'transcript' ? (
          <div>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative"
            >
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste your meeting transcript here, or drag and drop a .txt file..."
                rows={16}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-mono text-sm"
              />
              {!transcript && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-gray-400">
                    <p className="text-4xl mb-2">📄</p>
                    <p className="text-sm">Drag & drop a .txt file</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
          >
            {audioFile ? (
              <div>
                <p className="text-sm text-gray-700 font-medium">{audioFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
                <button
                  type="button"
                  onClick={() => setAudioFile(null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-2">🎙️</p>
                <p className="text-sm text-gray-500 mb-3">
                  Drag & drop an audio file, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Supports MP3, WAV, M4A, WebM, MP4 (max 25MB)
                </p>
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.webm,.mp4"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Meeting'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
