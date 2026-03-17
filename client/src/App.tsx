function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            Meeting Assistant
          </h1>
          <div className="flex gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-900">Meetings</a>
            <a href="#" className="hover:text-gray-900">Contacts</a>
            <a href="#" className="hover:text-gray-900">Pipeline</a>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-gray-500">Welcome to AI Meeting Assistant</p>
      </main>
    </div>
  );
}

export default App;
