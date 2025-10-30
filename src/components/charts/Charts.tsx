// Enhanced Analytics Chart Components with Beautiful Styling
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from 'recharts';

// Modern, vibrant color palette for maximum contrast
export const CHART_COLORS = {
  primary: '#3b82f6',      // Blue
  secondary: '#10b981',    // Green
  accent: '#f59e0b',       // Amber
  danger: '#ef4444',       // Red
  purple: '#8b5cf6',       // Purple
  teal: '#14b8a6',         // Teal
  pink: '#ec4899',         // Pink
  indigo: '#6366f1',       // Indigo
  cyan: '#06b6d4',         // Cyan
  orange: '#f97316',       // Orange
  gradient: {
    start: '#3b82f6',
    end: '#8b5cf6',
  },
};

const COLORS_ARRAY = [
  '#3b82f6',  // Blue
  '#10b981',  // Green
  '#f59e0b',  // Amber
  '#8b5cf6',  // Purple
  '#ef4444',  // Red
  '#14b8a6',  // Teal
  '#ec4899',  // Pink
  '#6366f1',  // Indigo
  '#06b6d4',  // Cyan
  '#f97316',  // Orange
];

// Time Series Line Chart
export type TimeSeriesData = { time: string; averageVisits: number }[];
export function TimeSeriesChart({ data }: { data: TimeSeriesData }) {
  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-xl font-semibold mb-4 text-white">Average Visits Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 11, fontWeight: 500 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
            label={{ value: 'Visits', angle: -90, position: 'insideLeft', fill: '#e5e7eb', style: { fontSize: '14px' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #4b5563',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              padding: '10px'
            }}
            labelStyle={{ color: '#e5e7eb', fontWeight: 600 }}
          />
          <Legend 
            wrapperStyle={{ color: '#e5e7eb', fontSize: '14px' }}
          />
          <Area 
            type="monotone" 
            dataKey="averageVisits" 
            stroke={CHART_COLORS.primary} 
            fillOpacity={0.6}
            fill="url(#visitsGradient)"
          />
          <Line 
            type="monotone" 
            dataKey="averageVisits" 
            stroke={CHART_COLORS.primary}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS.primary, r: 4, strokeWidth: 2, stroke: '#1f2937' }}
            activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Session Duration Area Chart
export type SessionDurationData = { time: string; duration: number }[];
export function SessionDurationChart({ data }: { data: SessionDurationData }) {
  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-xl font-semibold mb-4 text-white">Session Duration (seconds)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 11, fontWeight: 500 }}
          />
          <YAxis 
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
            label={{ value: 'Seconds', angle: -90, position: 'insideLeft', fill: '#e5e7eb', style: { fontSize: '14px' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #4b5563',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              padding: '10px'
            }}
            labelStyle={{ color: '#e5e7eb', fontWeight: 600 }}
          />
          <Area 
            type="monotone" 
            dataKey="duration" 
            stroke={CHART_COLORS.secondary}
            strokeWidth={3}
            fill="url(#sessionGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pie Chart Component
export type PieChartDatum = {
  label: string;
  value: number;
};
type PieChartProps = {
  data: PieChartDatum[];
  title: string;
};
export function PieChartComponent({ data, title }: PieChartProps) {
  // Aggregate and limit to top 8 items to avoid clutter
  const aggregated = data.reduce((acc, item) => {
    const existing = acc.find(d => d.label === item.label);
    if (existing) {
      existing.value += item.value;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as PieChartDatum[]);

  const sorted = aggregated.sort((a, b) => b.value - a.value);
  const topItems = sorted.slice(0, 8);
  const othersTotal = sorted.slice(8).reduce((sum, item) => sum + item.value, 0);
  
  const displayData = othersTotal > 0 
    ? [...topItems, { label: 'Others', value: othersTotal }]
    : topItems;

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={displayData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={90}
            labelLine={false}
            label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
          >
            {displayData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS_ARRAY[index % COLORS_ARRAY.length]}
                stroke="#1f2937"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px'
            }}
            formatter={(value: number) => [value, 'Visits']}
          />
          <Legend 
            wrapperStyle={{ color: '#e5e7eb', fontSize: '14px' }}
            formatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Bar Chart Component
export type BarChartData = { name: string; value: number }[];
type BarChartProps = {
  data: BarChartData;
  title: string;
  dataKey?: string;
};
export function BarChartComponent({ data, title, dataKey = 'value' }: BarChartProps) {
  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 11, fontWeight: 500 }}
          />
          <YAxis 
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #4b5563',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              padding: '10px'
            }}
            labelStyle={{ color: '#e5e7eb', fontWeight: 600 }}
          />
          <Bar 
            dataKey={dataKey} 
            fill={CHART_COLORS.primary}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Country Distribution Bar Chart
export type CountryData = { country: string; visitCount: number }[];
export function CountryBarChart({ data }: { data: CountryData }) {
  // Aggregate by country
  const aggregated = data.reduce((acc, item) => {
    const existing = acc.find(c => c.country === item.country);
    if (existing) {
      existing.visitCount += item.visitCount;
    } else {
      acc.push({ country: item.country, visitCount: item.visitCount });
    }
    return acc;
  }, [] as CountryData);

  const sorted = aggregated.sort((a, b) => b.visitCount - a.visitCount).slice(0, 10);

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-xl font-semibold mb-4 text-white">Top Countries by Visits</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            type="number"
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
            label={{ value: 'Visits', position: 'insideBottom', offset: -5, fill: '#e5e7eb', style: { fontSize: '14px' } }}
          />
          <YAxis 
            type="category"
            dataKey="country"
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
            width={80}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #4b5563',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              padding: '10px'
            }}
            labelStyle={{ color: '#e5e7eb', fontWeight: 600 }}
          />
          <Bar 
            dataKey="visitCount" 
            fill={CHART_COLORS.secondary}
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Hourly Traffic Pattern Chart
export type HourlyData = { hour: number; visits: number }[];
export function HourlyTrafficChart({ data }: { data: HourlyData }) {
  // Data should already be aggregated by hour (0-23)
  const formatted = data.map(item => ({
    hour: item.hour,
    visits: item.visits,
  }));

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-xl font-semibold mb-4 text-white">Visits by Hour of Day</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="hour" 
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
            label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5, fill: '#e5e7eb', style: { fontSize: '14px' } }}
          />
          <YAxis 
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
            label={{ value: 'Visits', angle: -90, position: 'insideLeft', fill: '#e5e7eb', style: { fontSize: '14px' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #4b5563',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              padding: '10px'
            }}
            labelStyle={{ color: '#e5e7eb', fontWeight: 600 }}
          />
          <Bar dataKey="visits" fill={CHART_COLORS.accent} radius={[8, 8, 0, 0]} opacity={0.8} />
          <Line 
            type="monotone" 
            dataKey="visits" 
            stroke={CHART_COLORS.primary}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS.primary, r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Browser Distribution Chart
export type BrowserData = { browser: string; count: number }[];
export function BrowserChart({ data }: { data: BrowserData }) {
  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-xl font-semibold mb-4 text-white">Browser Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="browser" 
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
          />
          <YAxis 
            stroke="#d1d5db"
            tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#e5e7eb', style: { fontSize: '14px' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #4b5563',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              padding: '10px'
            }}
            labelStyle={{ color: '#e5e7eb', fontWeight: 600 }}
          />
          <Bar dataKey="count" fill={CHART_COLORS.purple} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
