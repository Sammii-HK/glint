"use client";

import { AverageMetricsChart } from './charts/AverageMetricsChart';
import { SessionDurationChart } from './charts/SessionDurationChart';
import { DeviceTypeChart } from './charts/DeviceTypeChart';
import { LocationHeatmap } from './charts/LocationHeatmap';
import { ReferralSourceChart } from './charts/ReferralSourceChart';
import { TrafficSourceChart } from './charts/TrafficSourceChart';
import { BrowserChart } from './charts/BrowserChart';
import { HourlyTrafficChart } from './charts/HourlyTrafficChart';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400 mb-8">Real-time insights and metrics</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Row 1: Time Series Charts */}
          <div className="lg:col-span-2">
            <AverageMetricsChart />
          </div>
          <div>
            <SessionDurationChart />
          </div>

          {/* Row 2: Pie Charts */}
          <div>
            <TrafficSourceChart />
          </div>
          <div>
            <ReferralSourceChart />
          </div>
          <div>
            <DeviceTypeChart />
          </div>

          {/* Row 3: Bar Charts */}
          <div className="lg:col-span-2">
            <LocationHeatmap />
          </div>
          <div>
            <BrowserChart />
          </div>

          {/* Row 4: Hourly Pattern */}
          <div className="lg:col-span-3">
            <HourlyTrafficChart />
          </div>
        </div>
      </div>
    </div>
  );
}
