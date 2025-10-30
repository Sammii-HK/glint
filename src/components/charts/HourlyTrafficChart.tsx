import { useEffect, useState } from 'react';
import { HourlyTrafficChart as Chart, HourlyData } from './Charts';

export function HourlyTrafficChart() {
  const [hourlyData, setHourlyData] = useState<HourlyData>([]);

  useEffect(() => {
    const fetchHourlyData = async () => {
      try {
        const response = await fetch("/api/hourlyMetrics", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          setHourlyData([]);
          return;
        }

        const rawData = await response.json();
        const formattedData: HourlyData = rawData.map((item: { hour: number; visits: number }) => ({
          hour: item.hour,
          visits: item.visits || 0,
        }));
        setHourlyData(formattedData);
      } catch (error) {
        console.error("Error fetching hourly data:", error);
        setHourlyData([]);
      }
    };

    fetchHourlyData();
  }, []);

  return <Chart data={hourlyData} />;
}

