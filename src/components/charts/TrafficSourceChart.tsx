import { useState, useEffect } from "react";
import { PieChartComponent, PieChartDatum } from "./Charts";
import { TrafficSource } from "@/app/api/trafficSources/route";


export function TrafficSourceChart() {
  const [trafficSources, setTrafficSources] = useState<PieChartDatum[]>([]);
  useEffect(() => {
    const fetchTrafficSources = async () => {
      try {
        const response = await fetch("/api/trafficSources", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data: TrafficSource[] = await response.json();
        // Data is already formatted by API as { label, value }
        setTrafficSources(data || []);
      } catch (error) {
        console.error("Error fetching traffic source data:", error);
        setTrafficSources([]); // Set empty array on error
      }
    };

    fetchTrafficSources();
  }, []);
  

  return <PieChartComponent data={trafficSources} title="Traffic Source Breakdown" />;
}
