"use client";

import { AverageMetricsChart } from './charts/AverageMetricsChart';
// import { SessionDurationChart } from './charts/SessionDurationChart';
import { DeviceTypeChart } from './charts/DeviceTypeChart';
// import { LocationHeatmap } from './charts/LocationHeatmap';
import { ReferralSourceChart } from './charts/ReferralSourceChart';
import { TrafficSourceChart } from './charts/TrafficSourceChart';

export default function Dashboard() {

  return (
    <div className='grid grid-cols-2 gap-6 p-4'>
      {/* <h1>📊 Real-Time Analytics Dashboard</h1> */}
      <AverageMetricsChart />
      <TrafficSourceChart />
      <DeviceTypeChart />
      <ReferralSourceChart />
      {/* <LocationHeatmap />
      <SessionDurationChart /> */}
    </div>
  );
}
