import { useEffect, useState } from "react";
import { PieChartComponent, PieChartDatum } from "./Charts";
import { safeFetch } from "@/utils/safeFetch";

export function DeviceTypeChart() {
  const [deviceMetrics, setDeviceMetrics] = useState<PieChartDatum[]>([]);

  useEffect(() => {
    safeFetch<PieChartDatum[]>('/api/deviceMetrics')
      .then(data => data && setDeviceMetrics(data));
  }, []);

  return <PieChartComponent data={deviceMetrics} title="Device Type Distribution" />;
}
