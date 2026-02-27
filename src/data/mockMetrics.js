// Mock top-level KPI metrics for Home Overview

export const topMetrics = [
  {
    id: 'metric-temp',
    label: 'Avg Fleet Temp',
    value: '1.9°C',
    status: 'nominal',
    icon: 'thermometer',
    detail: 'Across 5 active trucks',
  },
  {
    id: 'metric-fatigue',
    label: 'Fatigue Alerts',
    value: '2',
    status: 'warning',
    icon: 'alert',
    detail: 'Drivers exceeding 8hr shift',
  },
  {
    id: 'metric-equip',
    label: 'Equipment Status',
    value: '96%',
    status: 'nominal',
    icon: 'gear',
    detail: '24 of 25 units operational',
  },
];
