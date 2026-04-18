import { useState, useMemo } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getDashboardStats } from 'wasp/client/operations';
import { Link } from 'react-router-dom';
import { RoleGuard } from '../../shared/components/RoleGuard';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const fmtVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + 'đ';
const fmtNum = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
const fmtMillions = (v: number) => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  return fmtNum(v);
};

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

// Colors matching existing theme
const FUEL_COLOR = '#2563EB';     // blue
const REPAIR_COLOR = '#F97316';   // orange
const FUEL_LIGHT = '#DBEAFE';
const REPAIR_LIGHT = '#FED7AA';

// ────────────────────────────────────────────────────────────────────────────
// Custom Tooltip
// ────────────────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-heading font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {fmtVND(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// KPI Card
// ────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function KpiCard({ label, value, sub, icon, color, bgColor }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-heading font-bold text-gray-900 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColor}`}>
          <span className={`text-lg ${color}`}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────

export const FuelRepairDashboardPage = () => {
  // Filters
  const [filterMode, setFilterMode] = useState<'month' | 'range'>('month');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeUnconfirmed, setIncludeUnconfirmed] = useState(false);

  // Compute query filters
  const queryFilters = useMemo(() => {
    if (filterMode === 'month') {
      const from = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const to = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;
      return { dateFrom: from, dateTo: to, includeUnconfirmed };
    }
    return {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      includeUnconfirmed,
    };
  }, [filterMode, selectedYear, selectedMonth, dateFrom, dateTo, includeUnconfirmed]);

  const { data, isLoading, error } = useQuery(getDashboardStats, queryFilters);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <RoleGuard allowedRoles={['ADMIN', 'ACCOUNTING']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-heading font-bold text-gray-900">Dashboard Chi phí</h1>
                <p className="text-gray-600 text-sm mt-1">Tổng hợp tình hình đổ dầu & sửa chữa</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Quick links */}
                <Link to="/fuel" className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
                  ⛽ Phiếu Dầu
                </Link>
                <Link to="/repair" className="px-3 py-1.5 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg hover:bg-orange-100 transition-colors">
                  🔧 Phiếu SC
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* ─── Filter Panel ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-wrap items-end gap-4">
              {/* Mode toggle */}
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setFilterMode('month')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filterMode === 'month' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >Theo tháng</button>
                <button
                  onClick={() => setFilterMode('range')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filterMode === 'range' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >Khoảng ngày</button>
              </div>

              {filterMode === 'month' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Năm</label>
                    <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                      {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tháng</label>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                      {MONTHS.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                  </div>
                </>
              )}

              {/* Include unconfirmed */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includeUnconfirmed} onChange={e => setIncludeUnconfirmed(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-600">Gồm chưa duyệt</span>
              </label>
            </div>
          </div>

          {/* ─── Loading / Error States ───────────────────────────────────── */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">{error.message}</div>
          )}

          {data && (
            <>
              {/* ─── KPI Cards ─────────────────────────────────────────────── */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KpiCard
                  label="Tổng tiền dầu"
                  value={fmtMillions(data.kpi.fuelTotal)}
                  sub={`${fmtNum(data.kpi.fuelCount)} phiếu`}
                  icon="⛽"
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                />
                <KpiCard
                  label="Tổng tiền SC"
                  value={fmtMillions(data.kpi.repairTotal)}
                  sub={`${fmtNum(data.kpi.repairCount)} phiếu`}
                  icon="🔧"
                  color="text-orange-600"
                  bgColor="bg-orange-50"
                />
                <KpiCard
                  label="Tổng chi phí"
                  value={fmtMillions(data.kpi.totalSpending)}
                  sub="Dầu + Sửa chữa"
                  icon="💰"
                  color="text-primary-600"
                  bgColor="bg-primary-50"
                />
                <KpiCard
                  label="Tổng lít dầu"
                  value={fmtNum(data.kpi.fuelLiters)}
                  sub="L"
                  icon="🛢️"
                  color="text-cyan-600"
                  bgColor="bg-cyan-50"
                />
                <KpiCard
                  label="Số phiếu SC"
                  value={String(data.kpi.repairCount)}
                  sub="phiếu sửa chữa"
                  icon="📋"
                  color="text-amber-600"
                  bgColor="bg-amber-50"
                />
                <KpiCard
                  label="Giá dầu TB"
                  value={fmtVND(Math.round(data.kpi.fuelAvgPrice))}
                  sub="đ/L"
                  icon="📊"
                  color="text-indigo-600"
                  bgColor="bg-indigo-50"
                />
              </div>

              {/* ─── Top Vehicles ──────────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Fuel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-heading font-semibold text-gray-900">⛽ Top xe chi phí dầu</h2>
                  </div>
                  <div className="p-4">
                    {data.topVehiclesFuel.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.topVehiclesFuel} layout="vertical" margin={{ left: 20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickFormatter={fmtMillions} tick={{ fontSize: 11 }} />
                          <YAxis dataKey="licensePlate" type="category" width={90} tick={{ fontSize: 11 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="total" name="Chi phí dầu" fill={FUEL_COLOR} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-12 text-gray-400 text-sm">Chưa có dữ liệu</div>
                    )}
                    {/* Clickable table below chart */}
                    {data.topVehiclesFuel.length > 0 && (
                      <div className="mt-4 border-t pt-3">
                        {data.topVehiclesFuel.slice(0, 5).map((v: any, i: number) => (
                          <Link key={v.licensePlate}
                            to={`/fuel?vehicle=${encodeURIComponent(v.licensePlate)}`}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors text-sm group">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                              <span className="font-medium text-gray-800 group-hover:text-blue-700">{v.licensePlate}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-gray-900">{fmtVND(v.total)}</span>
                              <span className="text-gray-400 text-xs ml-2">({v.count} phiếu)</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Repair */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-heading font-semibold text-gray-900">🔧 Top xe chi phí sửa chữa</h2>
                  </div>
                  <div className="p-4">
                    {data.topVehiclesRepair.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.topVehiclesRepair} layout="vertical" margin={{ left: 20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickFormatter={fmtMillions} tick={{ fontSize: 11 }} />
                          <YAxis dataKey="licensePlate" type="category" width={90} tick={{ fontSize: 11 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="total" name="Chi phí SC" fill={REPAIR_COLOR} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-12 text-gray-400 text-sm">Chưa có dữ liệu</div>
                    )}
                    {data.topVehiclesRepair.length > 0 && (
                      <div className="mt-4 border-t pt-3">
                        {data.topVehiclesRepair.slice(0, 5).map((v: any, i: number) => (
                          <Link key={v.licensePlate}
                            to={`/repair?vehicle=${encodeURIComponent(v.licensePlate)}`}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-orange-50 transition-colors text-sm group">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                              <span className="font-medium text-gray-800 group-hover:text-orange-700">{v.licensePlate}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-gray-900">{fmtVND(v.total)}</span>
                              <span className="text-gray-400 text-xs ml-2">({v.count} phiếu)</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Trend Charts ──────────────────────────────────────────── */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-heading font-semibold text-gray-900">📈 Xu hướng chi phí theo tháng</h2>
                </div>
                <div className="p-4">
                  {(data.fuelTrend.length > 0 || data.repairTrend.length > 0) ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart
                        data={mergeTrends(data.fuelTrend, data.repairTrend)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={fmtMillions} tick={{ fontSize: 11 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="fuelTotal" name="Dầu" stroke={FUEL_COLOR} strokeWidth={2.5}
                          dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="repairTotal" name="Sửa chữa" stroke={REPAIR_COLOR} strokeWidth={2.5}
                          dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-400 text-sm">Chưa có dữ liệu xu hướng</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Merge fuel + repair trends into a single dataset for combined chart
// ────────────────────────────────────────────────────────────────────────────

function mergeTrends(
  fuelTrend: Array<{ month: string; total: number }>,
  repairTrend: Array<{ month: string; total: number }>,
) {
  const map = new Map<string, { month: string; fuelTotal: number; repairTotal: number }>();

  for (const f of fuelTrend) {
    if (!map.has(f.month)) map.set(f.month, { month: f.month, fuelTotal: 0, repairTotal: 0 });
    map.get(f.month)!.fuelTotal = f.total;
  }

  for (const r of repairTrend) {
    if (!map.has(r.month)) map.set(r.month, { month: r.month, fuelTotal: 0, repairTotal: 0 });
    map.get(r.month)!.repairTotal = r.total;
  }

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}
export default FuelRepairDashboardPage;
