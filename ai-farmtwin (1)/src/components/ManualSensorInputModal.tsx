import React, { useState, useEffect } from 'react';
import { SectionData, SensorInput } from '../types/farm';
import { useFarm } from '../context/FarmContext';
import {
  X,
  Thermometer,
  Droplets,
  Sun,
  CloudRain,
  Bug,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Info,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface ManualSensorInputModalProps {
  section: SectionData | null;
  onClose: () => void;
}

export const ManualSensorInputModal: React.FC<ManualSensorInputModalProps> = ({ section, onClose }) => {
  const { updateSectionInputs } = useFarm();

  const [temp, setTemp] = useState<string>('');
  const [humidity, setHumidity] = useState<string>('');
  const [moisture, setMoisture] = useState<string>('');
  const [light, setLight] = useState<string>('');
  const [rainfall, setRainfall] = useState<string>('');
  const [pest, setPest] = useState<'None' | 'Low' | 'Moderate' | 'High' | ''>('');
  const [nutrient, setNutrient] = useState<'Deficient' | 'Balanced' | 'Surplus' | ''>('');

  const [notification, setNotification] = useState<string | null>(null);

  // Sync inputs with selected section
  useEffect(() => {
    if (section) {
      const inputs = section.manualInputs;
      setTemp(inputs.temperature !== null ? inputs.temperature.toString() : '');
      setHumidity(inputs.humidity !== null ? inputs.humidity.toString() : '');
      setMoisture(inputs.soilMoisture !== null ? inputs.soilMoisture.toString() : '');
      setLight(inputs.lightIntensity !== null ? inputs.lightIntensity.toString() : '');
      setRainfall(inputs.rainfall !== null ? inputs.rainfall.toString() : '');
      setPest(inputs.pestRisk || 'None');
      setNutrient(inputs.nutrientCondition || 'Balanced');
      setNotification(null);
    }
  }, [section]);

  if (!section) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTemp = temp.trim() !== '' ? parseFloat(temp) : null;
    const parsedHum = humidity.trim() !== '' ? parseFloat(humidity) : null;
    const parsedMoist = moisture.trim() !== '' ? parseFloat(moisture) : null;
    const parsedLight = light.trim() !== '' ? parseFloat(light) : null;
    const parsedRain = rainfall.trim() !== '' ? parseFloat(rainfall) : null;

    const newInputs: SensorInput = {
      temperature: parsedTemp,
      humidity: parsedHum,
      soilMoisture: parsedMoist,
      lightIntensity: parsedLight,
      rainfall: parsedRain,
      waterStress: parsedMoist !== null ? Math.max(0, Math.min(100, Math.round(100 - parsedMoist))) : null,
      pestRisk: pest ? pest : null,
      nutrientCondition: nutrient ? nutrient : null,
      lastUpdated: 'Just now',
    };

    updateSectionInputs(section.zoneId, section.direction, newInputs);
    setNotification('Section health and Digital Twin recalculated successfully!');
    setTimeout(() => setNotification(null), 3000);
  };

  const applyPreset = (preset: {
    temp: number;
    humidity: number;
    moisture: number;
    light: number;
    rain: number;
    pest: 'None' | 'Low' | 'Moderate' | 'High';
    nutrient: 'Deficient' | 'Balanced' | 'Surplus';
  }) => {
    setTemp(preset.temp.toString());
    setHumidity(preset.humidity.toString());
    setMoisture(preset.moisture.toString());
    setLight(preset.light.toString());
    setRainfall(preset.rain.toString());
    setPest(preset.pest);
    setNutrient(preset.nutrient);
  };

  const handleClearToAwaiting = () => {
    setTemp('');
    setHumidity('');
    setMoisture('');
    setLight('');
    setRainfall('');
    setPest('None');
    setNutrient('Balanced');
  };

  const health = section.calculatedHealth;

  const getStatusBadge = () => {
    switch (health.status) {
      case 'Healthy':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Healthy ({health.healthScore}/100)
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Warning ({health.healthScore}/100)
          </span>
        );
      case 'High Risk':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-600" />
            High Risk ({health.healthScore}/100)
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertOctagon className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Critical ({health.healthScore}/100)
          </span>
        );
      case 'Awaiting Input':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
            <HelpCircle className="w-3.5 h-3.5 mr-1 text-stone-500" />
            Awaiting Input
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-2xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white">
                Zone {section.zoneId}
              </span>
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                {section.direction} Section
              </h2>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Crop: <strong className="text-stone-700 dark:text-stone-200">{section.crop}</strong> | Plants:{' '}
              <strong className="text-stone-700 dark:text-stone-200">{section.plantCount.toLocaleString()}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-white rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Notification banner */}
          {notification && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notification}</span>
            </div>
          )}

          {/* Current Calculated Health Status & Warnings */}
          <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              Current Calculated Section Health
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
              <div className="bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-700">
                <span className="text-stone-500 dark:text-stone-400 block">Health Score</span>
                <span className="text-base font-bold text-stone-900 dark:text-white">
                  {health.healthScore !== null ? `${health.healthScore} / 100` : 'Awaiting Input'}
                </span>
              </div>
              <div className="bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-700">
                <span className="text-stone-500 dark:text-stone-400 block">Risk Level</span>
                <span className="text-base font-bold text-stone-900 dark:text-white">
                  {health.riskLevel}
                </span>
              </div>
              <div className="bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-700">
                <span className="text-stone-500 dark:text-stone-400 block">Thermal Condition</span>
                <span className="text-xs font-semibold text-stone-900 dark:text-white truncate block" title={health.factors.temperatureStatus}>
                  {health.factors.temperatureStatus}
                </span>
              </div>
              <div className="bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-700">
                <span className="text-stone-500 dark:text-stone-400 block">Moisture Condition</span>
                <span className="text-xs font-semibold text-stone-900 dark:text-white truncate block" title={health.factors.moistureStatus}>
                  {health.factors.moistureStatus}
                </span>
              </div>
            </div>

            {/* Warnings list */}
            <div>
              <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 block mb-1">
                Engine Diagnostics & Warnings:
              </span>
              <ul className="space-y-1">
                {health.warnings.map((w, idx) => (
                  <li
                    key={idx}
                    className={`text-xs px-2.5 py-1 rounded-md flex items-start gap-1.5 ${
                      health.status === 'Healthy'
                        ? 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                        : health.status === 'Warning'
                        ? 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                        : health.status === 'Awaiting Input'
                        ? 'bg-stone-200/60 dark:bg-stone-700/40 text-stone-700 dark:text-stone-300'
                        : 'bg-rose-100/60 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <span className="font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Demo Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Test Presets (For Demonstration)
              </span>
              <button
                type="button"
                onClick={handleClearToAwaiting}
                className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
              >
                Clear Fields
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    temp: 24,
                    humidity: 62,
                    moisture: 65,
                    light: 48,
                    rain: 0,
                    pest: 'None',
                    nutrient: 'Balanced',
                  })
                }
                className="p-2 text-left rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 transition cursor-pointer"
              >
                <span className="font-bold block">Optimal Growth</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">24°C | 62% | 65%</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    temp: 38,
                    humidity: 25,
                    moisture: 20,
                    light: 85,
                    rain: 0,
                    pest: 'Moderate',
                    nutrient: 'Deficient',
                  })
                }
                className="p-2 text-left rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-900 dark:text-amber-200 transition cursor-pointer"
              >
                <span className="font-bold block">Heat & Drought</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400">38°C | 25% | 20%</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    temp: 29,
                    humidity: 92,
                    moisture: 88,
                    light: 30,
                    rain: 50,
                    pest: 'Moderate',
                    nutrient: 'Balanced',
                  })
                }
                className="p-2 text-left rounded-lg border border-orange-300 dark:border-orange-800 bg-orange-50/60 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-950/60 text-orange-900 dark:text-orange-200 transition cursor-pointer"
              >
                <span className="font-bold block">Monsoon Blight</span>
                <span className="text-[10px] text-orange-700 dark:text-orange-400">29°C | 92% | 88%</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    temp: 8,
                    humidity: 45,
                    moisture: 35,
                    light: 40,
                    rain: 0,
                    pest: 'None',
                    nutrient: 'Balanced',
                  })
                }
                className="p-2 text-left rounded-lg border border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/60 text-blue-900 dark:text-blue-200 transition cursor-pointer"
              >
                <span className="font-bold block">Cold Stress</span>
                <span className="text-[10px] text-blue-700 dark:text-blue-400">8°C | 45% | 35%</span>
              </button>
            </div>
          </div>

          {/* Form: Manual Sensor Input System */}
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-emerald-600" />
                Manual Sensor Inputs for {section.id}
              </h3>
              <span className="text-[11px] text-stone-500">
                User entered (Pre-hardware layer)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Temperature */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  Temperature (°C)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 31"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2 text-xs text-stone-400">°C</span>
                </div>
                <span className="text-[10px] text-stone-500 block mt-0.5">Optimal: 20°C - 30°C</span>
              </div>

              {/* Humidity */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  Humidity (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="e.g. 68"
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2 text-xs text-stone-400">%</span>
                </div>
                <span className="text-[10px] text-stone-500 block mt-0.5">Optimal: 50% - 75%</span>
              </div>

              {/* Soil Moisture */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                  Soil Moisture (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="e.g. 42"
                    value={moisture}
                    onChange={(e) => setMoisture(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2 text-xs text-stone-400">%</span>
                </div>
                <span className="text-[10px] text-stone-500 block mt-0.5">Optimal: 50% - 75%</span>
              </div>

              {/* Light Intensity */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Light Intensity (klux)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 50"
                    value={light}
                    onChange={(e) => setLight(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2 text-xs text-stone-400">klux</span>
                </div>
              </div>

              {/* Rainfall */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
                  Rainfall (mm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 0"
                    value={rainfall}
                    onChange={(e) => setRainfall(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
                </div>
              </div>

              {/* Pest Risk */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                  <Bug className="w-3.5 h-3.5 text-rose-500" />
                  Pest Risk
                </label>
                <select
                  value={pest}
                  onChange={(e) => setPest(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="None">None (Clear)</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High (Active Infestation)</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
              >
                Close
              </button>

              <button
                type="submit"
                className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-950/20 transition cursor-pointer"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
