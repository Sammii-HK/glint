import { useEffect, useState } from "react";
import { CountryBarChart, CountryData } from "./Charts";

export function LocationHeatmap() {
  const [locationData, setLocationData] = useState<CountryData>([]);

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await fetch("/api/locationMetrics", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setLocationData([]);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.json();
        const formattedData: CountryData = rawData.map((item: { country: string; visitCount: number }) => ({
          country: item.country || 'unknown',
          visitCount: item.visitCount || 0,
        }));
        
        setLocationData(formattedData);
      } catch (error) {
        console.error("Error fetching location data:", error);
        setLocationData([]);
      }
    };

    fetchLocationData();
  }, []);

  return <CountryBarChart data={locationData} />;
}
