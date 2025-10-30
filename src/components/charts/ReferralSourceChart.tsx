import { useEffect, useState } from "react";
import { PieChartComponent, PieChartDatum } from "./Charts";

export function ReferralSourceChart() {
  const [referralData, setReferralData] = useState<PieChartDatum[]>([]);
  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const response = await fetch("/api/referralMetrics", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          // If 404, no data yet - that's okay
          if (response.status === 404) {
            setReferralData([]);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.json();
        // Format data for pie chart: { label: string, value: number }[]
        const formattedData: PieChartDatum[] = rawData.map((item: any) => ({
          label: item.source || 'unknown',
          value: item.visitCount || 0,
        }));
        setReferralData(formattedData);
      } catch (error) {
        console.error("Error fetching referral source data:", error);
        setReferralData([]);
      }
    };
    fetchReferralData();
  }, []); // Fixed: Added dependency array

  return <PieChartComponent data={referralData} title="Referral Source Distribution" />;
}
