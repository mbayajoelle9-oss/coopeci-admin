export default function QuickStat({ icon: Icon, tone = 'azure', label, value }) {
  return (
    <div className="qstat">
      <div className={`qstat-ico ${tone}`}>
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div>
        <div className="qstat-label">{label}</div>
        <div className="qstat-value tnum">{value}</div>
      </div>
    </div>
  );
}
