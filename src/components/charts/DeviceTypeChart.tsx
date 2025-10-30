import { useEffect, useState } from "react";
import { PieChartComponent, PieChartDatum } from "./Charts";

export function DeviceTypeChart() {
  const [deviceMetrics, setDeviceMetrics] = useState<PieChartDatum[]>([]);

  useEffect(() => {
    // fetch<PieChartDatum[]>('/api/deviceMetrics')
    // fetch('/api/deviceMetrics')
    //   .then(data => data && setDeviceMetrics(data));

    const fetchDeviceMetrics = async () => {
      try {
        const response = await fetch("/api/deviceMetrics", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        console.log("response", response);
        

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log("data", data);
        
        setDeviceMetrics(data);
      } catch (error) {
        console.error("Error fetching device metrics:", error);
      }
    };

    fetchDeviceMetrics();
  }, []); // Fixed: Added dependency array to prevent infinite loop

  return <PieChartComponent data={deviceMetrics} title="Device Type Distribution" />;
}
