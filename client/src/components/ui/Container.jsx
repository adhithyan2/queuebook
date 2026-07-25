export default function Container({ children, className = '' }) {
  return (
    <div className={`max-w-[1400px] mx-auto px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
