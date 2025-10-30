import { useState, useEffect } from 'react';
import { TimeSeriesChart, TimeSeriesData } from './Charts';

export type TimeSeriesDatum = {
  time: string;
  hour: number;
  averageVisits: number;
  averageSessionDuration: number;
  averageNetworkSpeed: number;
};

export function AverageMetricsChart() {
  const [averageMetrics, setAverageMetrics] = useState<TimeSeriesData>([]);
useEffect(() => {
  const fetchAverageMetrics = async () => {
    try {
      const response = await fetch("/api/averageMetrics", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      // Format data for TimeSeriesChart: { time: string, averageVisits: number }[]
      const formattedData: TimeSeriesData = rawData.map((item: { timestamp: string | Date; averageVisits?: number }) => ({
        time: new Date(item.timestamp).toISOString().split('T')[0],
        averageVisits: item.averageVisits || 0,
      }));
      setAverageMetrics(formattedData);
    } catch (error) {
      console.error("Error fetching average metrics:", error);
      setAverageMetrics([]);
    }
  };
  fetchAverageMetrics();
}, []);

  return <TimeSeriesChart data={averageMetrics} />;
}
