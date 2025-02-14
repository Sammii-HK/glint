import { useEffect, useState } from "react";
import { PieChartComponent, PieChartDatum } from "./Charts";
import { safeFetch } from "@/utils/safeFetch";

export function ReferralSourceChart() {
  const [referralData, setReferralData] = useState<PieChartDatum[]>([]);
  useEffect(() => {
    safeFetch<PieChartDatum[]>('/api/referralMetrics')
      .then(data => data && setReferralData(data));
  }, []);

  return <PieChartComponent data={referralData} title="Referral Source Distribution" />;
}
