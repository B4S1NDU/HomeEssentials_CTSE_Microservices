export default function StatCard({ title, value, icon: Icon, color = 'indigo', trend, sub }) {
  const colors = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'bg-indigo-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: 'bg-yellow-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className={`rounded-2xl p-5 ${c.bg} border border-white/60 shadow-sm flex items-start gap-4`}>
      {Icon && (
        <div className={`p-3 rounded-xl ${c.icon}`}>
          <Icon size={22} className={c.text} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-bold mt-0.5 ${c.text}`}>{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
