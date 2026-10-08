import { FarmConfig, SectionData, SectionDirection, SensorInput, ZoneData } from '../types/farm';
import { calculateSectionHealth } from './healthEngine';

export const ZONE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

const DEFAULT_CROPS = [
  'Tomatoes (Solanum lycopersicum)',
  'Maize / Corn (Zea mays)',
  'Basmati Rice (Oryza sativa)',
  'Wheat (Triticum aestivum)',
  'Soybean (Glycine max)',
  'Cotton (Gossypium hirsutum)',
];

export function createEmptySensorInput(): SensorInput {
  return {
    temperature: null,
    humidity: null,
    soilMoisture: null,
    lightIntensity: null,
    rainfall: null,
    waterStress: null,
    pestRisk: null,
    nutrientCondition: null,
  };
}

export function createSection(
  zoneId: string,
  direction: SectionDirection,
  crop: string,
  plantCount: number,
  initialInput?: SensorInput
): SectionData {
  const inputs = initialInput || createEmptySensorInput();
  const calculated = calculateSectionHealth(inputs, crop);
  return {
    id: `${zoneId}-${direction}`,
    zoneId,
    direction,
    crop,
    plantCount,
    manualInputs: inputs,
    calculatedHealth: calculated,
  };
}

export function createZone(
  zoneIndex: number,
  cropName: string,
  plantsForZone: number,
  initialInputs?: Partial<Record<SectionDirection, SensorInput>>
): ZoneData {
  const zoneId = ZONE_LETTERS[zoneIndex] || `Z${zoneIndex + 1}`;
  const quarterPlants = Math.floor(plantsForZone / 4);
  const remainder = plantsForZone % 4;

  const directions: SectionDirection[] = ['North', 'South', 'East', 'West'];

  const sections: Record<SectionDirection, SectionData> = {} as any;
  directions.forEach((dir, idx) => {
    // distribute remainder to first few sections
    const count = quarterPlants + (idx < remainder ? 1 : 0);
    const customInput = initialInputs ? initialInputs[dir] : undefined;
    sections[dir] = createSection(zoneId, dir, cropName, count, customInput);
  });

  return {
    id: zoneId,
    name: `Zone ${zoneId}`,
    crop: cropName,
    totalPlants: plantsForZone,
    sections,
  };
}

export function createInitialFarmConfig(farmName = 'Verdant Horizon Smart Farm', manager = 'Alex Mercer'): FarmConfig {
  const zoneCount = 3;
  const zoneAPlants = 25;
  const zoneBPlants = 50;
  const zoneCPlants = 100;
  const totalPlants = zoneAPlants + zoneBPlants + zoneCPlants;

  // For the initial prototype, let's pre-populate some realistic initial manual values
  // entered previously by the user (as if entered during testing), so the Digital Twin
  // showcases calculated sections right away, but clearly labeled as manually entered!
  // Zone A has entered inputs; Zone B has inputs; Zone C is awaiting input!
  const zoneAInputs: Partial<Record<SectionDirection, SensorInput>> = {
    North: {
      temperature: 29,
      humidity: 68,
      soilMoisture: 52,
      lightIntensity: 50,
      rainfall: 0,
      waterStress: 15,
      pestRisk: 'None',
      nutrientCondition: 'Balanced',
      lastUpdated: '10 mins ago',
    },
    East: {
      temperature: 31,
      humidity: 61,
      soilMoisture: 43,
      lightIntensity: 65,
      rainfall: 0,
      waterStress: 28,
      pestRisk: 'None',
      nutrientCondition: 'Balanced',
      lastUpdated: '20 mins ago',
    },
    West: {
      temperature: 28,
      humidity: 71,
      soilMoisture: 60,
      lightIntensity: 48,
      rainfall: 0,
      waterStress: 12,
      pestRisk: 'None',
      nutrientCondition: 'Balanced',
      lastUpdated: '15 mins ago',
    },
    South: {
      temperature: 33,
      humidity: 55,
      soilMoisture: 31,
      lightIntensity: 75,
      rainfall: 0,
      waterStress: 65,
      pestRisk: 'Low',
      nutrientCondition: 'Balanced',
      lastUpdated: '5 mins ago',
    },
  };

  const zoneBInputs: Partial<Record<SectionDirection, SensorInput>> = {
    North: {
      temperature: 26,
      humidity: 88,
      soilMoisture: 84,
      lightIntensity: 35,
      rainfall: 35,
      waterStress: 15,
      pestRisk: 'Moderate',
      nutrientCondition: 'Balanced',
      lastUpdated: '30 mins ago',
    },
    South: {
      temperature: 23,
      humidity: 60,
      soilMoisture: 65,
      lightIntensity: 50,
      rainfall: 0,
      waterStress: 12,
      pestRisk: 'None',
      nutrientCondition: 'Balanced',
      lastUpdated: '1 hour ago',
    },
    East: {
      temperature: 25,
      humidity: 64,
      soilMoisture: 62,
      lightIntensity: 52,
      rainfall: 0,
      waterStress: 14,
      pestRisk: 'None',
      nutrientCondition: 'Balanced',
      lastUpdated: '40 mins ago',
    },
    West: {
      temperature: 42,
      humidity: 20,
      soilMoisture: 18,
      lightIntensity: 90,
      rainfall: 0,
      waterStress: 92,
      pestRisk: 'High',
      nutrientCondition: 'Deficient',
      lastUpdated: '2 mins ago',
    },
  };

  // Zone C is initially awaiting input
  const zoneCInputs: Partial<Record<SectionDirection, SensorInput>> = {
    North: createEmptySensorInput(),
    South: createEmptySensorInput(),
    East: createEmptySensorInput(),
    West: createEmptySensorInput(),
  };

  const zones: ZoneData[] = [
    createZone(0, DEFAULT_CROPS[0], zoneAPlants, zoneAInputs),
    createZone(1, DEFAULT_CROPS[1], zoneBPlants, zoneBInputs),
    createZone(2, DEFAULT_CROPS[2], zoneCPlants, zoneCInputs),
  ];

  return {
    farmName,
    farmManager: manager,
    acres: 45,
    totalPlants,
    zoneCount,
    zones,
    weatherCondition: 'Sunny',
    overallTemperature: 28,
    overallHumidity: 65,
    overallSoilMoisture: 50,
    theme: 'light',
    farmLogo: 'sprout',
  };
}

export function createFreshUserFarmConfig(farmName = '', manager = ''): FarmConfig {
  const zoneA = createZone(0, '', 0);
  const zoneB = createZone(1, '', 0);
  return {
    farmName: farmName || '',
    farmManager: manager || '',
    acres: 0,
    totalPlants: 0,
    zoneCount: 2,
    zones: [zoneA, zoneB],
    weatherCondition: 'Awaiting sensor input',
    overallTemperature: null,
    overallHumidity: null,
    overallSoilMoisture: null,
    theme: 'light',
    farmLogo: 'sprout',
  };
}

