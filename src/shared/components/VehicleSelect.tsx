import { useState, useRef, useEffect, useCallback } from 'react';

interface Vehicle {
  id: string;
  licensePlate: string;
  vehicleType: 'TRACTOR' | 'TRAILER';
  company: string;
  status: string;
}

interface VehicleSelectProps {
  value: string;
  onChange: (id: string) => void;
  vehicles: Vehicle[];
  placeholder?: string;
  className?: string;
  /** true = show only tractors, false = show only trailers, undefined = show all */
  defaultTypeFilter?: 'TRACTOR' | 'TRAILER' | 'ALL';
}

const companyLabel = (c: string) => {
  if (c === 'KHANH_HUY') return 'KH';
  if (c === 'RENTAL') return 'Thuê';
  return 'UC';
};

const typeLabel = (t: string) => (t === 'TRACTOR' ? 'Đầu kéo' : 'Mooc');
const typeColor = (t: string) =>
  t === 'TRACTOR'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-purple-100 text-purple-700';

const statusColor = (s: string) =>
  s === 'IN_USE'
    ? 'bg-green-100 text-green-700'
    : s === 'MAINTENANCE'
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';

export const VehicleSelect = ({
  value,
  onChange,
  vehicles,
  placeholder = '-- Chọn xe --',
  className = '',
  defaultTypeFilter = 'ALL',
}: VehicleSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'TRACTOR' | 'TRAILER'>(
    defaultTypeFilter ?? 'ALL'
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = vehicles.find((v) => v.id === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = vehicles.filter((v) => {
    const matchType = typeFilter === 'ALL' || v.vehicleType === typeFilter;
    const matchSearch =
      !search ||
      v.licensePlate.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleSelect = useCallback(
    (id: string) => {
      onChange(id);
      setOpen(false);
      setSearch('');
    },
    [onChange]
  );

  const handleClear = (e: any) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <span
              className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${typeColor(selected.vehicleType)}`}
            >
              {typeLabel(selected.vehicleType)}
            </span>
            <span className="font-medium text-gray-900 truncate">{selected.licensePlate}</span>
            <span className="text-xs text-gray-400">{companyLabel(selected.company)}</span>
          </span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {selected && (
            <span
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 cursor-pointer text-base leading-none"
              title="Xóa"
            >
              ×
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Tìm theo biển số..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Type filter tabs */}
          <div className="flex gap-1 p-2 border-b border-gray-100">
            {(['ALL', 'TRACTOR', 'TRAILER'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                  typeFilter === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'ALL' ? 'Tất cả' : t === 'TRACTOR' ? '🚛 Đầu kéo' : '🔧 Mooc'}
              </button>
            ))}
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-50"
            >
              {placeholder}
            </button>
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                Không tìm thấy xe nào
              </div>
            ) : (
              filtered.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelect(v.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 transition-colors ${
                    v.id === value ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${typeColor(v.vehicleType)}`}>
                    {typeLabel(v.vehicleType)}
                  </span>
                  <span className="text-sm font-medium text-gray-900 flex-1">{v.licensePlate}</span>
                  <span className="text-xs text-gray-400 shrink-0">{companyLabel(v.company)}</span>
                  <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${statusColor(v.status)}`}>
                    {v.status === 'IN_USE' ? '✓' : v.status === 'MAINTENANCE' ? '🔧' : '✗'}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="px-3 py-1.5 border-t border-gray-100 text-xs text-gray-400 text-right">
            {filtered.length} xe
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleSelect;
