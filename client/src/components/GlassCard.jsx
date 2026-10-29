export default function GlassCard({ children, className = '', strong = false, ...rest }) {
  return (
    <div className={`${strong ? 'glass-strong' : 'glass'} rounded-2xl shadow-glass ${className}`} {...rest}>
      {children}
    </div>
  );
}
