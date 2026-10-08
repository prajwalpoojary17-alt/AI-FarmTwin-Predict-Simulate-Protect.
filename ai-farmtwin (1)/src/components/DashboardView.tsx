import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { SectionData, SectionDirection } from '../types/farm';
import {
  Layers,
  Leaf,
  Thermometer,
  Droplets,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Cpu,
  ArrowRight,
  Sprout,
  User,
  Building,
  HeartPulse,
  CloudSun,
  Boxes,
  Sliders,
} from 'lucide-react';
import { OverallFarmSensorModal } from './OverallFarmSensorModal';
import { FarmBadgeLogo } from '../utils/farmLogo';

export const DashboardView: React.FC = () => {
  const { farmConfig, summaryStats, setActiveTab } = useFarm();
  const [sensorModalOpen, setSensorModalOpen] = useState(false);

  // Aggregate all sections for farm-wide crop-health alerts and plant breakdown
  const allSections: SectionData[] = useMemo(() => {
    const list: SectionData[] = [];
    const dirs: SectionDirection[] = ['North', 'South', 'East', 'West'];
    farmConfig.zones.forEach((z) => {
      dirs.forEach((d) => {
        if (z.sections[d]) list.push(z.sections[d]);
      });
    });
    return list;
  }, [farmConfig]);

  // Aggregate actual plant counts per status
  const plantCounts = useMemo(() => {
    let healthy = 0;
    let warning = 0;
    let highRisk = 0;
    let critical = 0;
    let awaiting = 0;

    allSections.forEach((sec) => {
      switch (sec.calculatedHealth.status) {
        case 'Healthy':
          healthy += sec.plantCount;
          break;
        case 'Warning':
          warning += sec.plantCount;
          break;
        case 'High Risk':
          highRisk += sec.plantCount;
          break;
        case 'Critical':
          critical += sec.plantCount;
          break;
        case 'Awaiting Input':
        default:
          awaiting += sec.plantCount;
          break;
      }
    });

    return { healthy, warning, highRisk, critical, awaiting };
  }, [allSections]);

  // Overall Farm Sensor Values:
  // Use farmConfig overall sensor readings if entered, or fallback to section summaryStats
  const tempDisplay =
    farmConfig.overallTemperature !== undefined && farmConfig.overallTemperature !== null
      ? `${farmConfig.overallTemperature}°C`
      : summaryStats.avgTemp !== null
      ? `${summaryStats.avgTemp}°C`
      : 'Awaiting input';

  const humidityDisplay =
    farmConfig.overallHumidity !== undefined && farmConfig.overallHumidity !== null
      ? `${farmConfig.overallHumidity}%`
      : summaryStats.avgHumidity !== null
      ? `${summaryStats.avgHumidity}%`
      : 'Awaiting input';

  const moistureDisplay =
    farmConfig.overallSoilMoisture !== undefined && farmConfig.overallSoilMoisture !== null
      ? `${farmConfig.overallSoilMoisture}%`
      : summaryStats.avgMoisture !== null
      ? `${summaryStats.avgMoisture}%`
      : 'Awaiting input';

  const weatherDisplay = farmConfig.weatherCondition || 'Sunny';

  // Overall Crop Health percentage
  const overallHealthScore = useMemo(() => {
    const scores = allSections
      .map((s) => s.calculatedHealth.healthScore)
      .filter((score): score is number => score !== null);

    if (scores.length === 0) return null;
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return avg;
  }, [allSections]);

  const getOverallStatus = (score: number | null) => {
    if (score === null) return { label: 'Awaiting Input', emoji: '⚪', color: 'text-stone-400' };
    if (score >= 80) return { label: 'Healthy', emoji: '🟢', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 60) return { label: 'Warning', emoji: '🟡', color: 'text-amber-600 dark:text-amber-400' };
    if (score >= 40) return { label: 'High Risk', emoji: '🟠', color: 'text-orange-600 dark:text-orange-400' };
    return { label: 'Critical', emoji: '🔴', color: 'text-rose-600 dark:text-rose-400' };
  };

  const overallStatus = getOverallStatus(overallHealthScore);

  // Collect Important Crop-Health Alerts from all sections
  const cropHealthAlerts = useMemo(() => {
    const alerts: { id: string; zoneId: string; direction: string; crop: string; warning: string; status: string }[] = [];
    allSections.forEach((sec) => {
      if (sec.calculatedHealth.status !== 'Healthy' && sec.calculatedHealth.status !== 'Awaiting Input') {
        sec.calculatedHealth.warnings.forEach((w) => {
          alerts.push({
            id: `${sec.id}-${w}`,
            zoneId: sec.zoneId,
            direction: sec.direction,
            crop: sec.crop,
            warning: w,
            status: sec.calculatedHealth.status,
          });
        });
      }
    });
    return alerts;
  }, [allSections]);

  const healthyPct = farmConfig.totalPlants > 0 ? Math.round((plantCounts.healthy / farmConfig.totalPlants) * 100) : 0;
  const warningPct = farmConfig.totalPlants > 0 ? Math.round((plantCounts.warning / farmConfig.totalPlants) * 100) : 0;
  const highRiskPct = farmConfig.totalPlants > 0 ? Math.round((plantCounts.highRisk / farmConfig.totalPlants) * 100) : 0;
  const criticalPct = farmConfig.totalPlants > 0 ? Math.round((plantCounts.critical / farmConfig.totalPlants) * 100) : 0;
  const awaitingPct = farmConfig.totalPlants > 0 ? Math.round((plantCounts.awaiting / farmConfig.totalPlants) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. TOP OF DASHBOARD: CURRENT OVERALL FARM READINGS & ENTER SENSOR DATA BUTTON */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border-2 border-emerald-500/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-700 text-white tracking-wide uppercase">
                Overall Farm Sensor Data
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white">
                Current Overall Farm Readings
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              These values represent current overall farm readings entered manually (pre-hardware mode).
            </p>
          </div>

          {/* Button: Opens modal directly on Dashboard, keeps user on Dashboard */}
          <button
            onClick={() => setSensorModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
            title="Edit overall farm readings directly on Dashboard"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Enter Sensor Data</span>
          </button>
        </div>

        {/* 4 Sensor Cards at the Top of the Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overall Farm Temperature */}
          <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Overall Farm Temperature
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600">
                <Thermometer className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-stone-900 dark:text-white">
                {tempDisplay}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Current thermal reading
            </p>
          </div>

          {/* Overall Farm Humidity */}
          <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Overall Farm Humidity
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600">
                <Droplets className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-stone-900 dark:text-white">
                {humidityDisplay}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Atmospheric relative humidity
            </p>
          </div>

          {/* Overall Farm Soil Moisture */}
          <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Overall Farm Soil Moisture
              </span>
              <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/80 flex items-center justify-center text-teal-600">
                <Droplets className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-stone-900 dark:text-white">
                {moistureDisplay}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Root-zone volumetric moisture
            </p>
          </div>

          {/* Overall Farm Weather Condition */}
          <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Overall Farm Weather
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-500">
                <CloudSun className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-black text-stone-900 dark:text-white">
                {weatherDisplay}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Current sky condition
            </p>
          </div>
        </div>
      </div>

      {/* 2. Farm Overview Header & Quick Summary Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-stone-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-emerald-700/50">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <FarmBadgeLogo logoId={farmConfig.farmLogo} className="w-56 h-56 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Farm Overview</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {farmConfig.farmName}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/90 font-medium">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-300" />
                Manager: <strong className="text-white">{farmConfig.farmManager || 'Alex Mercer'}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Total Acreage: <strong className="text-white">{farmConfig.acres} Acres</strong>
              </span>
              <span>&bull;</span>
              <span>
                Total Zones: <strong className="text-white">{farmConfig.zoneCount} Plots</strong>
              </span>
              <span>&bull;</span>
              <span>
                Total Plants: <strong className="text-white">{farmConfig.totalPlants.toLocaleString()} Plants</strong>
              </span>
            </div>
          </div>

          {/* Quick CTA to go directly to the dedicated Digital Twin page */}
          <button
            onClick={() => setActiveTab('digital-twin')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-sm transition shadow-md shrink-0 cursor-pointer self-start md:self-auto"
          >
            <Boxes className="w-4 h-4" />
            <span>Open Detailed Digital Twin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Overall Crop Health & Plant Inventory Health Summary Breakdown */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-stone-900 dark:text-white">
                  Overall Crop Health: {overallHealthScore !== null ? `${overallHealthScore}%` : 'Awaiting'}
                </h2>
                <span className={`text-xs font-bold ${overallStatus.color}`}>
                  {overallStatus.emoji} {overallStatus.label}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Calculated across all sections &bull; Total {farmConfig.totalPlants.toLocaleString()} plants
              </p>
            </div>
          </div>

          <span className="text-xs text-stone-500 font-medium">
            Total Farm: {farmConfig.acres} Acres &bull; {farmConfig.zoneCount} Zones
          </span>
        </div>

        {/* Segmented Distribution Bar */}
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          {healthyPct > 0 && (
            <div
              style={{ width: `${healthyPct}%` }}
              className="bg-emerald-500 transition-all duration-300"
              title={`Healthy: ${plantCounts.healthy.toLocaleString()} plants (${healthyPct}%)`}
            />
          )}
          {warningPct > 0 && (
            <div
              style={{ width: `${warningPct}%` }}
              className="bg-amber-400 transition-all duration-300"
              title={`Warning: ${plantCounts.warning.toLocaleString()} plants (${warningPct}%)`}
            />
          )}
          {highRiskPct > 0 && (
            <div
              style={{ width: `${highRiskPct}%` }}
              className="bg-orange-500 transition-all duration-300"
              title={`High Risk: ${plantCounts.highRisk.toLocaleString()} plants (${highRiskPct}%)`}
            />
          )}
          {criticalPct > 0 && (
            <div
              style={{ width: `${criticalPct}%` }}
              className="bg-rose-500 transition-all duration-300"
              title={`Critical: ${plantCounts.critical.toLocaleString()} plants (${criticalPct}%)`}
            />
          )}
          {awaitingPct > 0 && (
            <div
              style={{ width: `${awaitingPct}%` }}
              className="bg-stone-300 dark:bg-stone-600 transition-all duration-300"
              title={`Awaiting Input: ${plantCounts.awaiting.toLocaleString()} plants (${awaitingPct}%)`}
            />
          )}
        </div>

        {/* 5 Health Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {/* Healthy Plants */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <span>🟢</span>
              Healthy Plants
            </span>
            <span className="text-xl font-black text-emerald-900 dark:text-emerald-100 block mt-1">
              {plantCounts.healthy.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
              {healthyPct}% of total plants
            </span>
          </div>

          {/* Warning Plants */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
            <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <span>🟡</span>
              Warning Plants
            </span>
            <span className="text-xl font-black text-amber-900 dark:text-amber-100 block mt-1">
              {plantCounts.warning.toLocaleString()}
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              {warningPct}% of total plants
            </span>
          </div>

          {/* High-Risk Plants */}
          <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60">
            <span className="font-bold text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
              <span>🟠</span>
              High-Risk Plants
            </span>
            <span className="text-xl font-black text-orange-900 dark:text-orange-100 block mt-1">
              {plantCounts.highRisk.toLocaleString()}
            </span>
            <span className="text-[11px] text-orange-700 dark:text-orange-400">
              {highRiskPct}% of total plants
            </span>
          </div>

          {/* Critical Plants */}
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
            <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <span>🔴</span>
              Critical Plants
            </span>
            <span className="text-xl font-black text-rose-900 dark:text-rose-100 block mt-1">
              {plantCounts.critical.toLocaleString()}
            </span>
            <span className="text-[11px] text-rose-700 dark:text-rose-400">
              {criticalPct}% of total plants
            </span>
          </div>

          {/* Awaiting Input */}
          <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <span>⚪</span>
              Awaiting Input
            </span>
            <span className="text-xl font-black text-stone-900 dark:text-white block mt-1">
              {plantCounts.awaiting.toLocaleString()}
            </span>
            <span className="text-[11px] text-stone-500">
              {awaitingPct}% of total plants
            </span>
          </div>
        </div>
      </div>

      {/* 4. Important Crop-Health Alerts & Crop Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Important Crop-Health Alerts Feed */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-stone-200 dark:border-stone-800 pb-2">
              <h2 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Important Crop-Health Alerts
              </h2>
              <span className="text-xs text-stone-400 font-mono">
                {cropHealthAlerts.length} Active Notice(s)
              </span>
            </div>

            {cropHealthAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-stone-800 dark:text-stone-200 mt-2">
                  All monitored sections within optimal agronomic thresholds
                </p>
                <p className="text-[11px] text-stone-400">No active water deficit, thermal stress, or blight risk detected.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {cropHealthAlerts.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      item.status === 'Critical'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        : item.status === 'High Risk'
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-extrabold">
                          Zone {item.zoneId} — {item.direction} Section ({item.crop})
                        </span>
                        <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/70 dark:bg-stone-900/70">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-90">{item.warning}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 mt-3 text-right">
            <button
              onClick={() => setActiveTab('crop-health')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center justify-end gap-1 cursor-pointer"
            >
              <span>View Full Crop Health Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Crop Distribution & Allocated Zones Summary */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-stone-200 dark:border-stone-800 pb-2">
              <h2 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" />
                Crop Distribution by Zone
              </h2>
              <span className="text-xs text-stone-400">
                {farmConfig.zoneCount} Managed Zones
              </span>
            </div>

            <div className="space-y-3">
              {farmConfig.zones.map((zone) => {
                const pct =
                  farmConfig.totalPlants > 0
                    ? Math.round((zone.totalPlants / farmConfig.totalPlants) * 100)
                    : 0;

                return (
                  <div
                    key={zone.id}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-700 text-white font-black flex items-center justify-center text-[10px]">
                          {zone.id}
                        </span>
                        <span className="font-bold text-stone-900 dark:text-white">
                          Zone {zone.id}: {zone.crop}
                        </span>
                      </div>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {zone.totalPlants.toLocaleString()} plants ({pct}%)
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-emerald-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 mt-3 flex items-center justify-between text-xs">
            <span className="text-stone-400">4 Cardinal Sections per Zone</span>
            <button
              onClick={() => setActiveTab('digital-twin')}
              className="font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
            >
              <span>See Plant Dots in Digital Twin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal directly on Dashboard, keeps user on Dashboard */}
      <OverallFarmSensorModal
        isOpen={sensorModalOpen}
        onClose={() => setSensorModalOpen(false)}
      />
    </div>
  );
};
