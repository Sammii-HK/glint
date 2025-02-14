import { useState, useEffect } from "react";
import { PieChartComponent, PieChartDatum } from "./Charts";
import { safeFetch } from "@/utils/safeFetch";


export function TrafficSourceChart() {
  const [trafficPatterns, setTrafficPatterns] = useState<PieChartDatum[]>([]);
useEffect(() => {
  safeFetch<PieChartDatum[]>('/api/trafficPatterns')
    .then(data => data && setTrafficPatterns(data));
}, []);

  return <PieChartComponent data={trafficPatterns} title="Traffic Source Breakdown" />;
}
