export type SectionDirection = 'North' | 'South' | 'East' | 'West';

export type HealthStatus = 'Healthy' | 'Warning' | 'High Risk' | 'Critical' | 'Awaiting Input';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe' | 'Unknown';

export interface SensorInput {
  temperature: number | null; // °C
  humidity: number | null; // %
  soilMoisture: number | null; // %
  lightIntensity: number | null; // klux
  rainfall: number | null; // mm
  waterStress: number | null; // 0-100 index
  pestRisk: 'None' | 'Low' | 'Moderate' | 'High' | null;
  nutrientCondition: 'Deficient' | 'Balanced' | 'Surplus' | null;
  lastUpdated?: string;
}

export interface SectionHealthCalculation {
  healthScore: number | null; // 0-100
  status: HealthStatus;
  riskLevel: RiskLevel;
  warnings: string[];
  factors: {
    temperatureStatus: string;
    moistureStatus: string;
    humidityStatus: string;
    stressScore: number;
  };
}

export interface SectionData {
  id: string; // e.g. "A-North"
  zoneId: string; // e.g. "A"
  direction: SectionDirection;
  crop: string;
  plantCount: number;
  manualInputs: SensorInput;
  calculatedHealth: SectionHealthCalculation;
}

export interface ZoneData {
  id: string; // e.g. "A", "B", "C"
  name: string; // e.g. "Zone A"
  crop: string;
  totalPlants: number;
  sections: Record<SectionDirection, SectionData>;
}

export interface Plant {
  plantId: string; // e.g. "A-N-P001"
  plantNumber: number; // 1, 2, ...
  groupId: string; // e.g. "Group N-01"
  groupCode?: string; // e.g. "N-01"
  address: string; // Shared group address: "Zone A / North / Group N-01"
  groupAddress: string; // Shared group address: "Zone A / North / Group N-01"
  zoneId: string;
  sectionDirection: SectionDirection;
  row?: number;
  position?: number;
  crop: string;
  status: HealthStatus;
  riskLevel: RiskLevel;
  mainRiskFactor: string;
  x: number; // 0% to 100% horizontal coordinate in section
  y: number; // 0% to 100% vertical coordinate in section
  indexInGroup?: number;
}

export interface PlantGroup {
  groupId: string; // e.g. "Group N-01"
  groupCode: string; // e.g. "N-01"
  groupNumber: number; // 1, 2, ...
  zoneId: string;
  sectionDirection: SectionDirection;
  direction?: SectionDirection;
  address: string; // "Zone A / North / Group N-01"
  startPlantNumber: number; // 1
  endPlantNumber: number; // 10
  plantCount: number; // 10 (or remaining for last group)
  plantsSummary: string; // "P001–P010"
  plantIdRange?: string; // "A-N-P001–A-N-P010"
  crop?: string;
  plants: Plant[];
  status: HealthStatus;
  riskLevel: RiskLevel;
  mainRiskFactor: string;
  boxX: number;
  boxY: number;
  boxLeft: number;
  boxTop: number;
  boxWidth: number;
  boxHeight: number;
}

export interface FarmEvent {
  id: string;
  type: 'Animal' | 'Human' | 'Vehicle';
  zoneId: string;
  direction: SectionDirection;
  locationName: string;
  timestamp: string;
  entryLocation: string;
  currentLocation: string; // Centralized Shared Group Address, e.g. "Zone A / North / Group N-01"
  description: string;
  status: 'Active' | 'Resolved';
  x: number; // 0% to 100% horizontal coordinate within section
  y: number; // 0% to 100% vertical coordinate within section
  positionX?: number;
  positionY?: number;
  nearestPlantId?: string;
  nearestPlantAddress?: string;
  nearestGroupId?: string;
  nearestGroupCode?: string;
  nearestGroupAddress?: string;
  nearestGroupPlantsSummary?: string;
  nearestGroupPlantCount?: number;
}

export interface FarmConfig {
  farmName: string;
  farmManager: string;
  acres: number;
  totalPlants: number;
  zoneCount: number;
  zones: ZoneData[];
  weatherCondition: string;
  overallTemperature?: number | null;
  overallHumidity?: number | null;
  overallSoilMoisture?: number | null;
  theme: 'light' | 'dark';
  farmLogo: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  farmName: string;
  email: string;
  emailVerified?: boolean;
}
