import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { SectionData, SectionDirection } from '../types/farm';
import { generateAllPlantGroups } from '../utils/plantAddressing';
import {
  FileSpreadsheet,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Building,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  CloudSun,
  HeartPulse,
  Leaf,
  X,
  Compass,
  Boxes,
} from 'lucide-react';
import { FarmBadgeLogo } from '../utils/farmLogo';
import { generateReportPDF } from '../utils/generatePdfReport';

export const ReportsView: React.FC = () => {
  const { farmConfig, summaryStats } = useFarm();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  // All plant groups across farm (Zone -> Section -> Plant Group -> Shared Address)
  const allPlantGroups = useMemo(() => {
    return generateAllPlantGroups(farmConfig.zones);
  }, [farmConfig.zones]);

  // Aggregate all sections across all zones
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

  // Aggregate plant counts per status
  const plantBreakdown = useMemo(() => {
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

  // Calculate Overall Crop Health Score
  const overallHealthScore = useMemo(() => {
    const scores = allSections
      .map((s) => s.calculatedHealth.healthScore)
      .filter((score): score is number => score !== null);

    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [allSections]);

  // Current overall sensor readings (single source of truth)
  const currentTemp =
    farmConfig.overallTemperature !== undefined && farmConfig.overallTemperature !== null
      ? `${farmConfig.overallTemperature}°C`
      : summaryStats.avgTemp !== null
      ? `${summaryStats.avgTemp}°C`
      : 'Awaiting input';

  const currentHumidity =
    farmConfig.overallHumidity !== undefined && farmConfig.overallHumidity !== null
      ? `${farmConfig.overallHumidity}%`
      : summaryStats.avgHumidity !== null
      ? `${summaryStats.avgHumidity}%`
      : 'Awaiting input';

  const currentMoisture =
    farmConfig.overallSoilMoisture !== undefined && farmConfig.overallSoilMoisture !== null
      ? `${farmConfig.overallSoilMoisture}%`
      : summaryStats.avgMoisture !== null
      ? `${summaryStats.avgMoisture}%`
      : 'Awaiting input';

  const currentWeather = farmConfig.weatherCondition || 'Sunny';

  // Warnings & Critical information across sections
  const warningSections = useMemo(() => {
    return allSections.filter(
      (s) =>
        s.calculatedHealth.status === 'Critical' ||
        s.calculatedHealth.status === 'High Risk' ||
        s.calculatedHealth.status === 'Warning'
    );
  }, [allSections]);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      'Zone',
      'Section',
      'Crop',
      'Plant Count',
      'Health Status',
      'Health Score (%)',
      'Risk Level',
      'Temperature (C)',
      'Humidity (%)',
      'Soil Moisture (%)',
      'Rainfall (mm)',
      'Primary Warnings',
    ];

    const rows = allSections.map((sec) => [
      sec.zoneId,
      sec.direction,
      `"${sec.crop}"`,
      sec.plantCount,
      sec.calculatedHealth.status,
      sec.calculatedHealth.healthScore ?? 'N/A',
      sec.calculatedHealth.riskLevel,
      sec.manualInputs.temperature ?? 'N/A',
      sec.manualInputs.humidity ?? 'N/A',
      sec.manualInputs.soilMoisture ?? 'N/A',
      sec.manualInputs.rainfall ?? 'N/A',
      `"${sec.calculatedHealth.warnings.join('; ') || 'Optimal'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${farmConfig.farmName.replace(/\s+/g, '_')}_Executive_Report.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dedicated Real PDF Generator & Download Handler (using jsPDF & AutoTable)
  const handleGeneratePDF = async () => {
    setIsGeneratingPdf(true);
    setPrintError(null);
    setPdfSuccess(null);

    try {
      // Small timeout allows button to immediately display "Generating PDF..."
      await new Promise((resolve) => setTimeout(resolve, 150));

      generateReportPDF({
        farmConfig,
        currentTemp,
        currentHumidity,
        currentMoisture,
        currentWeather,
        overallHealthScore,
        plantBreakdown,
        allSections,
        warningSections,
        formattedDate,
      });

      setPdfSuccess('Farm Health & Telemetry Report PDF generated and downloaded successfully!');
      setTimeout(() => setPdfSuccess(null), 4500);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setPrintError('Unable to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* 1. Interactive Action Header (Strictly hidden in printed PDF) */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Executive Farm Health & Telemetry Report
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Synchronized audit generated from current farm configuration, agronomic sensor inputs, and zone telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Real PDF Generator Button */}
          <button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPdf}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            title="Generate and download actual PDF file"
          >
            {isGeneratingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success notification upon PDF generation */}
      {pdfSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pdfSuccess}</span>
          </div>
          <button onClick={() => setPdfSuccess(null)} className="p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error notification if PDF generation fails */}
      {printError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{printError}</span>
          </div>
          <button onClick={() => setPrintError(null)} className="p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. DEDICATED REPORT PREVIEW (Mirrors the generated PDF) */}
      <div className="printable-report bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-4 print:text-black print:bg-white">
        
        {/* Document Header */}
        <div className="border-b-2 border-stone-200 dark:border-stone-800 print:border-stone-400 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs print:border print:border-stone-400">
              <FarmBadgeLogo logoId={farmConfig.farmLogo} className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 print:text-emerald-800 uppercase tracking-widest block">
                AI FARMTWIN &bull; EXECUTIVE REPORT &bull; AUDIT SUMMARY
              </span>
              <h1 className="text-2xl font-black text-stone-900 dark:text-white print:text-black mt-0.5">
                {farmConfig.farmName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-stone-600 dark:text-stone-300 print:text-stone-800">
                <span>
                  Farm Manager: <strong className="text-stone-900 dark:text-white print:text-black">{farmConfig.farmManager || 'Alex Mercer'}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Date: <strong className="text-stone-900 dark:text-white print:text-black">{formattedDate}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Acreage: <strong className="text-stone-900 dark:text-white print:text-black">{farmConfig.acres} Acres</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-stone-500 dark:text-stone-400 print:text-stone-700 space-y-1 self-start sm:self-auto">
            <div>
              Total Plots: <strong className="text-stone-800 dark:text-stone-200 print:text-black">{farmConfig.zoneCount} Zones ({farmConfig.zoneCount * 4} Sections)</strong>
            </div>
            <div>
              Total Plants: <strong className="text-stone-800 dark:text-stone-200 print:text-black">{farmConfig.totalPlants.toLocaleString()} Plants</strong>
            </div>
            <div className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 print:text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Telemetry Synchronized</span>
            </div>
          </div>
        </div>

        {/* Section 1: Overall Farm Sensor Readings & Environmental Telemetry */}
        <div className="print-avoid-break space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 print:text-black flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-emerald-600" />
            1. Current Overall Farm Sensor Readings
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {/* Temp */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 print:bg-stone-50 border border-stone-200 dark:border-stone-700 print:border-stone-300">
              <span className="text-[10px] text-stone-500 print:text-stone-600 uppercase font-bold block">Overall Temperature</span>
              <span className="text-lg font-black text-stone-900 dark:text-white print:text-black mt-1 block">
                {currentTemp}
              </span>
              <span className="text-[10px] text-stone-400 print:text-stone-600">Thermal condition</span>
            </div>

            {/* Humidity */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 print:bg-stone-50 border border-stone-200 dark:border-stone-700 print:border-stone-300">
              <span className="text-[10px] text-stone-500 print:text-stone-600 uppercase font-bold block">Overall Humidity</span>
              <span className="text-lg font-black text-stone-900 dark:text-white print:text-black mt-1 block">
                {currentHumidity}
              </span>
              <span className="text-[10px] text-stone-400 print:text-stone-600">Atmospheric moisture</span>
            </div>

            {/* Soil Moisture */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 print:bg-stone-50 border border-stone-200 dark:border-stone-700 print:border-stone-300">
              <span className="text-[10px] text-stone-500 print:text-stone-600 uppercase font-bold block">Overall Soil Moisture</span>
              <span className="text-lg font-black text-stone-900 dark:text-white print:text-black mt-1 block">
                {currentMoisture}
              </span>
              <span className="text-[10px] text-stone-400 print:text-stone-600">Root-zone hydration</span>
            </div>

            {/* Weather */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 print:bg-stone-50 border border-stone-200 dark:border-stone-700 print:border-stone-300">
              <span className="text-[10px] text-stone-500 print:text-stone-600 uppercase font-bold block">Farm Weather</span>
              <span className="text-base font-black text-stone-900 dark:text-white print:text-black mt-1 block truncate">
                {currentWeather}
              </span>
              <span className="text-[10px] text-stone-400 print:text-stone-600">Sky condition</span>
            </div>

            {/* Crop Health */}
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 print:bg-emerald-50 border border-emerald-200 dark:border-emerald-800 print:border-emerald-300">
              <span className="text-[10px] text-emerald-800 print:text-emerald-900 uppercase font-bold block">Overall Crop Health</span>
              <span className="text-lg font-black text-emerald-900 dark:text-emerald-200 print:text-emerald-900 mt-1 block">
                {overallHealthScore !== null ? `${overallHealthScore}%` : 'Awaiting'}
              </span>
              <span className="text-[10px] text-emerald-700 print:text-emerald-800 font-semibold">
                {overallHealthScore !== null && overallHealthScore >= 80
                  ? 'Healthy'
                  : overallHealthScore !== null && overallHealthScore >= 60
                  ? 'Warning'
                  : overallHealthScore !== null
                  ? 'At Risk'
                  : 'Pending inputs'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Plant Health Classification Inventory Breakdown */}
        <div className="print-avoid-break space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 print:text-black flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            2. Plant Inventory Health Distribution ({farmConfig.totalPlants.toLocaleString()} Total Plants)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {/* Healthy */}
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 print:bg-emerald-50 border border-emerald-200 dark:border-emerald-800 print:border-emerald-300">
              <span className="font-bold text-emerald-800 print:text-emerald-900 flex items-center gap-1">
                <span>🟢</span>
                Healthy Plants
              </span>
              <span className="text-xl font-black text-emerald-900 dark:text-emerald-100 print:text-black block mt-1">
                {plantBreakdown.healthy.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-700 print:text-emerald-800 font-semibold">
                {farmConfig.totalPlants > 0 ? Math.round((plantBreakdown.healthy / farmConfig.totalPlants) * 100) : 0}% of farm
              </span>
            </div>

            {/* Warning */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 print:bg-amber-50 border border-amber-200 dark:border-amber-800 print:border-amber-300">
              <span className="font-bold text-amber-800 print:text-amber-900 flex items-center gap-1">
                <span>🟡</span>
                Warning Plants
              </span>
              <span className="text-xl font-black text-amber-900 dark:text-amber-100 print:text-black block mt-1">
                {plantBreakdown.warning.toLocaleString()}
              </span>
              <span className="text-[10px] text-amber-700 print:text-amber-800 font-semibold">
                {farmConfig.totalPlants > 0 ? Math.round((plantBreakdown.warning / farmConfig.totalPlants) * 100) : 0}% of farm
              </span>
            </div>

            {/* High Risk */}
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 print:bg-orange-50 border border-orange-200 dark:border-orange-800 print:border-orange-300">
              <span className="font-bold text-orange-800 print:text-orange-900 flex items-center gap-1">
                <span>🟠</span>
                High-Risk Plants
              </span>
              <span className="text-xl font-black text-orange-900 dark:text-orange-100 print:text-black block mt-1">
                {plantBreakdown.highRisk.toLocaleString()}
              </span>
              <span className="text-[10px] text-orange-700 print:text-orange-800 font-semibold">
                {farmConfig.totalPlants > 0 ? Math.round((plantBreakdown.highRisk / farmConfig.totalPlants) * 100) : 0}% of farm
              </span>
            </div>

            {/* Critical */}
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 print:bg-rose-50 border border-rose-200 dark:border-rose-800 print:border-rose-300">
              <span className="font-bold text-rose-800 print:text-rose-900 flex items-center gap-1">
                <span>🔴</span>
                Critical Plants
              </span>
              <span className="text-xl font-black text-rose-900 dark:text-rose-100 print:text-black block mt-1">
                {plantBreakdown.critical.toLocaleString()}
              </span>
              <span className="text-[10px] text-rose-700 print:text-rose-800 font-semibold">
                {farmConfig.totalPlants > 0 ? Math.round((plantBreakdown.critical / farmConfig.totalPlants) * 100) : 0}% of farm
              </span>
            </div>

            {/* Awaiting Input */}
            <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 print:bg-stone-100 border border-stone-200 dark:border-stone-700 print:border-stone-300">
              <span className="font-bold text-stone-700 print:text-stone-800 flex items-center gap-1">
                <span>⚪</span>
                Awaiting Input
              </span>
              <span className="text-xl font-black text-stone-900 dark:text-white print:text-black block mt-1">
                {plantBreakdown.awaiting.toLocaleString()}
              </span>
              <span className="text-[10px] text-stone-500 print:text-stone-600 font-semibold">
                {farmConfig.totalPlants > 0 ? Math.round((plantBreakdown.awaiting / farmConfig.totalPlants) * 100) : 0}% of farm
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Zone-Wise Summary Matrix */}
        <div className="print-avoid-break space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 print:text-black flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            3. Zone-Wise Summary
          </h2>

          <div className="border border-stone-200 dark:border-stone-800 print:border-stone-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 dark:bg-stone-800 print:bg-stone-100 text-stone-700 dark:text-stone-300 print:text-black font-bold border-b border-stone-200 dark:border-stone-700 print:border-stone-300">
                <tr>
                  <th className="py-2.5 px-3">Zone ID</th>
                  <th className="py-2.5 px-3">Crop Variety</th>
                  <th className="py-2.5 px-3">Total Plants</th>
                  <th className="py-2.5 px-3">North Section</th>
                  <th className="py-2.5 px-3">South Section</th>
                  <th className="py-2.5 px-3">East Section</th>
                  <th className="py-2.5 px-3">West Section</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800 print:divide-stone-200 text-stone-800 dark:text-stone-200 print:text-black">
                {farmConfig.zones.map((zone) => (
                  <tr key={zone.id}>
                    <td className="py-2 px-3 font-black font-mono">Zone {zone.id}</td>
                    <td className="py-2 px-3 font-medium">{zone.crop}</td>
                    <td className="py-2 px-3 font-bold">{zone.totalPlants.toLocaleString()}</td>
                    <td className="py-2 px-3">{zone.sections.North.calculatedHealth.status}</td>
                    <td className="py-2 px-3">{zone.sections.South.calculatedHealth.status}</td>
                    <td className="py-2 px-3">{zone.sections.East.calculatedHealth.status}</td>
                    <td className="py-2 px-3">{zone.sections.West.calculatedHealth.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Section-Wise Crop Health & Telemetry Detail */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 print:text-black flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-600" />
            4. Section-Wise Crop Health & Telemetry Matrix
          </h2>

          <div className="border border-stone-200 dark:border-stone-800 print:border-stone-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 dark:bg-stone-800 print:bg-stone-100 text-stone-700 dark:text-stone-300 print:text-black font-bold border-b border-stone-200 dark:border-stone-700 print:border-stone-300">
                <tr>
                  <th className="py-2 px-2.5">Section</th>
                  <th className="py-2 px-2.5">Crop</th>
                  <th className="py-2 px-2.5">Plants</th>
                  <th className="py-2 px-2.5">Temp</th>
                  <th className="py-2 px-2.5">Humidity</th>
                  <th className="py-2 px-2.5">Soil Moist</th>
                  <th className="py-2 px-2.5">Health Score</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5">Primary Agronomic Stress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800 print:divide-stone-200 text-stone-800 dark:text-stone-200 print:text-black text-[11px]">
                {allSections.map((sec) => (
                  <tr key={sec.id}>
                    <td className="py-1.5 px-2.5 font-bold font-mono">
                      Zone {sec.zoneId} &bull; {sec.direction}
                    </td>
                    <td className="py-1.5 px-2.5">{sec.crop}</td>
                    <td className="py-1.5 px-2.5 font-semibold">{sec.plantCount}</td>
                    <td className="py-1.5 px-2.5">
                      {sec.manualInputs.temperature !== null ? `${sec.manualInputs.temperature}°C` : '—'}
                    </td>
                    <td className="py-1.5 px-2.5">
                      {sec.manualInputs.humidity !== null ? `${sec.manualInputs.humidity}%` : '—'}
                    </td>
                    <td className="py-1.5 px-2.5">
                      {sec.manualInputs.soilMoisture !== null ? `${sec.manualInputs.soilMoisture}%` : '—'}
                    </td>
                    <td className="py-1.5 px-2.5 font-bold">
                      {sec.calculatedHealth.healthScore !== null ? `${sec.calculatedHealth.healthScore}%` : '—'}
                    </td>
                    <td className="py-1.5 px-2.5">
                      <span className="font-semibold">
                        {sec.calculatedHealth.status === 'Healthy'
                          ? '🟢 Healthy'
                          : sec.calculatedHealth.status === 'Warning'
                          ? '🟡 Warning'
                          : sec.calculatedHealth.status === 'High Risk'
                          ? '🟠 High Risk'
                          : sec.calculatedHealth.status === 'Critical'
                          ? '🔴 Critical'
                          : '⚪ Awaiting'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 truncate max-w-[200px]" title={sec.calculatedHealth.warnings.join(' • ')}>
                      {sec.calculatedHealth.warnings.length > 0
                        ? sec.calculatedHealth.warnings[0]
                        : 'Optimal parameters'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Plant Group Addressing & Shared Location Inventory (Zone -> Section -> Plant Group -> Shared Address) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 print:text-black flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-emerald-600" />
              5. Plant Group Addressing & Shared Location Inventory ({allPlantGroups.length} Plant Groups of 10)
            </h2>
            <span className="text-[10px] text-stone-500 font-mono">
              Zone &rarr; Section &rarr; Plant Group &rarr; Shared Address
            </span>
          </div>

          <div className="border border-stone-200 dark:border-stone-800 print:border-stone-300 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 dark:bg-stone-800 print:bg-stone-100 text-stone-700 dark:text-stone-300 print:text-black font-bold border-b border-stone-200 dark:border-stone-700 print:border-stone-300 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">Zone</th>
                  <th className="py-2 px-3">Section</th>
                  <th className="py-2 px-3">Group ID</th>
                  <th className="py-2 px-3">Shared Physical Address</th>
                  <th className="py-2 px-3">Plants</th>
                  <th className="py-2 px-3">Plant Range</th>
                  <th className="py-2 px-3">Health Status</th>
                  <th className="py-2 px-3">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800 print:divide-stone-200 text-stone-800 dark:text-stone-200 print:text-black text-[11px]">
                {allPlantGroups.map((grp) => (
                  <tr key={grp.address}>
                    <td className="py-1.5 px-3 font-semibold">Zone {grp.zoneId}</td>
                    <td className="py-1.5 px-3">{grp.sectionDirection}</td>
                    <td className="py-1.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {grp.groupCode}
                    </td>
                    <td className="py-1.5 px-3 font-medium">
                      {grp.address}
                    </td>
                    <td className="py-1.5 px-3 font-mono">{grp.plantCount}</td>
                    <td className="py-1.5 px-3 font-mono text-stone-500">{grp.plantsSummary}</td>
                    <td className="py-1.5 px-3 font-semibold">
                      {grp.status}
                    </td>
                    <td className="py-1.5 px-3">{grp.riskLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 6: Relevant Warning / Critical Information */}
        <div className="print-avoid-break space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 print:text-rose-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            6. Relevant Warning & Critical Crop Information
          </h2>

          {warningSections.length === 0 ? (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 print:bg-emerald-50 rounded-xl border border-emerald-200 dark:border-emerald-800 print:border-emerald-300 text-xs text-emerald-900 print:text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All monitored zones and sections are currently operating within nominal agronomic thresholds. No critical alerts active.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {warningSections.map((sec) => (
                <div
                  key={`warn-${sec.id}`}
                  className="p-3 rounded-xl border border-rose-300 dark:border-rose-900 print:border-stone-400 bg-rose-50/50 dark:bg-rose-950/20 print:bg-stone-50 space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-stone-900 dark:text-white print:text-black">
                      Zone {sec.zoneId} — {sec.direction} Section ({sec.crop})
                    </span>
                    <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 print:bg-stone-200 text-rose-700 dark:text-rose-300 print:text-black border border-rose-200 print:border-stone-400">
                      {sec.calculatedHealth.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 dark:text-stone-300 print:text-black">
                    Telemetry: Temp <strong>{sec.manualInputs.temperature ?? '—'}°C</strong> &bull; Humidity <strong>{sec.manualInputs.humidity ?? '—'}%</strong> &bull; Soil Moisture <strong>{sec.manualInputs.soilMoisture ?? '—'}%</strong>
                  </div>
                  <div className="text-[11px] text-rose-800 dark:text-rose-300 print:text-black font-medium">
                    Alert: {sec.calculatedHealth.warnings.join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Footer & Certification */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 print:border-stone-400 flex flex-col sm:flex-row justify-between items-center text-[10px] text-stone-500 print:text-stone-700 gap-2">
          <p>
            AI FarmTwin Prototype &copy; 2026. &ldquo;Predict. Simulate. Protect.&rdquo; Agronomic deterministic engine.
          </p>
          <p>
            Document generated from live state on {formattedDate}. Formatted for A4 PDF Archival.
          </p>
        </div>
      </div>
    </div>
  );
};
