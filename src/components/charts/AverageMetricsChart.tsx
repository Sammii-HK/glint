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

      const data = await response.json();
      setAverageMetrics(data);
    } catch (error) {
      console.error("Error fetching average metrics:", error);
    }
  };
  fetchAverageMetrics();
}, []);
  console.log("averageMetrics", averageMetrics);

  return <TimeSeriesChart data={averageMetrics} />;
}
