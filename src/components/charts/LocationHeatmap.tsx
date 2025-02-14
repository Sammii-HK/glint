import { useEffect, useState } from "react";
import { Heatmap, HeatmapData } from "./Heatmap";
import { safeFetch } from "@/utils/safeFetch";

export type LocationHeatmapData = { latitude: number; longitude: number; visitCount: number }[];

export function LocationHeatmap() {
  const [locationData, setLocationData] = useState<HeatmapData>([]);
useEffect(() => {
  safeFetch<HeatmapData>('/api/locationMetrics')
    .then(data => data && setLocationData(data));
}, []);

  return <Heatmap data={locationData} title="User Location Heatmap" />;
}
