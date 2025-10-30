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
        // Format and aggregate data for pie chart
        type AggregatedItem = { label: string; value: number };
        const aggregated = rawData.reduce((acc: AggregatedItem[], item: { source?: string; visitCount?: number }) => {
          const source = item.source || 'unknown';
          const existing = acc.find((d: AggregatedItem) => d.label === source);
          if (existing) {
            existing.value += item.visitCount || 0;
          } else {
            acc.push({ label: source, value: item.visitCount || 0 });
          }
          return acc;
        }, []);

        // Sort by value and take top items
        const sorted = aggregated.sort((a: AggregatedItem, b: AggregatedItem) => b.value - a.value);
        setReferralData(sorted);
      } catch (error) {
        console.error("Error fetching referral source data:", error);
        setReferralData([]);
      }
    };
    fetchReferralData();
  }, []); // Fixed: Added dependency array

  return <PieChartComponent data={referralData} title="Referral Source Distribution" />;
}
