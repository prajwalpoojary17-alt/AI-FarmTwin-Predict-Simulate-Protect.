import React, { useState, useEffect, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Settings,
  Building,
  User,
  Layers,
  Leaf,
  Sun,
  Moon,
  CheckCircle2,
  CloudSun,
} from 'lucide-react';
import { FARM_LOGOS } from '../utils/farmLogo';

export const SettingsView: React.FC = () => {
  const {
    farmConfig,
    updateFarmConfig,
    setZoneCount,
    updateZoneCropAndPlants,
  } = useFarm();

  const [farmName, setFarmName] = useState(farmConfig.farmName);
  const [manager, setManager] = useState(farmConfig.farmManager);
  const [acres, setAcres] = useState(farmConfig.acres.toString());
  const [weatherCondition, setWeatherCondition] = useState(farmConfig.weatherCondition);
  const [theme, setTheme] = useState<'light' | 'dark'>(farmConfig.theme);
  const [farmLogo, setFarmLogo] = useState(farmConfig.farmLogo);

  const [zoneCountInput, setZoneCountInput] = useState(farmConfig.zoneCount);

  // ONE SOURCE OF TRUTH: Total Farm Plants is dynamically calculated from the sum of all zones
  const totalCalculatedPlants = useMemo(() => {
    return farmConfig.zones.reduce((sum, z) => sum + (Number(z.totalPlants) || 0), 0);
  }, [farmConfig.zones]);

  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  // Keep state in sync if farmConfig changes
  useEffect(() => {
    setTheme(farmConfig.theme);
  }, [farmConfig.theme]);

  useEffect(() => {
    setFarmLogo(farmConfig.farmLogo);
  }, [farmConfig.farmLogo]);

  // When zoneCount changes in settings:
  // Existing zones retain their allocated plants; adding a zone adds 500 plants; removing a zone subtracts its plants
  const handleZoneCountChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(10, newCount));
    setZoneCountInput(clamped);
    setZoneCount(clamped);
  };

  const handleZoneCropChange = (id: string, newCrop: string) => {
    const item = farmConfig.zones.find((z) => z.id === id);
    if (item) {
      updateZoneCropAndPlants(id, newCrop, item.totalPlants);
    }
  };

  // When a zone's "Allocated Plants" changes, immediately recalculate total farm plants across the entire app
  const handleZonePlantsChange = (id: string, newPlants: number) => {
    const safePlants = Math.max(0, isNaN(newPlants) ? 0 : newPlants);
    const item = farmConfig.zones.find((z) => z.id === id);
    if (item) {
      updateZoneCropAndPlants(id, item.crop, safePlants);
    }
  };

  // Immediate Theme Switcher
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    updateFarmConfig({ theme: newTheme });
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Immediate Farm Badge Logo Switcher
  const handleLogoChange = (newLogoId: string) => {
    setFarmLogo(newLogoId);
    updateFarmConfig({ farmLogo: newLogoId });
  };

  const handleSaveFarmInfo = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAcres = parseFloat(acres) || farmConfig.acres;

    updateFarmConfig({
      farmName: farmName.trim() || 'Verdant Horizon Smart Farm',
      farmManager: manager.trim() || 'Alex Mercer',
      acres: parsedAcres,
      totalPlants: totalCalculatedPlants,
      weatherCondition: weatherCondition.trim() || 'Sunny',
      theme,
      farmLogo,
    });

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setSavedNotification(
      `Farm configuration saved! Total plants (${totalCalculatedPlants.toLocaleString()}) synchronized across all pages.`
    );
    setTimeout(() => setSavedNotification(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Farm Digital Twin Configuration
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Modify farm identity, dynamic zones, crop allocations, theme, and farm badge logo.
          </p>
        </div>
      </div>

      {savedNotification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedNotification}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveFarmInfo} className="space-y-6">
        {/* Section 1: Appearance & Farm Badge Logo */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
            <Sun className="w-4 h-4 text-emerald-600" />
            Interface Appearance & Farm Badge Logo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Theme Toggle */}
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-2">
                Interface Color Theme (Switches Complete Application)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer font-bold ${
                    theme === 'light'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light Theme</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer font-bold ${
                    theme === 'dark'
                      ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Dark Theme</span>
                </button>
              </div>
            </div>

            {/* Farm Badge Logo Select */}
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-2">
                Farm Badge Logo (Updates Top-Left Branding & Headers)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FARM_LOGOS.map((l) => {
                  const Icon = l.icon;
                  const isSelected = farmLogo === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleLogoChange(l.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/30 shadow-xs'
                          : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                      title={`Select ${l.label}`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
                      <span className="text-[11px] truncate">{l.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: General Farm Information */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
            <Building className="w-4 h-4 text-emerald-600" />
            General Farm Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Farm Name */}
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Farm Name
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Farm Manager */}
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Farm Manager Name
              </label>
              <input
                type="text"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Acres */}
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Number of Acres
              </label>
              <input
                type="number"
                step="0.5"
                value={acres}
                onChange={(e) => setAcres(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Total Plants (Read-Only & Automatically Calculated from sum of zones) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-stone-700 dark:text-stone-300">
                  Total Plants
                </label>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Auto-Calculated from Zones
                </span>
              </div>
              <input
                type="text"
                readOnly
                value={`${totalCalculatedPlants.toLocaleString()} Plants`}
                className="w-full px-3 py-2 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white font-extrabold cursor-not-allowed select-none"
                title="Automatically calculated from the sum of plants allocated to all zones below"
              />
            </div>

            {/* Weather Condition */}
            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Current Farm Weather Condition
              </label>
              <input
                type="text"
                placeholder="e.g. Sunny, Dry Summer Afternoon, Cloudy"
                value={weatherCondition}
                onChange={(e) => setWeatherCondition(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Dynamic Farm Zone Architecture */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 dark:border-stone-800 pb-3 gap-2">
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Dynamic Farm Zones Architecture
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Adjusting zone allocations immediately updates the overall Total Plants across the entire digital twin.
              </p>
            </div>

            {/* Dynamic Zone Count Controller */}
            <div className="flex items-center gap-2 text-xs bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
              <span className="font-semibold text-stone-700 dark:text-stone-300">Total Zones:</span>
              <select
                value={farmConfig.zoneCount}
                onChange={(e) => handleZoneCountChange(parseInt(e.target.value, 10))}
                className="bg-transparent font-bold text-emerald-600 dark:text-emerald-400 focus:outline-hidden cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Zone' : 'Zones'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamically Generated Zone Cards */}
          <div className="space-y-3">
            {farmConfig.zones.map((zone) => (
              <div
                key={zone.id}
                className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 flex flex-col sm:flex-row sm:items-center gap-4 text-xs"
              >
                <div className="flex items-center gap-2 min-w-[90px]">
                  <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm">
                    {zone.id}
                  </span>
                  <span className="font-bold text-stone-900 dark:text-white">
                    Zone {zone.id}
                  </span>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-stone-500 dark:text-stone-400 block mb-0.5 font-medium">
                      Crop Variety
                    </label>
                    <input
                      type="text"
                      value={zone.crop}
                      onChange={(e) => handleZoneCropChange(zone.id, e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-medium focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500 dark:text-stone-400 block mb-0.5 font-bold">
                      Allocated Plants
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={zone.totalPlants}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        handleZonePlantsChange(zone.id, isNaN(val) ? 0 : val);
                      }}
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            Save Farm Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
