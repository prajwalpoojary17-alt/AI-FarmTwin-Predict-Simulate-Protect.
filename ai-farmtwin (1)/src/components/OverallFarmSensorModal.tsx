import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Thermometer,
  Droplets,
  CloudSun,
  X,
  CheckCircle2,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface OverallFarmSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OverallFarmSensorModal: React.FC<OverallFarmSensorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { farmConfig, summaryStats, updateOverallFarmSensors } = useFarm();

  const [temp, setTemp] = useState<string>('');
  const [humidity, setHumidity] = useState<string>('');
  const [soilMoisture, setSoilMoisture] = useState<string>('');
  const [weather, setWeather] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTemp(
        farmConfig.overallTemperature !== undefined && farmConfig.overallTemperature !== null
          ? farmConfig.overallTemperature.toString()
          : summaryStats.avgTemp !== null
          ? summaryStats.avgTemp.toString()
          : '28'
      );
      setHumidity(
        farmConfig.overallHumidity !== undefined && farmConfig.overallHumidity !== null
          ? farmConfig.overallHumidity.toString()
          : summaryStats.avgHumidity !== null
          ? summaryStats.avgHumidity.toString()
          : '65'
      );
      setSoilMoisture(
        farmConfig.overallSoilMoisture !== undefined && farmConfig.overallSoilMoisture !== null
          ? farmConfig.overallSoilMoisture.toString()
          : summaryStats.avgMoisture !== null
          ? summaryStats.avgMoisture.toString()
          : '50'
      );
      setWeather(farmConfig.weatherCondition || 'Sunny');
    }
  }, [isOpen, farmConfig, summaryStats]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTemp = temp.trim() !== '' ? parseFloat(temp) : null;
    const parsedHum = humidity.trim() !== '' ? parseFloat(humidity) : null;
    const parsedSoil = soilMoisture.trim() !== '' ? parseFloat(soilMoisture) : null;

    updateOverallFarmSensors({
      temperature: parsedTemp,
      humidity: parsedHum,
      soilMoisture: parsedSoil,
      weatherCondition: weather.trim() || 'Sunny',
    });

    onClose();
  };

  const handleLoadUserExample = () => {
    setTemp('31');
    setHumidity('58');
    setSoilMoisture('37');
    setWeather('Cloudy');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
                <Sliders className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                Enter Overall Farm Sensor Data
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Manual Sensor Input — Pre-Hardware Demo (Editable directly on Dashboard)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Architecture Reminder Notice */}
          <div className="p-3 bg-stone-100 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 space-y-1">
            <span className="font-bold text-stone-800 dark:text-stone-200 block">
              Dashboard Sensor Data &ne; Digital Twin Section Data
            </span>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              These values represent the overall farm-level telemetry. Saving updates the Dashboard cards immediately without leaving the page.
            </p>
          </div>

          {/* Quick Example Button */}
          <div className="flex justify-between items-center">
            <span className="font-bold text-stone-700 dark:text-stone-300">
              Farm-Level Sensor Values:
            </span>
            <button
              type="button"
              onClick={handleLoadUserExample}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              Load Example (31°C, 58%, 37%, Cloudy)
            </button>
          </div>

          {/* Temperature */}
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              Overall Farm Temperature (°C)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 31"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-2.5 text-stone-400 text-xs font-semibold">°C</span>
            </div>
          </div>

          {/* Humidity */}
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              Overall Farm Humidity (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="e.g. 58"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-2.5 text-stone-400 text-xs font-semibold">%</span>
            </div>
          </div>

          {/* Soil Moisture */}
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-teal-600" />
              Overall Farm Soil Moisture (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="e.g. 37"
                value={soilMoisture}
                onChange={(e) => setSoilMoisture(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-2.5 text-stone-400 text-xs font-semibold">%</span>
            </div>
          </div>

          {/* Weather */}
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 flex items-center gap-1.5">
              <CloudSun className="w-3.5 h-3.5 text-amber-500" />
              Overall Farm Weather
            </label>
            <input
              type="text"
              placeholder="e.g. Cloudy, Sunny, Partly Cloudy"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              Save Sensor Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
