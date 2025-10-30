import { useEffect, useState } from 'react';
import { BrowserChart as Chart, BrowserData } from './Charts';

export function BrowserChart() {
  const [browserData, setBrowserData] = useState<BrowserData>([]);

  useEffect(() => {
    const fetchBrowserData = async () => {
      try {
        const response = await fetch("/api/browserMetrics", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          setBrowserData([]);
          return;
        }

        const data = await response.json();
        setBrowserData(data || []);
      } catch (error) {
        console.error("Error fetching browser data:", error);
        setBrowserData([]);
      }
    };

    fetchBrowserData();
  }, []);

  return <Chart data={browserData} />;
}

