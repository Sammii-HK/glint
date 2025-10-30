import { useEffect, useState } from 'react';
import { SessionDurationChart as Chart, SessionDurationData } from './Charts';

export function SessionDurationChart() {
  const [sessionData, setSessionData] = useState<SessionDurationData>([]);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await fetch("/api/sessionDuration", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          setSessionData([]);
          return;
        }

        const rawData = await response.json();
        const formattedData: SessionDurationData = rawData.map((item: { time: string | Date; duration?: number; averageSessionDuration?: number }) => ({
          time: new Date(item.time || item.time).toISOString().split('T')[0],
          duration: item.duration || item.averageSessionDuration || 0,
        }));
        
        setSessionData(formattedData);
      } catch (error) {
        console.error("Error fetching session duration data:", error);
        setSessionData([]);
      }
    };

    fetchSessionData();
  }, []);

  return <Chart data={sessionData} />;
}
