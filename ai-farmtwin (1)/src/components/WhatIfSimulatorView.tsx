import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { SectionData, SectionDirection, SensorInput } from '../types/farm';
import { calculateSectionHealth } from '../utils/healthEngine';
import {
  GitCompare,
  Sliders,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Thermometer,
  Droplets,
  CloudRain,
  Sun,
  Bug,
  RotateCcw,
  Zap,
} from 'lucide-react';

export const WhatIfSimulatorView: React.FC = () => {
  const { farmConfig, updateSectionInputs } = useFarm();

  // Find initial section to simulate (prefer one with data)
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

  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    allSections[2]?.id || allSections[0]?.id || 'A-East'
  );

  const targetSection = useMemo(() => {
    return allSections.find((s) => s.id === selectedSectionId) || allSections[0];
  }, [allSections, selectedSectionId]);

  // Current inputs
  const currentInputs = targetSection?.manualInputs || {
    temperature: 25,
    humidity: 60,
    soilMoisture: 60,
    lightIntensity: 45,
    rainfall: 0,
    waterStress: 10,
    pestRisk: 'None',
    nutrientCondition: 'Balanced',
  };

  // Simulated state
  const [simTemp, setSimTemp] = useState<number>(
    currentInputs.temperature !== null ? currentInputs.temperature : 26
  );
  const [simHumidity, setSimHumidity] = useState<number>(
    currentInputs.humidity !== null ? currentInputs.humidity : 65
  );
  const [simMoisture, setSimMoisture] = useState<number>(
    currentInputs.soilMoisture !== null ? currentInputs.soilMoisture : 55
  );
  const [simRainfall, setSimRainfall] = useState<number>(
    currentInputs.rainfall !== null ? currentInputs.rainfall : 0
  );
  const [simPest, setSimPest] = useState<'None' | 'Low' | 'Moderate' | 'High'>(
    (currentInputs.pestRisk as any) || 'None'
  );
  const [simNutrient, setSimNutrient] = useState<'Deficient' | 'Balanced' | 'Surplus'>(
    (currentInputs.nutrientCondition as any) || 'Balanced'
  );

  const [commitMessage, setCommitMessage] = useState<string | null>(null);

  // Sync simulation when user switches section
  const handleSectionChange = (newId: string) => {
    setSelectedSectionId(newId);
    const sec = allSections.find((s) => s.id === newId);
    if (sec) {
      setSimTemp(sec.manualInputs.temperature ?? 26);
      setSimHumidity(sec.manualInputs.humidity ?? 65);
      setSimMoisture(sec.manualInputs.soilMoisture ?? 55);
      setSimRainfall(sec.manualInputs.rainfall ?? 0);
      setSimPest((sec.manualInputs.pestRisk as any) || 'None');
      setSimNutrient((sec.manualInputs.nutrientCondition as any) || 'Balanced');
      setCommitMessage(null);
    }
  };

  // Current calculation
  const currentCalculation = targetSection.calculatedHealth;

  // Real-time simulated calculation
  const simulatedInputs: SensorInput = useMemo(() => {
    return {
      temperature: simTemp,
      humidity: simHumidity,
      soilMoisture: simMoisture,
      lightIntensity: 50,
      rainfall: simRainfall,
      waterStress: Math.max(0, Math.min(100, Math.round(100 - simMoisture))),
      pestRisk: simPest,
      nutrientCondition: simNutrient,
      lastUpdated: 'Simulated',
    };
  }, [simTemp, simHumidity, simMoisture, simRainfall, simPest, simNutrient]);

  const simulatedCalculation = useMemo(() => {
    return calculateSectionHealth(simulatedInputs, targetSection.crop);
  }, [simulatedInputs, targetSection.crop]);

  // Delta calculation
  const currentScore = currentCalculation.healthScore ?? 50;
  const simScore = simulatedCalculation.healthScore ?? 50;
  const scoreDelta = simScore - currentScore;

  const handleApplyToTwin = () => {
    updateSectionInputs(targetSection.zoneId, targetSection.direction, simulatedInputs);
    setCommitMessage(`Simulated values applied to ${targetSection.id}! Digital Twin updated.`);
    setTimeout(() => setCommitMessage(null), 3500);
  };

  const handleResetToCurrent = () => {
    setSimTemp(currentInputs.temperature ?? 26);
    setSimHumidity(currentInputs.humidity ?? 65);
    setSimMoisture(currentInputs.soilMoisture ?? 55);
    setSimRainfall(currentInputs.rainfall ?? 0);
    setSimPest((currentInputs.pestRisk as any) || 'None');
    setSimNutrient((currentInputs.nutrientCondition as any) || 'Balanced');
  };

  const getStatusBadge = (status: string, score: number | null) => {
    switch (status) {
      case 'Healthy':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Healthy ({score}/100)
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Warning ({score}/100)
          </span>
        );
      case 'High Risk':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-600" />
            High Risk ({score}/100)
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <AlertOctagon className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Critical ({score}/100)
          </span>
        );
      case 'Awaiting Input':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            <HelpCircle className="w-3.5 h-3.5 mr-1 text-stone-400" />
            Awaiting Input
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-emerald-600" />
              What-If Agronomic Simulator
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Deterministic Twin Engine
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Test hypothetical scenarios (e.g. increase soil moisture from 20% to 55%, or simulate a 40°C heatwave) to see predicted twin impact.
          </p>
        </div>

        {/* Section Picker */}
        <div className="flex items-center gap-2 text-xs bg-stone-100 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700">
          <span className="text-stone-500 font-medium">Target Section:</span>
          <select
            value={selectedSectionId}
            onChange={(e) => handleSectionChange(e.target.value)}
            className="bg-transparent font-bold text-stone-900 dark:text-white focus:outline-hidden cursor-pointer"
          >
            {allSections.map((s) => (
              <option key={s.id} value={s.id}>
                Zone {s.zoneId} - {s.direction} ({s.crop})
              </option>
            ))}
          </select>
        </div>
      </div>

      {commitMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{commitMessage}</span>
        </div>
      )}

      {/* Side-by-Side Comparison: Current vs Simulated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CURRENT STATE */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  BASELINE TWIN STATUS
                </span>
                <h3 className="font-bold text-lg text-stone-900 dark:text-white">
                  Current Conditions ({targetSection.id})
                </h3>
              </div>
              {getStatusBadge(currentCalculation.status, currentCalculation.healthScore)}
            </div>

            {/* Metrics List */}
            <div className="grid grid-cols-3 gap-2.5 text-xs mb-4">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                <span className="text-stone-500 block mb-0.5">Temperature</span>
                <span className="text-base font-bold text-stone-900 dark:text-white">
                  {currentInputs.temperature !== null ? `${currentInputs.temperature}°C` : 'Awaiting'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                <span className="text-stone-500 block mb-0.5">Soil Moisture</span>
                <span className="text-base font-bold text-stone-900 dark:text-white">
                  {currentInputs.soilMoisture !== null ? `${currentInputs.soilMoisture}%` : 'Awaiting'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                <span className="text-stone-500 block mb-0.5">Humidity</span>
                <span className="text-base font-bold text-stone-900 dark:text-white">
                  {currentInputs.humidity !== null ? `${currentInputs.humidity}%` : 'Awaiting'}
                </span>
              </div>
            </div>

            {/* Diagnosis Warnings */}
            <div>
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1.5">
                Current Engine Diagnostics:
              </span>
              <ul className="space-y-1.5 text-xs">
                {currentCalculation.warnings.map((w, i) => (
                  <li
                    key={i}
                    className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-start gap-1.5"
                  >
                    <span className="text-stone-400 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500">
            Crop: <strong className="text-stone-700 dark:text-stone-300">{targetSection.crop}</strong> ({targetSection.plantCount} plants)
          </div>
        </div>

        {/* SIMULATED STATE */}
        <div className="bg-emerald-950/10 dark:bg-emerald-950/30 rounded-2xl border-2 border-emerald-500/40 shadow-md p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-300/40 dark:border-emerald-800/40 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  WHAT-IF SIMULATION RESULT
                </span>
                <h3 className="font-bold text-lg text-stone-900 dark:text-white">
                  Simulated Twin Outcome
                </h3>
              </div>
              {getStatusBadge(simulatedCalculation.status, simulatedCalculation.healthScore)}
            </div>

            {/* Score Delta Indicator */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-800/80 mb-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 block">Predicted Health Score</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-stone-900 dark:text-white">
                    {simScore} / 100
                  </span>
                  <span className="text-xs text-stone-400">
                    (was {currentScore})
                  </span>
                </div>
              </div>

              <div
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                  scoreDelta > 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : scoreDelta < 0
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                }`}
              >
                {scoreDelta > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>+{scoreDelta} pts Improvement</span>
                  </>
                ) : scoreDelta < 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    <span>{scoreDelta} pts Degradation</span>
                  </>
                ) : (
                  <span>No Change</span>
                )}
              </div>
            </div>

            {/* Predicted Diagnostics */}
            <div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block mb-1.5">
                Simulated Outcome Diagnostics:
              </span>
              <ul className="space-y-1.5 text-xs">
                {simulatedCalculation.warnings.map((w, i) => (
                  <li
                    key={i}
                    className="p-2 rounded-lg bg-white/70 dark:bg-stone-900/70 border border-emerald-200 dark:border-emerald-800 text-stone-800 dark:text-stone-200 flex items-start gap-1.5"
                  >
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-3 border-t border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-3">
            <button
              onClick={handleResetToCurrent}
              className="px-3 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Sliders
            </button>

            <button
              onClick={handleApplyToTwin}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Apply Simulation to Live Twin
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Scenario Controls (Sliders & Modifiers) */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            Hypothetical Variable Sliders
          </h3>
          <span className="text-xs text-stone-500">
            Move sliders to observe instantaneous calculation adjustments
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Soil Moisture Slider */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-500" />
                Simulated Soil Moisture (%)
              </label>
              <span className="font-mono font-extrabold text-sm text-blue-600 dark:text-blue-400">
                {simMoisture}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={simMoisture}
              onChange={(e) => setSimMoisture(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Severe Drought (10%)</span>
              <span>Optimal (50-75%)</span>
              <span>Waterlogged (90%)</span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-500" />
                Simulated Temperature (°C)
              </label>
              <span className="font-mono font-extrabold text-sm text-amber-600 dark:text-amber-400">
                {simTemp}°C
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="48"
              value={simTemp}
              onChange={(e) => setSimTemp(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Frost Hazard (5°C)</span>
              <span>Optimal (20-30°C)</span>
              <span>Extreme Heat (45°C)</span>
            </div>
          </div>

          {/* Humidity Slider */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-indigo-500" />
                Simulated Relative Humidity (%)
              </label>
              <span className="font-mono font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                {simHumidity}%
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="100"
              value={simHumidity}
              onChange={(e) => setSimHumidity(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Arid Desiccation (15%)</span>
              <span>Optimal (50-75%)</span>
              <span>Fungal Hazard (&gt;85%)</span>
            </div>
          </div>

          {/* Rainfall Slider */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-sky-500" />
                Simulated Rainfall (mm)
              </label>
              <span className="font-mono font-extrabold text-sm text-sky-600 dark:text-sky-400">
                {simRainfall} mm
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={simRainfall}
              onChange={(e) => setSimRainfall(parseInt(e.target.value, 10))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Dry (0mm)</span>
              <span>Moderate (20mm)</span>
              <span>Torrential Runoff (100mm)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
