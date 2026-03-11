export default function ComingSoon({ icon, title, description, features, port }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div className="text-6xl mb-5">{icon}</div>
      <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-3 py-1 font-semibold mb-4">
        ðŸš§ Under Development
      </span>
      <h2 className="text-2xl font-bold text-gray-800 mb-3">{title}</h2>
      <p className="text-gray-500 text-sm max-w-lg leading-relaxed">{description}</p>

      {features && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg w-full">
          {features.map(f => (
            <div
              key={f.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-1.5">{f.icon}</div>
              <p className="text-xs text-gray-600 font-medium">{f.label}</p>
            </div>
          ))}
        </div>
      )}

      {port && (
        <p className="mt-6 text-xs text-gray-400">
          This service will run on port{' '}
          <code className="bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 font-mono">:{port}</code>
        </p>
      )}
    </div>
  );
}
