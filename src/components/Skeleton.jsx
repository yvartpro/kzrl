export default function Skeleton({ className = '', variant = 'text', count = 1 }) {
  const baseClasses = "animate-pulse bg-gray-200 rounded";

  const variants = {
    text: "h-4 w-full",
    title: "h-6 w-3/4 mb-4",
    circle: "rounded-full",
    rect: "h-32 w-full",
    card: "h-40 w-full rounded-2xl",
    tableRow: "h-12 w-full mb-2"
  };

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${variants[variant] || ''} ${className}`}
        />
      ))}
    </>
  );
}
