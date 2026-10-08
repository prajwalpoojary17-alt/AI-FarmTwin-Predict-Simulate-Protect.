import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { Thermometer, Droplets, CloudSun, User, Sparkles, Cpu, Sliders } from 'lucide-react';
import { OverallFarmSensorModal } from './OverallFarmSensorModal';
import { FarmBadgeLogo } from '../utils/farmLogo';

export const TopBar: React.FC = () => {
  const { farmConfig, summaryStats } = useFarm();
  const [overallModalOpen, setOverallModalOpen] = useState(false);

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

  return (
    <>
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-30 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 gap-2.5">
            {/* Left: Farm title & Prototype Mode indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
                  <FarmBadgeLogo logoId={farmConfig.farmLogo} className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <Cpu className="w-3 h-3 mr-1" />
                  Digital Twin Prototype
                </span>
                <span className="text-xs text-stone-700 dark:text-stone-300 hidden sm:inline">
                  Manual Input Layer (Pre-Hardware Mode)
                </span>
              </div>
            </div>

            {/* Center/Right: Top Farm Information Bar */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              {/* Overall Farm Temperature */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                title="Overall farm temperature"
              >
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-stone-500 dark:text-stone-400">Temp:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {tempDisplay}
                </span>
              </div>

              {/* Overall Farm Humidity */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                title="Overall farm humidity"
              >
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-stone-500 dark:text-stone-400">Humidity:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {humidityDisplay}
                </span>
              </div>

              {/* Overall Farm Soil Moisture */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                title="Overall farm soil moisture"
              >
                <Droplets className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-stone-500 dark:text-stone-400">Soil Moisture:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {moistureDisplay}
                </span>
              </div>

              {/* Current Farm Weather Condition */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                title="Current farm weather condition (user configured)"
              >
                <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-stone-500 dark:text-stone-400">Weather:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {farmConfig.weatherCondition || 'Awaiting input'}
                </span>
              </div>

              {/* Farm Manager Name */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-stone-500 dark:text-stone-400">Manager:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {farmConfig.farmManager || 'Not entered'}
                </span>
              </div>

              {/* Fast action: Enter Sensor Data opens overall modal directly */}
              <button
                onClick={() => setOverallModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition shadow-xs cursor-pointer"
                title="Enter overall farm sensor values"
              >
                <Sliders className="w-3.5 h-3.5" />
                Enter Sensor Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal directly opened, keeps user on current page */}
      <OverallFarmSensorModal
        isOpen={overallModalOpen}
        onClose={() => setOverallModalOpen(false)}
      />
    </>
  );
};
