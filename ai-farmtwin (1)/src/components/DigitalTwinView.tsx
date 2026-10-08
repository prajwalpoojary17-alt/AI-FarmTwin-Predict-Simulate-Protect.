import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { SectionData, ZoneData, Plant, PlantGroup, SectionDirection, SensorInput } from '../types/farm';
import { generatePlantGroupsForSection } from '../utils/plantAddressing';
import {
  Compass,
  Sliders,
  Sprout,
  CheckCircle2,
  Thermometer,
  Droplets,
  Cpu,
  ArrowRight,
  Info,
  Sparkles,
  RotateCcw,
  Layers,
  MapPin,
  Activity,
  X,
  Boxes,
} from 'lucide-react';

interface DigitalTwinViewProps {
  onSelectSection?: (section: SectionData) => void;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  onSelectSection,
}) => {
  const { farmConfig, setSelectedSection, updateSectionInputs, updateZoneCropAndPlants } = useFarm();
  const [filterZone, setFilterZone] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<PlantGroup | null>(null);

  // Manual Sensor Input Interface State
  const [inputZoneId, setInputZoneId] = useState<string>(farmConfig.zones[0]?.id || 'A');
  const [inputDirection, setInputDirection] = useState<SectionDirection>('North');

  // Find currently targeted section for manual input
  const currentTargetZone = farmConfig.zones.find((z) => z.id === inputZoneId) || farmConfig.zones[0];
  const currentTargetSection = currentTargetZone?.sections[inputDirection];

  // Local form inputs
  const [tempVal, setTempVal] = useState<string>(
    currentTargetSection?.manualInputs.temperature !== null && currentTargetSection?.manualInputs.temperature !== undefined
      ? currentTargetSection.manualInputs.temperature.toString()
      : '29'
  );
  const [humVal, setHumVal] = useState<string>(
    currentTargetSection?.manualInputs.humidity !== null && currentTargetSection?.manualInputs.humidity !== undefined
      ? currentTargetSection.manualInputs.humidity.toString()
      : '68'
  );
  const [soilVal, setSoilVal] = useState<string>(
    currentTargetSection?.manualInputs.soilMoisture !== null && currentTargetSection?.manualInputs.soilMoisture !== undefined
      ? currentTargetSection.manualInputs.soilMoisture.toString()
      : '52'
  );

  const [notification, setNotification] = useState<string | null>(null);

  // Sync input fields when user switches targeted zone/section
  const handleTargetChange = (newZoneId: string, newDir: SectionDirection) => {
    setInputZoneId(newZoneId);
    setInputDirection(newDir);
    const z = farmConfig.zones.find((item) => item.id === newZoneId);
    if (z) {
      const sec = z.sections[newDir];
      setTempVal(sec.manualInputs.temperature !== null ? sec.manualInputs.temperature.toString() : '');
      setHumVal(sec.manualInputs.humidity !== null ? sec.manualInputs.humidity.toString() : '');
      setSoilVal(sec.manualInputs.soilMoisture !== null ? sec.manualInputs.soilMoisture.toString() : '');
    }
  };

  const handleUpdateSensorData = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTemp = tempVal.trim() !== '' ? parseFloat(tempVal) : null;
    const parsedHum = humVal.trim() !== '' ? parseFloat(humVal) : null;
    const parsedSoil = soilVal.trim() !== '' ? parseFloat(soilVal) : null;

    const newInputs: SensorInput = {
      ...currentTargetSection.manualInputs,
      temperature: parsedTemp,
      humidity: parsedHum,
      soilMoisture: parsedSoil,
      waterStress: parsedSoil !== null ? Math.max(0, Math.min(100, Math.round(100 - parsedSoil))) : null,
      lastUpdated: 'Just now',
    };

    updateSectionInputs(inputZoneId, inputDirection, newInputs);
    setNotification(
      `Updated Zone ${inputZoneId} - ${inputDirection} sensor readings. Health and plant dots recalculated.`
    );
    setTimeout(() => setNotification(null), 3500);
  };

  // Section click handler: sets target for manual sensor input panel
  const handleSectionClick = (section: SectionData) => {
    handleTargetChange(section.zoneId, section.direction);
    setSelectedSection(section);
    if (onSelectSection) {
      onSelectSection(section);
    }
  };

  const zonesToDisplay =
    filterZone === 'all'
      ? farmConfig.zones
      : farmConfig.zones.filter((z) => z.id === filterZone);

  // Status visual configurations (Pure Crop Health & Plant Visualization)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return {
          dotBg: 'bg-emerald-400 hover:bg-emerald-300 ring-2 ring-emerald-300/80 shadow-emerald-900/50',
          dotEmoji: '🟢',
          label: 'Healthy',
          textColor: 'text-emerald-400',
          badgeBg: 'bg-emerald-950/80 border-emerald-700 text-emerald-300',
        };
      case 'Warning':
        return {
          dotBg: 'bg-amber-400 hover:bg-amber-300 ring-2 ring-amber-300/80 shadow-amber-900/50',
          dotEmoji: '🟡',
          label: 'Warning',
          textColor: 'text-amber-400',
          badgeBg: 'bg-amber-950/80 border-amber-700 text-amber-300',
        };
      case 'High Risk':
        return {
          dotBg: 'bg-orange-500 hover:bg-orange-400 ring-2 ring-orange-300/80 shadow-orange-900/50',
          dotEmoji: '🟠',
          label: 'High Risk',
          textColor: 'text-orange-400',
          badgeBg: 'bg-orange-950/80 border-orange-700 text-orange-300',
        };
      case 'Critical':
        return {
          dotBg: 'bg-rose-500 hover:bg-rose-400 ring-2 ring-rose-300/80 shadow-rose-900/50',
          dotEmoji: '🔴',
          label: 'Critical',
          textColor: 'text-rose-400',
          badgeBg: 'bg-rose-950/80 border-rose-700 text-rose-300',
        };
      case 'Awaiting Input':
      default:
        return {
          dotBg: 'bg-stone-400 hover:bg-stone-300 ring-1 ring-white/50 shadow-black/50',
          dotEmoji: '⚪',
          label: 'Awaiting Input',
          textColor: 'text-stone-300',
          badgeBg: 'bg-stone-800/80 border-stone-600 text-stone-300',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              Farm Digital Twin — Satellite Agricultural Field Twin
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Top-Down Continuous Aerial Twin
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Answers: <em>&ldquo;Is my farm healthy and functioning properly?&rdquo;</em> Each zone is visualized as one continuous aerial field with overlaid North, East, West, and South sections.
          </p>
        </div>

        {/* Filter Zone */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 dark:text-stone-400 font-medium">Zone Filter:</span>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 font-semibold focus:outline-hidden"
          >
            <option value="all">All Configured Zones ({farmConfig.zones.length})</option>
            {farmConfig.zones.map((z) => (
              <option key={z.id} value={z.id}>
                Zone {z.id} ({z.crop})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MANUAL SENSOR INPUT — PRE-HARDWARE DEMO PANEL */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border-2 border-emerald-500/50 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-700 text-white tracking-wide uppercase">
                Manual Sensor Input — Pre-Hardware Demo
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">
                (Simulates physical sensor telemetry entered manually)
              </span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">CURRENT DEMO:</span> Manual Sensor Input &rarr; Health/Risk Calculation &rarr; Digital Twin Overlays
            </div>
          </div>

          <div className="text-[10px] text-stone-400 font-mono bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded border border-stone-200 dark:border-stone-700">
            FUTURE: Physical Sensors &rarr; Hardware/IoT &rarr; Calculation &rarr; Twin
          </div>
        </div>

        {/* Input Form for specific section */}
        <form onSubmit={handleUpdateSensorData} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {/* Choose Zone */}
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Target Zone
              </label>
              <select
                value={inputZoneId}
                onChange={(e) => handleTargetChange(e.target.value, inputDirection)}
                className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-bold focus:outline-hidden"
              >
                {farmConfig.zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    Zone {z.id} ({z.crop})
                  </option>
                ))}
              </select>
            </div>

            {/* Choose Section */}
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Target Section
              </label>
              <select
                value={inputDirection}
                onChange={(e) => handleTargetChange(inputZoneId, e.target.value as SectionDirection)}
                className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-bold focus:outline-hidden"
              >
                <option value="North">North Section</option>
                <option value="East">East Section</option>
                <option value="West">West Section</option>
                <option value="South">South Section</option>
              </select>
            </div>

            {/* Temperature Input */}
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Temperature (°C)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 29"
                  value={tempVal}
                  onChange={(e) => setTempVal(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-2.5 top-1.5 text-stone-400 text-[11px]">°C</span>
              </div>
            </div>

            {/* Humidity Input */}
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Humidity (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 68"
                  value={humVal}
                  onChange={(e) => setHumVal(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-2.5 top-1.5 text-stone-400 text-[11px]">%</span>
              </div>
            </div>

            {/* Soil Moisture Input */}
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Soil Moisture (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 52"
                  value={soilVal}
                  onChange={(e) => setSoilVal(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-2.5 top-1.5 text-stone-400 text-[11px]">%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            {/* Quick Test Presets */}
            <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
              <span className="text-stone-400 font-semibold">Demo Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setTempVal('29');
                  setHumVal('68');
                  setSoilVal('52');
                }}
                className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-medium hover:bg-emerald-100 transition cursor-pointer"
              >
                Optimal (29°C, 68%, 52%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempVal('33');
                  setHumVal('55');
                  setSoilVal('31');
                }}
                className="px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-200 font-medium hover:bg-orange-100 transition cursor-pointer"
              >
                Drought Stress (33°C, 55%, 31%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempVal('38');
                  setHumVal('25');
                  setSoilVal('18');
                }}
                className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-medium hover:bg-rose-100 transition cursor-pointer"
              >
                Severe Heat (38°C, 25%, 18%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempVal('');
                  setHumVal('');
                  setSoilVal('');
                }}
                className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-200 transition cursor-pointer"
              >
                Reset to Awaiting
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Update Sensor Data</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {notification && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Legend & Layout Schema Key (Pure Crop Health & Plant Locations) */}
      <div className="bg-stone-50 dark:bg-stone-900/60 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="font-bold text-stone-800 dark:text-stone-200">Health Indicator:</span>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-300/80 inline-block" />
            <span className="text-stone-700 dark:text-stone-300">Healthy (80–100%) 🟢</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-300/80 inline-block" />
            <span className="text-stone-700 dark:text-stone-300">Warning (60–79%) 🟡</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-300/80 inline-block" />
            <span className="text-stone-700 dark:text-stone-300">High Risk (40–59%) 🟠</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-300/80 inline-block" />
            <span className="text-stone-700 dark:text-stone-300">Critical (&lt;40%) 🔴</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-400 ring-1 ring-white/50 inline-block" />
            <span className="text-stone-500">Awaiting Input ⚪</span>
          </div>
        </div>

        <div className="text-[11px] text-stone-500 font-medium">
          Plants are grouped into boxes of 10 sharing one physical address &bull; Click any section to configure sensor inputs.
        </div>
      </div>

      {/*
        ========================================================================
        CRITICAL REQUIREMENT: ZONES MUST BE VERTICAL (NEVER SIDE-BY-SIDE)
        Each zone has:
        A. TOP FOUR ADJACENT INFORMATION BOXES (NORTH, EAST, WEST, SOUTH)
        B. LARGE LOWER CROP DIGITAL TWIN (WHITE/LIGHT 2D MAP WITH STRAIGHT ROWS)
        ========================================================================
      */}
      <div className="flex flex-col gap-8 w-full">
        {zonesToDisplay.map((zone) => {
          const north = zone.sections.North;
          const east = zone.sections.East;
          const west = zone.sections.West;
          const south = zone.sections.South;

          // Generate actual 10-plant groups dynamically from centralized plantAddressing engine
          const northGroups = generatePlantGroupsForSection(zone, north);
          const eastGroups = generatePlantGroupsForSection(zone, east);
          const westGroups = generatePlantGroupsForSection(zone, west);
          const southGroups = generatePlantGroupsForSection(zone, south);

          const totalGroupsInZone =
            northGroups.length + eastGroups.length + westGroups.length + southGroups.length;

          return (
            <div
              key={zone.id}
              className="w-full bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-300 dark:border-stone-700 shadow-md p-5 sm:p-6 transition-all duration-200"
            >
              {/* ZONE TOP BAR: Zone ID, Crop Name, Plant Count, Presets */}
              <div className="mb-5 pb-4 border-b-2 border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1.5 rounded-xl font-black text-sm bg-emerald-600 text-white shadow-xs tracking-wider">
                    ZONE {zone.id}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base tracking-wide text-stone-900 dark:text-white uppercase flex items-center gap-2">
                      <span>Crop: {zone.crop}</span>
                      <span className="text-stone-400 text-xs font-semibold lowercase">
                        &bull; 4 cardinal sectors
                      </span>
                    </h3>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                      Total Plants: {zone.totalPlants.toLocaleString()} &bull; ({totalGroupsInZone} Groups of 10 Plants)
                    </span>
                  </div>
                </div>

                {/* Quick Plant Count Presets */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-400 font-medium hidden md:inline">Quick Presets:</span>
                  {[100, 400, 1000].map((count) => (
                    <button
                      key={count}
                      onClick={() => updateZoneCropAndPlants(zone.id, zone.crop, count)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        zone.totalPlants === count
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700'
                      }`}
                      title={`Quickly set Zone ${zone.id} to ${count} total plants`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/*
                ========================================================================
                A. TOP FOUR ADJACENT INFORMATION BOXES
                Directly connected side-by-side with no large gaps.
                NORTH | EAST | WEST | SOUTH
                Displays existing section sensor telemetry & health values.
                ========================================================================
              */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-300 dark:divide-stone-700 border-2 border-stone-800 dark:border-stone-600 rounded-2xl bg-stone-50 dark:bg-stone-900/90 overflow-hidden mb-6 shadow-xs">
                {/* NORTH BOX */}
                <SectionInfoBox
                  direction="North"
                  section={north}
                  groupCount={northGroups.length}
                  isSelected={inputZoneId === zone.id && inputDirection === 'North'}
                  onClick={() => handleSectionClick(north)}
                  getStatusColor={getStatusColor}
                />

                {/* EAST BOX */}
                <SectionInfoBox
                  direction="East"
                  section={east}
                  groupCount={eastGroups.length}
                  isSelected={inputZoneId === zone.id && inputDirection === 'East'}
                  onClick={() => handleSectionClick(east)}
                  getStatusColor={getStatusColor}
                />

                {/* WEST BOX */}
                <SectionInfoBox
                  direction="West"
                  section={west}
                  groupCount={westGroups.length}
                  isSelected={inputZoneId === zone.id && inputDirection === 'West'}
                  onClick={() => handleSectionClick(west)}
                  getStatusColor={getStatusColor}
                />

                {/* SOUTH BOX */}
                <SectionInfoBox
                  direction="South"
                  section={south}
                  groupCount={southGroups.length}
                  isSelected={inputZoneId === zone.id && inputDirection === 'South'}
                  onClick={() => handleSectionClick(south)}
                  getStatusColor={getStatusColor}
                />
              </div>

              {/*
                ========================================================================
                B. LARGE LOWER CROP DIGITAL TWIN
                - Clean 2D agricultural field map on a WHITE / very light background
                - Continuous SOLID lines for major section boundaries:
                      NORTH | EAST
                      ------+------
                      WEST  | SOUTH
                - Straight rows of plant dots (5 per row x 2 rows = 10 plants per group)
                - Thin DOTTED or DASHED lines divide every 10-plant group
                - NO large gap between groups
                - NO text inside the crop map
                - Clicking a group opens the detailed metadata modal
                ========================================================================
              */}
              <div className="border-2 border-stone-800 dark:border-stone-500 rounded-2xl bg-white dark:bg-stone-950 p-4 sm:p-6 shadow-xs overflow-visible">
                <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-stone-800 dark:border-stone-500 bg-white dark:bg-stone-950 overflow-hidden rounded-xl">
                  {/* QUADRANT 1: NORTH (Top-Left) */}
                  <div className="border-b-2 border-stone-800 dark:border-stone-500 md:border-r-2 border-stone-800 dark:border-stone-500 p-2 sm:p-3 flex flex-col justify-start">
                    <div className="px-2 py-1 mb-2 font-mono font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-stone-900 dark:text-stone-200">
                        <Compass className="w-3.5 h-3.5 text-emerald-600" />
                        NORTH SECTION
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {north.plantCount} Plants &bull; {northGroups.length} Groups
                      </span>
                    </div>

                    {northGroups.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400 italic">
                        No plants allocated in North section
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 border border-dashed border-stone-300 dark:border-stone-700">
                        {northGroups.map((group) => (
                          <CropPlantGroup
                            key={group.groupId}
                            group={group}
                            onClick={() => setSelectedGroup(group)}
                            getStatusColor={getStatusColor}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* QUADRANT 2: EAST (Top-Right) */}
                  <div className="border-b-2 border-stone-800 dark:border-stone-500 p-2 sm:p-3 flex flex-col justify-start">
                    <div className="px-2 py-1 mb-2 font-mono font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-stone-900 dark:text-stone-200">
                        <Compass className="w-3.5 h-3.5 text-emerald-600" />
                        EAST SECTION
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {east.plantCount} Plants &bull; {eastGroups.length} Groups
                      </span>
                    </div>

                    {eastGroups.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400 italic">
                        No plants allocated in East section
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 border border-dashed border-stone-300 dark:border-stone-700">
                        {eastGroups.map((group) => (
                          <CropPlantGroup
                            key={group.groupId}
                            group={group}
                            onClick={() => setSelectedGroup(group)}
                            getStatusColor={getStatusColor}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* QUADRANT 3: WEST (Bottom-Left) */}
                  <div className="border-b-2 md:border-b-0 md:border-r-2 border-stone-800 dark:border-stone-500 p-2 sm:p-3 flex flex-col justify-start">
                    <div className="px-2 py-1 mb-2 font-mono font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-stone-900 dark:text-stone-200">
                        <Compass className="w-3.5 h-3.5 text-emerald-600" />
                        WEST SECTION
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {west.plantCount} Plants &bull; {westGroups.length} Groups
                      </span>
                    </div>

                    {westGroups.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400 italic">
                        No plants allocated in West section
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 border border-dashed border-stone-300 dark:border-stone-700">
                        {westGroups.map((group) => (
                          <CropPlantGroup
                            key={group.groupId}
                            group={group}
                            onClick={() => setSelectedGroup(group)}
                            getStatusColor={getStatusColor}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* QUADRANT 4: SOUTH (Bottom-Right) */}
                  <div className="p-2 sm:p-3 flex flex-col justify-start">
                    <div className="px-2 py-1 mb-2 font-mono font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-stone-900 dark:text-stone-200">
                        <Compass className="w-3.5 h-3.5 text-emerald-600" />
                        SOUTH SECTION
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {south.plantCount} Plants &bull; {southGroups.length} Groups
                      </span>
                    </div>

                    {southGroups.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400 italic">
                        No plants allocated in South section
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 border border-dashed border-stone-300 dark:border-stone-700">
                        {southGroups.map((group) => (
                          <CropPlantGroup
                            key={group.groupId}
                            group={group}
                            onClick={() => setSelectedGroup(group)}
                            getStatusColor={getStatusColor}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Zone Footer Note */}
              <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
                <span className="font-mono">
                  Zone <strong>{zone.id}</strong> &bull; Total Allocated: {zone.totalPlants.toLocaleString()} Plants across {totalGroupsInZone} Groups
                </span>
                <button
                  onClick={() => handleSectionClick(north)}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure Section Telemetry</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/*
        ========================================================================
        10-PLANT GROUP DETAIL MODAL (ON CLICK ONLY)
        Keeps the 2D crop map visually clean.
        Displays detailed group data when a group is tapped/clicked.
        ========================================================================
      */}
      {selectedGroup && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedGroup(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 border-2 border-stone-800 dark:border-stone-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                  10-Plant Group Details
                </span>
                <h3 className="text-lg font-black text-stone-900 dark:text-white font-mono flex items-center gap-2">
                  <span>{selectedGroup.groupId}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-sans font-bold">
                    {selectedGroup.plantCount} Plants
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Group Properties Table */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] text-stone-400 block font-semibold uppercase">Shared Physical Address</span>
                <span className="font-bold text-stone-900 dark:text-white break-words">{selectedGroup.address}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] text-stone-400 block font-semibold uppercase">Zone & Section</span>
                <span className="font-bold text-stone-900 dark:text-white">Zone {selectedGroup.zoneId} — {selectedGroup.sectionDirection || selectedGroup.direction}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] text-stone-400 block font-semibold uppercase">Crop Type</span>
                <span className="font-bold text-stone-900 dark:text-white">{selectedGroup.crop || 'Crop'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] text-stone-400 block font-semibold uppercase">Plant ID Range</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">{selectedGroup.plantsSummary}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] text-stone-400 block font-semibold uppercase">Health Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedGroup.status}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] text-stone-400 block font-semibold uppercase">Stress Diagnosis</span>
                <span className="font-medium text-stone-700 dark:text-stone-300 truncate block">{selectedGroup.mainRiskFactor}</span>
              </div>
            </div>

            {/* Member Plants Grid */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-stone-800 dark:text-stone-200 flex items-center justify-between">
                <span>Enclosed Plant Records ({selectedGroup.plants.length})</span>
                <span className="text-[10px] text-stone-400 font-normal">All share {selectedGroup.address}</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                {selectedGroup.plants.map((plant) => {
                  const visual = getStatusColor(plant.status);
                  return (
                    <div
                      key={plant.plantId}
                      className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center space-y-1"
                    >
                      <div className={`w-3 h-3 rounded-full mx-auto ${visual.dotBg}`} />
                      <span className="font-mono font-bold text-[10px] block text-stone-800 dark:text-stone-200 truncate">
                        {plant.plantId}
                      </span>
                      <span className="text-[9px] text-stone-500 block">
                        #{plant.plantNumber}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setSelectedGroup(null)}
              className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

{/*
  ========================================================================
  SUB-COMPONENTS FOR CLEAN 2D DIGITAL TWIN
  ========================================================================
*/}

interface SectionInfoBoxProps {
  direction: 'North' | 'East' | 'West' | 'South';
  section: SectionData;
  groupCount: number;
  isSelected: boolean;
  onClick: () => void;
  getStatusColor: (status: string) => {
    dotBg: string;
    dotEmoji: string;
    label: string;
    textColor: string;
    badgeBg: string;
  };
}

const SectionInfoBox: React.FC<SectionInfoBoxProps> = ({
  direction,
  section,
  groupCount,
  isSelected,
  onClick,
  getStatusColor,
}) => {
  const health = section.calculatedHealth;
  const visual = getStatusColor(health.status);
  const healthScore = health.healthScore !== null ? `${health.healthScore}%` : 'Awaiting';

  const temp = section.manualInputs.temperature !== null ? `${section.manualInputs.temperature}°C` : 'Awaiting';
  const humidity = section.manualInputs.humidity !== null ? `${section.manualInputs.humidity}%` : 'Awaiting';
  const soil = section.manualInputs.soilMoisture !== null ? `${section.manualInputs.soilMoisture}%` : 'Awaiting';

  return (
    <div
      onClick={onClick}
      className={`p-4 flex flex-col justify-between transition-colors cursor-pointer select-none ${
        isSelected
          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-inset ring-emerald-500'
          : 'hover:bg-white dark:hover:bg-stone-800/80'
      }`}
      title={`Click to calibrate sensor readings for ${direction}`}
    >
      <div>
        {/* Section Name + Health Status Badge */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2 mb-2.5">
          <span className="font-black text-sm tracking-wider uppercase text-stone-900 dark:text-white flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            {direction.toUpperCase()}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${visual.badgeBg}`}>
            {visual.dotEmoji} {health.status} ({healthScore})
          </span>
        </div>

        {/* Telemetry data table */}
        <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
          <div className="flex justify-between">
            <span className="text-stone-400">Crop:</span>
            <strong className="text-stone-800 dark:text-stone-100">{section.crop}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Temperature:</span>
            <span className="font-mono font-bold text-stone-900 dark:text-white">{temp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Humidity:</span>
            <span className="font-mono font-bold text-stone-900 dark:text-white">{humidity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Soil Moisture:</span>
            <span className="font-mono font-bold text-stone-900 dark:text-white">{soil}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Allocated Plants:</span>
            <strong className="text-emerald-700 dark:text-emerald-400">{section.plantCount.toLocaleString()} Plants</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Plant Groups:</span>
            <strong className="text-stone-800 dark:text-stone-200">{groupCount} Groups (of 10)</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Risk Assessment:</span>
            <span className="font-semibold text-stone-700 dark:text-stone-300">{health.riskLevel}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-[10px] text-stone-400">
        <span className="truncate max-w-[130px]">{health.warnings[0] || 'Conditions optimal'}</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          {isSelected ? 'Calibrating Telemetry' : 'Calibrate →'}
        </span>
      </div>
    </div>
  );
};

interface CropPlantGroupProps {
  group: PlantGroup;
  onClick: () => void;
  getStatusColor: (status: string) => {
    dotBg: string;
    dotEmoji: string;
    label: string;
    textColor: string;
    badgeBg: string;
  };
}

const CropPlantGroup: React.FC<CropPlantGroupProps> = ({
  group,
  onClick,
  getStatusColor,
}) => {
  const row1 = group.plants.slice(0, 5);
  const row2 = group.plants.slice(5, 10);

  return (
    <div
      onClick={onClick}
      className="p-2 sm:p-2.5 border border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-500 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer flex flex-col justify-center items-center select-none"
      title={`${group.groupId} • ${group.address} (${group.plantCount} plants) — Click for details`}
    >
      {/* Row 1: Exactly 5 straight plant positions */}
      <div className="grid grid-cols-5 gap-2 sm:gap-2.5 w-full items-center justify-items-center">
        {[0, 1, 2, 3, 4].map((colIdx) => {
          const plant = row1[colIdx];
          if (!plant) {
            return <div key={colIdx} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
          }
          const visual = getStatusColor(plant.status);
          return (
            <div
              key={plant.plantId}
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-transform hover:scale-135 ${visual.dotBg}`}
              title={`${plant.plantId} (${plant.status})`}
            />
          );
        })}
      </div>

      {/* Row 2: Exactly 5 straight plant positions */}
      <div className="grid grid-cols-5 gap-2 sm:gap-2.5 w-full items-center justify-items-center mt-2 sm:mt-2.5">
        {[0, 1, 2, 3, 4].map((colIdx) => {
          const plant = row2[colIdx];
          if (!plant) {
            return <div key={colIdx} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
          }
          const visual = getStatusColor(plant.status);
          return (
            <div
              key={plant.plantId}
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-transform hover:scale-135 ${visual.dotBg}`}
              title={`${plant.plantId} (${plant.status})`}
            />
          );
        })}
      </div>
    </div>
  );
};
