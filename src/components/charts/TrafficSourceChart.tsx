import { useState, useEffect } from "react";
import { PieChartComponent, PieChartDatum } from "./Charts";


export function TrafficSourceChart() {
  const [trafficPatterns, setTrafficPatterns] = useState<PieChartDatum[]>([]);
  useEffect(() => {
    const fetchTrafficSources = async () => {
      try {
        const response = await fetch("/api/trafficSources", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setTrafficPatterns(data);
      } catch (error) {
        // setError("Failed to fetch traffic source data.");
        console.error("Error fetching traffic source data:", error);
      }
    };

    fetchTrafficSources();
  }, []);

  console.log("trafficPatterns", trafficPatterns);
  

  return <PieChartComponent data={trafficPatterns} title="Traffic Source Breakdown" />;
}
