import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { Plant, PlantGroup, SectionDirection } from '../types/farm';
import { generateAllPlantGroups } from '../utils/plantAddressing';
import {
  Search,
  Filter,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  QrCode,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Compass,
  Boxes,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';

export const PlantsView: React.FC = () => {
  const { farmConfig } = useFarm();

  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inspectingGroup, setInspectingGroup] = useState<PlantGroup | null>(null);
  const [inspectingIndividualPlant, setInspectingIndividualPlant] = useState<Plant | null>(null);

  const pageSize = 20;

  // Generate all 10-plant groups dynamically from centralized farm configuration
  // ONE SOURCE OF TRUTH: All plant groups across all configured zones and sections
  const allGroups: PlantGroup[] = useMemo(() => {
    return generateAllPlantGroups(farmConfig.zones);
  }, [farmConfig.zones]);

  // Total farm-wide calculations
  const totalPlantGroups = allGroups.length;
  const totalPlantsRepresented = useMemo(() => {
    return allGroups.reduce((acc, g) => acc + g.plantCount, 0);
  }, [allGroups]);

  // Apply filters: Zone, Section, Health Status, and Search Query
  // Search matches: Group ID (e.g. N-01), Shared Address, Plant ID (e.g. P006 or A-N-P006)
  const filteredGroups = useMemo(() => {
    return allGroups.filter((group) => {
      const matchZone = selectedZone === 'all' || group.zoneId === selectedZone;
      const matchSection = selectedSection === 'all' || group.sectionDirection === selectedSection;
      const matchStatus = selectedStatus === 'all' || group.status === selectedStatus;

      const q = searchQuery.trim().toLowerCase();
      if (!q) {
        return matchZone && matchSection && matchStatus;
      }

      // 1. Matches Group ID or Code (e.g. "n-01", "group n-01")
      const matchGroupId =
        group.groupCode.toLowerCase().includes(q) ||
        group.groupId.toLowerCase().includes(q);

      // 2. Matches Shared Address (e.g. "zone a / north / group n-01")
      const matchAddress = group.address.toLowerCase().includes(q);

      // 3. Matches Plant ID range (e.g. "p001-p010")
      const matchSummary =
        group.plantsSummary.toLowerCase().includes(q) ||
        (group.plantIdRange && group.plantIdRange.toLowerCase().includes(q));

      // 4. Matches Crop
      const matchCrop = group.crop ? group.crop.toLowerCase().includes(q) : false;

      // 5. Matches ANY individual plant ID inside this group (e.g. "P006", "A-N-P006", "p6")
      const matchPlantInside = group.plants.some((p) => {
        const pIdLower = p.plantId.toLowerCase();
        if (pIdLower.includes(q)) return true;

        // Clean query for P006 or P6
        const plantNumStr = String(p.plantNumber);
        const plantPad3 = `p${plantNumStr.padStart(3, '0')}`;
        const plantPad2 = `p${plantNumStr.padStart(2, '0')}`;
        const plantPad1 = `p${plantNumStr}`;

        return (
          q === plantPad3 ||
          q === plantPad2 ||
          q === plantPad1 ||
          (q.startsWith('p') && plantNumStr === q.replace(/^p0*/i, ''))
        );
      });

      const matchSearch =
        matchGroupId || matchAddress || matchSummary || matchCrop || matchPlantInside;

      return matchZone && matchSection && matchStatus && matchSearch;
    });
  }, [allGroups, selectedZone, selectedSection, selectedStatus, searchQuery]);

  // Counts for matching groups and individual plants represented by matching groups
  const matchingGroupsCount = filteredGroups.length;
  const matchingPlantsCount = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.plantCount, 0);
  }, [filteredGroups]);

  // Pagination for the matching group records
  const totalPages = Math.ceil(matchingGroupsCount / pageSize) || 1;
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGroups.slice(start, start + pageSize);
  }, [filteredGroups, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, newPage)));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Healthy':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Healthy
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
            Warning
          </span>
        );
      case 'High Risk':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300">
            <AlertTriangle className="w-3 h-3 mr-1 text-orange-600" />
            High Risk
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <AlertOctagon className="w-3 h-3 mr-1 text-rose-600" />
            Critical
          </span>
        );
      case 'Awaiting Input':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            <HelpCircle className="w-3 h-3 mr-1 text-stone-500" />
            Awaiting
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-600" />
            Plant Addressing & Group Inventory
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Plants are organized into deterministic physical groups of 10 with shared physical addresses (e.g. Zone A / North / Group N-01).
          </p>
        </div>

        {/* Search input with multi-mode matching */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Group ID (N-01), Address, or Plant ID (P006)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Summary KPI Cards: Plant Groups vs Total Plants */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">
            Total Plant Groups
          </span>
          <span className="text-xl font-extrabold text-stone-900 dark:text-white mt-1 block">
            {totalPlantGroups.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Sets of 10 plants
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">
            Total Plants Represented
          </span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {totalPlantsRepresented.toLocaleString()}
          </span>
          <span className="text-[10px] text-stone-400 font-medium">
            Across {farmConfig.zones.length} zone(s)
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">
            Filtered Groups Matching
          </span>
          <span className="text-xl font-extrabold text-stone-900 dark:text-white mt-1 block">
            {matchingGroupsCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-stone-400 font-medium">
            {Math.round((matchingGroupsCount / (totalPlantGroups || 1)) * 100)}% of total groups
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">
            Filtered Plants Represented
          </span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {matchingPlantsCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-stone-400 font-medium">
            Individual plant records
          </span>
        </div>
      </div>

      {/* Filter Toolbar with Dynamic Group & Plant Count Display */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Zone Selector */}
          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
            <Layers className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-stone-500 font-medium">Zone:</span>
            <select
              value={selectedZone}
              onChange={(e) => {
                setSelectedZone(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-stone-900 dark:text-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Zones</option>
              {farmConfig.zones.map((z) => (
                <option key={z.id} value={z.id}>
                  Zone {z.id} ({z.crop})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Section Selector */}
          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
            <Compass className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-stone-500 font-medium">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-stone-900 dark:text-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Sections</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
          </div>

          {/* 3. Health Status Selector */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <span className="text-stone-500 px-1.5 font-medium">Status:</span>
            {(['all', 'Healthy', 'Warning', 'High Risk', 'Critical'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setSelectedStatus(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Synchronized Group & Plant Count Display */}
        {/* Exact format: "Showing 20 of 50 plant groups matching criteria (200 plants)" */}
        <div className="text-stone-700 dark:text-stone-300 font-medium bg-stone-50 dark:bg-stone-800/60 px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700/80 flex items-center gap-1.5">
          <span>
            Showing <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">{matchingGroupsCount.toLocaleString()}</strong> of{' '}
            <strong className="text-stone-900 dark:text-white font-extrabold">{totalPlantGroups.toLocaleString()}</strong> plant groups matching criteria
          </span>
          <span className="text-stone-400">&bull;</span>
          <span className="text-stone-500 font-semibold">
            ({matchingPlantsCount.toLocaleString()} plants represented)
          </span>
        </div>
      </div>

      {/* PLANT GROUP INVENTORY TABLE (ONE GROUP = ONE ROW) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/75 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="py-3 px-4">Group ID</th>
                <th className="py-3 px-4">Shared Address</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Plants</th>
                <th className="py-3 px-4">Plant IDs</th>
                <th className="py-3 px-4">Health Summary</th>
                <th className="py-3 px-4">Risk Summary</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
              {paginatedGroups.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-500">
                    <p className="font-bold text-stone-700 dark:text-stone-300 text-sm">
                      No plant groups match the selected filter criteria.
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      Try adjusting the Zone, Section, Health Status, or Search Query above.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedGroups.map((group) => (
                  <tr
                    key={group.address}
                    className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition cursor-pointer"
                    onClick={() => setInspectingGroup(group)}
                  >
                    {/* 1. Group ID (e.g. N-01) */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800">
                        {group.groupCode}
                      </span>
                    </td>

                    {/* 2. Shared Address */}
                    <td className="py-3.5 px-4 font-semibold text-stone-900 dark:text-white">
                      {group.address}
                    </td>

                    {/* 3. Zone */}
                    <td className="py-3.5 px-4 font-medium">Zone {group.zoneId}</td>

                    {/* 4. Section */}
                    <td className="py-3.5 px-4 font-medium">{group.sectionDirection}</td>

                    {/* 5. Number of Plants */}
                    <td className="py-3.5 px-4 font-bold font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                        {group.plantCount}
                      </span>
                    </td>

                    {/* 6. Plant ID Range */}
                    <td className="py-3.5 px-4 font-mono text-stone-600 dark:text-stone-300">
                      {group.plantsSummary}
                    </td>

                    {/* 7. Health Summary */}
                    <td className="py-3.5 px-4">{getStatusBadge(group.status)}</td>

                    {/* 8. Risk Summary */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold ${
                          group.riskLevel === 'Low'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : group.riskLevel === 'Moderate'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {group.riskLevel}
                      </span>
                    </td>

                    {/* 9. Details Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingGroup(group);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 dark:bg-stone-800 dark:hover:bg-emerald-950/60 dark:text-stone-300 dark:hover:text-emerald-300 transition border border-stone-200 dark:border-stone-700 font-semibold cursor-pointer"
                        title="View Group Details and individual plant records"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950/60 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
          <span className="text-stone-500">
            Page <strong className="text-stone-900 dark:text-white">{currentPage}</strong> of{' '}
            <strong className="text-stone-900 dark:text-white">{totalPages}</strong> &bull; ({matchingGroupsCount.toLocaleString()} matching plant groups, representing {matchingPlantsCount.toLocaleString()} plants)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 disabled:opacity-40 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-stone-700 dark:text-stone-300 px-1">
              {currentPage}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 disabled:opacity-40 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* GROUP DETAILS MODAL / PANEL */}
      {inspectingGroup && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-stone-900 dark:text-white">
                      Plant Group Details: {inspectingGroup.groupCode}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {inspectingGroup.plantCount} Plants
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Physical location boundary and individual plant health status
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setInspectingGroup(null);
                  setInspectingIndividualPlant(null);
                }}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Group Location & Address Summary */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700/80 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                      Group ID
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      {inspectingGroup.groupId} ({inspectingGroup.groupCode})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                      Shared Physical Address
                    </span>
                    <span className="text-sm font-bold text-stone-900 dark:text-white">
                      {inspectingGroup.address}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                      Zone & Section
                    </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      Zone {inspectingGroup.zoneId} &bull; {inspectingGroup.sectionDirection} Section
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                      Crop Variety
                    </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {inspectingGroup.crop || 'Crop'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                      Number of Plants
                    </span>
                    <span className="font-bold text-stone-900 dark:text-white">
                      {inspectingGroup.plantCount} plants ({inspectingGroup.plantsSummary})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                      Health & Risk
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {getStatusBadge(inspectingGroup.status)}
                      <span className="text-stone-500 font-medium">
                        Risk: <strong>{inspectingGroup.riskLevel}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/80 dark:border-stone-700/80 text-[11px] text-stone-500">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    Primary Stress Factor:
                  </span>{' '}
                  {inspectingGroup.mainRiskFactor}
                </div>
              </div>

              {/* Visual Box Boundary Representation with Plant Dots */}
              <div className="p-4 bg-stone-950 text-white rounded-2xl border border-stone-800">
                <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
                  <span className="text-emerald-400 font-bold">
                    ┌─ {inspectingGroup.groupId} Boundary Box ─┐
                  </span>
                  <span className="text-stone-400">{inspectingGroup.plantCount} Plants</span>
                </div>

                {/* 10 Plant Dots in 2 rows of 5 */}
                <div className="py-3 px-4 bg-stone-900/90 rounded-xl border border-stone-800 flex items-center justify-center">
                  <div
                    className={`grid ${
                      inspectingGroup.plantCount <= 5 ? 'grid-cols-5' : 'grid-cols-5 grid-rows-2'
                    } gap-3 items-center justify-items-center`}
                  >
                    {inspectingGroup.plants.map((plant) => {
                      const isInspectingThisPlant =
                        inspectingIndividualPlant?.plantId === plant.plantId;
                      return (
                        <div
                          key={plant.plantId}
                          onClick={() => setInspectingIndividualPlant(plant)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition cursor-pointer ${
                            isInspectingThisPlant
                              ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/80'
                              : 'bg-stone-800/80 border-stone-700 hover:border-emerald-500 hover:bg-stone-800'
                          }`}
                          title={`Click to inspect plant ${plant.plantId}`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full ${
                              plant.status === 'Healthy'
                                ? 'bg-emerald-500'
                                : plant.status === 'Warning'
                                ? 'bg-amber-500'
                                : plant.status === 'High Risk'
                                ? 'bg-orange-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span className="font-mono text-[9px] text-stone-300">
                            P{String(plant.plantNumber).padStart(3, '0')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-center text-[10px] text-stone-400 mt-2 font-mono">
                  Shared Physical Address: {inspectingGroup.address}
                </div>
              </div>

              {/* Individual Plants in this Group Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 dark:text-white">
                    Individual Plants in this Group ({inspectingGroup.plants.length})
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    Click any plant to view details
                  </span>
                </div>

                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-700">
                      <tr>
                        <th className="py-2 px-3">Plant ID</th>
                        <th className="py-2 px-3">Section Pos</th>
                        <th className="py-2 px-3">Health Status</th>
                        <th className="py-2 px-3">Risk Level</th>
                        <th className="py-2 px-3">Shared Group Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                      {inspectingGroup.plants.map((p) => (
                        <tr
                          key={p.plantId}
                          onClick={() => setInspectingIndividualPlant(p)}
                          className={`hover:bg-stone-50 dark:hover:bg-stone-800/40 transition cursor-pointer ${
                            inspectingIndividualPlant?.plantId === p.plantId
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/40'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {p.plantId}
                          </td>
                          <td className="py-2 px-3 font-mono text-stone-500">
                            Plant #{p.plantNumber} (Pos {p.position})
                          </td>
                          <td className="py-2 px-3">{getStatusBadge(p.status)}</td>
                          <td className="py-2 px-3 font-medium">{p.riskLevel}</td>
                          <td className="py-2 px-3 text-stone-500 truncate max-w-[200px]">
                            {p.address}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-view: Selected Individual Plant Detail */}
              {inspectingIndividualPlant && (
                <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-300 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-mono">
                      <span>🌱</span>
                      {inspectingIndividualPlant.plantId} Record
                    </span>
                    <button
                      onClick={() => setInspectingIndividualPlant(null)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-white text-xs cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-stone-500 block">Plant Group:</span>
                      <strong className="text-stone-900 dark:text-white font-mono">
                        {inspectingIndividualPlant.groupId}
                      </strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Shared Address:</span>
                      <strong className="text-emerald-700 dark:text-emerald-400">
                        {inspectingIndividualPlant.address}
                      </strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Position:</span>
                      <span className="font-mono text-stone-800 dark:text-stone-200">
                        Row {inspectingIndividualPlant.row}, Pos {inspectingIndividualPlant.position}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Stress Factor:</span>
                      <span className="text-stone-700 dark:text-stone-300 truncate block">
                        {inspectingIndividualPlant.mainRiskFactor}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-stone-500 font-mono">
                {inspectingGroup.address}
              </span>
              <button
                onClick={() => {
                  setInspectingGroup(null);
                  setInspectingIndividualPlant(null);
                }}
                className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Close Group Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
