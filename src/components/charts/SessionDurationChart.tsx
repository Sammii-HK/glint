import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { safeFetch } from '@/utils/safeFetch';

type SessionDurationData = { time: string; averageSessionDuration: number }[];


export function SessionDurationChart() {
  const [sessionDuration, setSessionDuration] = useState<SessionDurationData>([]);

  useEffect(() => {
    safeFetch<SessionDurationData>('/api/sessionDuration')
      .then(data => data && setSessionDuration(data));
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={sessionDuration}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="averageSessionDuration" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}
