import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { SectionData, SectionDirection } from '../types/farm';
import {
  HeartPulse,
  Filter,
  ArrowUpDown,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  BarChart3,
  GitCompare,
  Thermometer,
  Droplets,
  Layers,
} from 'lucide-react';

export const CropHealthView: React.FC = () => {
  const { farmConfig, setSelectedSection } = useFarm();

  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [comparisonIds, setComparisonIds] = useState<string[]>(['A-North', 'A-East']);

  // Flatten all sections
  const allSections: SectionData[] = useMemo(() => {
    const list: SectionData[] = [];
    const dirs: SectionDirection[] = ['North', 'South', 'East', 'West'];
    farmConfig.zones.forEach((z) => {
      dirs.forEach((d) => {
        if (z.sections[d]) {
          list.push(z.sections[d]);
        }
      });
    });
    return list;
  }, [farmConfig]);

  // Filtered sections
  const filteredSections = useMemo(() => {
    return allSections.filter((sec) => {
      const matchZone = selectedZone === 'all' || sec.zoneId === selectedZone;
      const matchStatus = selectedStatus === 'all' || sec.calculatedHealth.status === selectedStatus;
      return matchZone && matchStatus;
    });
  }, [allSections, selectedZone, selectedStatus]);

  // Selected sections for direct comparison
  const comparisonSections = useMemo(() => {
    return allSections.filter((sec) => comparisonIds.includes(sec.id));
  }, [allSections, comparisonIds]);

  const toggleComparison = (id: string) => {
    setComparisonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Healthy':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Healthy
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
            Warning
          </span>
        );
      case 'High Risk':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
            <AlertTriangle className="w-3 h-3 mr-1 text-orange-600" />
            High Risk
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <AlertOctagon className="w-3 h-3 mr-1 text-rose-600" />
            Critical
          </span>
        );
      case 'Awaiting Input':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            <HelpCircle className="w-3 h-3 mr-1 text-stone-500" />
            Awaiting Input
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-emerald-600" />
            Crop Health Diagnostics & Comparative Matrix
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Compare Section-level health across zones. All metrics are calculated deterministically from user-entered inputs.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Zone filter */}
          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-500 font-medium">Zone:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-transparent font-semibold text-stone-900 dark:text-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Zones</option>
              {farmConfig.zones.map((z) => (
                <option key={z.id} value={z.id}>
                  Zone {z.id} ({z.crop})
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
            <span className="text-stone-500 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-semibold text-stone-900 dark:text-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Warning">Warning</option>
              <option value="High Risk">High Risk</option>
              <option value="Critical">Critical</option>
              <option value="Awaiting Input">Awaiting Input</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Side-by-Side Section Comparator */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-emerald-600" />
              Side-by-Side Section Comparison
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Select any number of sections from the telemetry table below to compare directly. Currently comparing {comparisonSections.length} {comparisonSections.length === 1 ? 'section' : 'sections'}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setComparisonIds(allSections.map((s) => s.id))}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800 cursor-pointer transition"
            >
              Select All ({allSections.length})
            </button>
            {comparisonIds.length > 0 && (
              <button
                onClick={() => setComparisonIds([])}
                className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-stone-600 dark:text-stone-300 font-semibold border border-stone-200 dark:border-stone-700 cursor-pointer transition"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {comparisonSections.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            No sections currently selected for comparison. Use the checkboxes in the table below to select any number of sections to compare.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {comparisonSections.map((sec) => {
            const h = sec.calculatedHealth;
            return (
              <div
                key={sec.id}
                className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-emerald-600 text-white">
                      Zone {sec.zoneId} • {sec.direction}
                    </span>
                    {getStatusBadge(h.status)}
                  </div>

                  <h4 className="font-semibold text-sm text-stone-900 dark:text-white truncate" title={sec.crop}>
                    {sec.crop}
                  </h4>
                  <span className="text-[11px] text-stone-500 block mb-3">
                    {sec.plantCount.toLocaleString()} plants
                  </span>

                  {/* Health Score Pill */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 mb-3">
                    <div className="flex justify-between items-baseline text-xs mb-1">
                      <span className="text-stone-500 font-medium">Calculated Score</span>
                      <span className="font-extrabold text-stone-900 dark:text-white">
                        {h.healthScore !== null ? `${h.healthScore} / 100` : 'Awaiting Input'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-700 overflow-hidden">
                      <div
                        style={{ width: `${h.healthScore ?? 0}%` }}
                        className={`h-full ${
                          (h.healthScore ?? 0) >= 80
                            ? 'bg-emerald-600'
                            : (h.healthScore ?? 0) >= 60
                            ? 'bg-amber-500'
                            : (h.healthScore ?? 0) >= 40
                            ? 'bg-orange-600'
                            : 'bg-rose-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Temperature:</span>
                      <span className="font-semibold text-stone-900 dark:text-white">
                        {sec.manualInputs.temperature !== null ? `${sec.manualInputs.temperature}°C` : 'Awaiting input'}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Soil Moisture:</span>
                      <span className="font-semibold text-stone-900 dark:text-white">
                        {sec.manualInputs.soilMoisture !== null ? `${sec.manualInputs.soilMoisture}%` : 'Awaiting input'}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Humidity:</span>
                      <span className="font-semibold text-stone-900 dark:text-white">
                        {sec.manualInputs.humidity !== null ? `${sec.manualInputs.humidity}%` : 'Awaiting input'}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Risk Level:</span>
                      <span className="font-semibold text-stone-900 dark:text-white">
                        {h.riskLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800">
                  <button
                    onClick={() => setSelectedSection(sec)}
                    className="w-full py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                  >
                    Edit / Enter Sensor Data
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Visual Bar Chart: Section Health Scores */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          Section Health Score Comparison Chart
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
          Real-time score per section computed from manual environmental inputs (0 - 100 agronomical index).
        </p>

        {/* Responsive Custom SVG Bar Chart */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[650px] space-y-2">
            {allSections.map((sec) => {
              const score = sec.calculatedHealth.healthScore ?? 0;
              const hasData = sec.calculatedHealth.healthScore !== null;

              return (
                <div key={sec.id} className="flex items-center gap-3 text-xs">
                  <span className="w-24 font-bold text-stone-700 dark:text-stone-300 truncate">
                    Zone {sec.zoneId} - {sec.direction}
                  </span>

                  <div className="flex-1 h-6 bg-stone-100 dark:bg-stone-800 rounded-md overflow-hidden relative border border-stone-200 dark:border-stone-700 flex items-center">
                    {hasData ? (
                      <div
                        style={{ width: `${score}%` }}
                        className={`h-full transition-all duration-300 flex items-center justify-end pr-2 text-[10px] font-bold text-white ${
                          score >= 80
                            ? 'bg-emerald-600'
                            : score >= 60
                            ? 'bg-amber-500 text-stone-900'
                            : score >= 40
                            ? 'bg-orange-600'
                            : 'bg-rose-600'
                        }`}
                      >
                        {score > 15 ? `${score}%` : ''}
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-400 px-2 italic">Awaiting Input</span>
                    )}
                  </div>

                  <span className="w-20 text-right font-semibold text-stone-900 dark:text-white">
                    {hasData ? `${score} pts` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comprehensive Section Telemetry Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="p-4 bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Complete Section-Level Telemetry & Risk Log
          </h3>
          <span className="text-xs text-stone-500">
            Showing {filteredSections.length} of {allSections.length} sections
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/75 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="py-3 px-4">Compare</th>
                <th className="py-3 px-4">Section ID</th>
                <th className="py-3 px-4">Zone & Direction</th>
                <th className="py-3 px-4">Crop</th>
                <th className="py-3 px-4">Plants</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Temp (°C)</th>
                <th className="py-3 px-4">Humidity (%)</th>
                <th className="py-3 px-4">Moisture (%)</th>
                <th className="py-3 px-4">Primary Risk Factor</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
              {filteredSections.map((sec) => {
                const h = sec.calculatedHealth;
                const isCompared = comparisonIds.includes(sec.id);

                return (
                  <tr
                    key={sec.id}
                    className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleComparison(sec.id)}
                        className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Toggle inclusion in side-by-side comparison"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900 dark:text-white">
                      {sec.id}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      Zone {sec.zoneId} - {sec.direction}
                    </td>
                    <td className="py-3 px-4">{sec.crop}</td>
                    <td className="py-3 px-4">{sec.plantCount.toLocaleString()}</td>
                    <td className="py-3 px-4">{getStatusBadge(h.status)}</td>
                    <td className="py-3 px-4 font-semibold">{h.riskLevel}</td>
                    <td className="py-3 px-4">
                      {sec.manualInputs.temperature !== null ? `${sec.manualInputs.temperature}°C` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {sec.manualInputs.humidity !== null ? `${sec.manualInputs.humidity}%` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {sec.manualInputs.soilMoisture !== null ? `${sec.manualInputs.soilMoisture}%` : '—'}
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate" title={h.warnings[0]}>
                      {h.warnings[0] || 'Optimal'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedSection(sec)}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
