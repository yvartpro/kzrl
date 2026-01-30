import Skeleton from './Skeleton';

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
    <div className="bg-gray-50 h-12 border-b border-gray-100" />
    <div className="p-4 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} variant="text" className={`h-6 ${j === 0 ? 'flex-[2]' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <Skeleton variant="text" className="w-24 h-4" />
          <Skeleton variant="circle" className="w-10 h-10" />
        </div>
        <Skeleton variant="text" className="w-32 h-8" />
        <Skeleton variant="text" className="w-48 h-3" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => {
  const heights = ['60%', '40%', '80%', '50%', '70%', '45%', '90%', '55%', '75%', '35%', '65%', '50%'];
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-80 flex items-end gap-2 px-8">
      {heights.map((height, i) => (
        <Skeleton
          key={i}
          variant="rect"
          className="flex-1 rounded-t-lg"
          style={{ height }}
        />
      ))}
    </div>
  );
};

export const FormSkeleton = ({ fields = 3 }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
    <div className="space-y-2">
      <Skeleton variant="text" className="w-1/4 h-4" />
      <Skeleton variant="text" className="w-full h-10" />
    </div>
    {Array.from({ length: fields - 1 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton variant="text" className="w-1/4 h-4" />
        <Skeleton variant="text" className="w-full h-10" />
      </div>
    ))}
    <Skeleton variant="text" className="w-full h-12 rounded-xl mt-4" />
  </div>
);
