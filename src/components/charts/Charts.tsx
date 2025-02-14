// All Analytics Chart Components with Typed Data (Next.js + Recharts)
// ================================================

import {
  ResponsiveContainer,
  LineChart,
  Line,
  // BarChart,
  // Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';

export type TimeSeriesData = { time: string; averageVisits: number }[];
export function TimeSeriesChart({ data }: { data: TimeSeriesData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="averageVisits" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export type SessionDurationData = { time: string; averageSessionDuration: number }[];
// export function SessionDurationChart({ data }: { data: SessionDurationData }) {
//   return (
//     <ResponsiveContainer width="100%" height={300}>
//       <BarChart data={data}>
//         <XAxis dataKey="time" />
//         <YAxis />
//         <Tooltip />
//         <Bar dataKey="averageSessionDuration" fill="#8884d8" />
//       </BarChart>
//     </ResponsiveContainer>
//   );
// }

// export type DeviceTypeData = { deviceType: string; percentage: number }[];
// export function DeviceTypePieChart({ data }: { data: DeviceTypeData }) {
//   return (
//     <ResponsiveContainer width="100%" height={300}>
//       <PieChart>
//         <Pie data={data} dataKey="percentage" nameKey="deviceType" fill="#82ca9d" label />
//       </PieChart>
//     </ResponsiveContainer>
//   );
// }

export type TrafficPatternData = { hour: number; dayOfWeek: string; visitCount: number }[];
export function TrafficPatternScatterChart({ data }: { data: TrafficPatternData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
        <CartesianGrid />
        <XAxis type="number" dataKey="hour" name="Hour" />
        <YAxis type="category" dataKey="dayOfWeek" name="Day" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter name="Visits" data={data} fill="#82ca9d" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export type ReferralSourceData = { source: string; visitCount: number }[];
export function ReferralSourcePieChart({ data }: { data: ReferralSourceData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="visitCount" nameKey="source" fill="#ffc658" label />
      </PieChart>
    </ResponsiveContainer>
  );
}

export type PieChartDatum = {
  label: string;
  value: number;
};
type PieChartProps = {
  data: PieChartDatum[];
  title: string;
};
export function PieChartComponent({ data, title }: PieChartProps) {
  return (
    <div>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie dataKey="value" nameKey="label" data={data} fill="#82ca9d" label />
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
