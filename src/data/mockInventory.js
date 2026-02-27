// Mock inventory data – 4 items across 4 warehouse zones
export const initialInventory = [
  {
    id: 'QR-001',
    name: 'Hydraulic Cylinder',
    stock: 24,
    safetyStock: 10,
    zone: 'A',
  },
  {
    id: 'QR-002',
    name: 'Servo Motor Unit',
    stock: 7,
    safetyStock: 12,
    zone: 'B',
  },
  {
    id: 'QR-003',
    name: 'Steel Bearing Pack',
    stock: 45,
    safetyStock: 20,
    zone: 'C',
  },
  {
    id: 'QR-004',
    name: 'PLC Controller',
    stock: 3,
    safetyStock: 5,
    zone: 'D',
  },
];

// Zone metadata for the warehouse map
export const zoneConfig = {
  A: { label: 'Zone A', subtitle: 'Heavy Machinery', row: 1, col: 1 },
  B: { label: 'Zone B', subtitle: 'Electronics', row: 1, col: 2 },
  C: { label: 'Zone C', subtitle: 'Raw Materials', row: 2, col: 1 },
  D: { label: 'Zone D', subtitle: 'Controllers', row: 2, col: 2 },
};
