const DashboardStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90">{stat.label}</div>
          <div className="text-4xl font-bold mt-2">{stat.value}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
