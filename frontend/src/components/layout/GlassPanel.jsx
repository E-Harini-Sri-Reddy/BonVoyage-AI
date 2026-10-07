export default function GlassPanel({ children, className = '', as: Component = 'div', ...props }) {
  return (
    <Component className={`glass-panel ${className}`} {...props}>
      {children}
    </Component>
  );
}
