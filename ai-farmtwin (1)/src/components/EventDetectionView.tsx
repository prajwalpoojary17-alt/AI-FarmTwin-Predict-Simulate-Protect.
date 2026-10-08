import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { FarmEvent, PlantGroup, SectionDirection, ZoneData } from '../types/farm';
import {
  generatePlantGroupsForSection,
  getNearestPlantGroup,
  resolveEventPlantGroup,
  DIRECTION_INITIALS,
} from '../utils/plantAddressing';
import {
  ShieldAlert,
  AlertTriangle,
  PawPrint,
  UserCheck,
  Car,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Radio,
  Eye,
  Compass,
  ArrowRight,
  ShieldCheck,
  Crosshair,
  Sprout,
  Boxes,
} from 'lucide-react';

export const EventDetectionView: React.FC = () => {
  const { farmConfig, events, addFarmEvent, resolveFarmEvent, moveFarmEvent, clearAllEvents } = useFarm();

  const [eventType, setEventType] = useState<'Animal' | 'Human' | 'Vehicle'>('Animal');
  const [selectedZone, setSelectedZone] = useState<string>(farmConfig.zones[0]?.id || 'A');
  const [selectedSection, setSelectedSection] = useState<SectionDirection>('East');
  const [posX, setPosX] = useState<number>(72);
  const [posY, setPosY] = useState<number>(45);
  const [entryLocation, setEntryLocation] = useState<string>('East Perimeter Fence');
  const [description, setDescription] = useState<string>('Intrusion motion detected near crop furrow.');

  const [filterZone, setFilterZone] = useState<string>('all');

  // 1. Centralized Plant Group lookup for targeted section
  const targetedZoneObj = useMemo(() => {
    return farmConfig.zones.find((z) => z.id === selectedZone) || farmConfig.zones[0];
  }, [farmConfig.zones, selectedZone]);

  const targetedSectionObj = useMemo(() => {
    return targetedZoneObj?.sections[selectedSection];
  }, [targetedZoneObj, selectedSection]);

  // Generate plant groups for targeted section from the centralized plantAddressing dataset
  const targetedSectionGroups: PlantGroup[] = useMemo(() => {
    if (!targetedZoneObj || !targetedSectionObj) return [];
    return generatePlantGroupsForSection(targetedZoneObj, targetedSectionObj);
  }, [targetedZoneObj, targetedSectionObj]);

  // 2. Automatically find closest 10-plant group to current (posX, posY)
  const nearestTargetGroupResult = useMemo(() => {
    return getNearestPlantGroup(targetedSectionGroups, posX, posY);
  }, [targetedSectionGroups, posX, posY]);

  // 3. Dynamic Location Note: ALWAYS THE SHARED ADDRESS OF THAT 10-PLANT GROUP
  const dynamicLocationAddress = nearestTargetGroupResult
    ? nearestTargetGroupResult.sharedAddress
    : `Zone ${selectedZone} / ${selectedSection} / Group ${DIRECTION_INITIALS[selectedSection] || 'N'}-01`;

  const dynamicLocationNote = dynamicLocationAddress;

  const nearbyGroupSummary = nearestTargetGroupResult
    ? `${nearestTargetGroupResult.nearestGroup.groupCode} (${nearestTargetGroupResult.nearestGroup.plantCount} plants, ${nearestTargetGroupResult.nearestGroup.plantsSummary})`
    : `${DIRECTION_INITIALS[selectedSection] || 'N'}-01 (10 plants, P001–P010)`;

  const handleSimulateEvent = (e: React.FormEvent) => {
    e.preventDefault();

    const locationName = `Zone ${selectedZone} — ${selectedSection} Section`;
    addFarmEvent({
      type: eventType,
      zoneId: selectedZone,
      direction: selectedSection,
      locationName,
      entryLocation: entryLocation.trim() || `${selectedSection} Perimeter Fence`,
      currentLocation: dynamicLocationAddress, // SHARED ADDRESS OF THE GROUP
      description:
        description.trim() ||
        `${eventType} detected in ${dynamicLocationAddress}`,
      x: posX,
      y: posY,
      positionX: posX,
      positionY: posY,
      nearestPlantId: nearestTargetGroupResult?.nearestPlant?.plantId,
      nearestPlantAddress: dynamicLocationAddress,
      nearestGroupId: nearestTargetGroupResult?.nearestGroup.groupId,
      nearestGroupCode: nearestTargetGroupResult?.nearestGroup.groupCode,
      nearestGroupAddress: dynamicLocationAddress,
      nearestGroupPlantsSummary: nearestTargetGroupResult?.nearestGroup.plantsSummary,
      nearestGroupPlantCount: nearestTargetGroupResult?.nearestGroup.plantCount,
    });

    setDescription('');
  };

  const getEventIcon = (type: 'Animal' | 'Human' | 'Vehicle') => {
    switch (type) {
      case 'Animal':
        return <PawPrint className="w-4 h-4 text-amber-500" />;
      case 'Human':
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case 'Vehicle':
        return <Car className="w-4 h-4 text-purple-500" />;
    }
  };

  const activeEvents = events.filter((e) => e.status === 'Active');

  const zonesToDisplay =
    filterZone === 'all'
      ? farmConfig.zones
      : farmConfig.zones.filter((z) => z.id === filterZone);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Event Detection — Animal, Human & Vehicle Tracker
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              Perimeter Surveillance Twin
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Answers: <em>&ldquo;Is there an animal, human, or vehicle inside my farm, and where is it?&rdquo;</em> Plant addresses and coordinates automatically synchronize with the central plant inventory.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 font-medium text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
            Active Intrusion Alerts: <strong className="text-rose-600 font-extrabold">{activeEvents.length}</strong>
          </span>
          {events.length > 0 && (
            <button
              onClick={clearAllEvents}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 dark:bg-stone-800 dark:hover:bg-rose-950/40 dark:text-stone-300 transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Log
            </button>
          )}
        </div>
      </div>

      {/* Prominent Active Intrusion Event Notification Banner */}
      {activeEvents.length > 0 ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800/80 pb-2">
            <span className="font-extrabold text-rose-900 dark:text-rose-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Active Detected Intrusion Events ({activeEvents.length})
            </span>
            <span className="text-[11px] text-rose-700 dark:text-rose-300">
              Each event shows its exact coordinates and nearest plant inventory address
            </span>
          </div>

          <div className="space-y-2">
            {activeEvents.map((evt) => {
              const res = resolveEventPlantGroup(evt, farmConfig.zones);
              return (
                <div
                  key={evt.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-rose-200 dark:border-rose-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center gap-1 shrink-0">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      ALERT
                    </span>
                    <div>
                      <span className="font-extrabold text-rose-950 dark:text-rose-100 text-sm">
                        🔴 {evt.type} detected in Zone {evt.zoneId} &bull; {evt.direction} Section
                      </span>
                      <div className="text-[11px] text-rose-800 dark:text-rose-300 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
                        <span>
                          DETECTED LOC:{' '}
                          <strong className="font-mono bg-rose-100 dark:bg-rose-950 px-1 py-0.5 rounded text-rose-900 dark:text-rose-200">
                            {res.currentLocation}
                          </strong>
                        </span>
                        <span>&bull;</span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                          NEARBY GROUP: <strong>{res.nearbySummary}</strong>
                        </span>
                        <span>&bull;</span>
                        <span>
                          COORDS: <strong className="font-mono">X={evt.x}%, Y={evt.y}%</strong>
                        </span>
                        <span>&bull;</span>
                        <span>
                          ENTRY: <strong>{evt.entryLocation}</strong>
                        </span>
                        <span>&bull;</span>
                        <span>
                          TIME: <strong>{evt.timestamp}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => resolveFarmEvent(evt.id)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition text-xs shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    Resolve Intrusion
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All monitored farm perimeters and zone boundaries are secure. Zero active intrusions detected.</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
            All Sectors Nominal
          </span>
        </div>
      )}

      {/* Main Grid: TOP-DOWN SURVEILLANCE MAP + SIMULATION CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TOP-DOWN FARM SURVEILLANCE MAP */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
              Top-Down Farm Surveillance Map
            </span>
            <span className="text-[11px] text-stone-500">
              Plant dots generated from centralized dataset &bull; Events rendered at exact coordinates
            </span>
          </div>

          {/* Vertical Stack: Connected Rectangular Zone Plots (One Below Another) */}
          <div className="flex flex-col gap-6">
            {zonesToDisplay.map((zone) => {
              const activeInZone = activeEvents.filter((e) => e.zoneId === zone.id);

              return (
                <div
                  key={zone.id}
                  className={`bg-white dark:bg-stone-900 rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col transition-all duration-200 ${
                    activeInZone.length > 0
                      ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-rose-950/20'
                      : 'border-stone-300 dark:border-stone-700'
                  }`}
                >
                  {/* Zone Header */}
                  <div
                    className={`px-4 py-2.5 border-b-2 flex items-center justify-between text-xs ${
                      activeInZone.length > 0
                        ? 'bg-rose-100/80 dark:bg-rose-950/80 border-rose-400 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                        : 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-black text-xs ${
                          activeInZone.length > 0
                            ? 'bg-rose-600 text-white'
                            : 'bg-stone-700 text-white'
                        }`}
                      >
                        ZONE {zone.id}
                      </span>
                      <span className="font-bold">{zone.crop}</span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold">
                        ({zone.totalPlants} plants)
                      </span>
                    </div>

                    {activeInZone.length > 0 ? (
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {activeInZone.length} {activeInZone.length === 1 ? 'Intrusion' : 'Intrusions'} Active
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Clear / Secure
                      </span>
                    )}
                  </div>

                  {/* Connected 4-Section Rectangular Plot (Surveillance View) */}
                  <div className="p-3 bg-stone-200/60 dark:bg-stone-950/80 flex-1 flex flex-col justify-center">
                    <div className="w-full bg-white dark:bg-stone-900 rounded-xl border-2 border-stone-400 dark:border-stone-600 shadow-inner overflow-hidden grid grid-cols-2 grid-rows-2 divide-x-2 divide-y-2 divide-stone-300 dark:divide-stone-700">
                      {/* NORTH (Top-Left) */}
                      <SurveillanceQuadrant
                        zone={zone}
                        direction="North"
                        events={activeEvents.filter(
                          (e) => e.zoneId === zone.id && e.direction === 'North'
                        )}
                        getEventIcon={getEventIcon}
                        onResolveEvent={resolveFarmEvent}
                      />

                      {/* EAST (Top-Right) */}
                      <SurveillanceQuadrant
                        zone={zone}
                        direction="East"
                        events={activeEvents.filter(
                          (e) => e.zoneId === zone.id && e.direction === 'East'
                        )}
                        getEventIcon={getEventIcon}
                        onResolveEvent={resolveFarmEvent}
                      />

                      {/* WEST (Bottom-Left) */}
                      <SurveillanceQuadrant
                        zone={zone}
                        direction="West"
                        events={activeEvents.filter(
                          (e) => e.zoneId === zone.id && e.direction === 'West'
                        )}
                        getEventIcon={getEventIcon}
                        onResolveEvent={resolveFarmEvent}
                      />

                      {/* SOUTH (Bottom-Right) */}
                      <SurveillanceQuadrant
                        zone={zone}
                        direction="South"
                        events={activeEvents.filter(
                          (e) => e.zoneId === zone.id && e.direction === 'South'
                        )}
                        getEventIcon={getEventIcon}
                        onResolveEvent={resolveFarmEvent}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIMULATION & INTRUSION CREATION PANEL */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2 mb-1">
              <PlusCircle className="w-4 h-4 text-rose-600" />
              Simulate Intrusion Event
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Specify Zone, Section, and exact (X, Y) position. The location note is automatically determined from the closest plant address.
            </p>

            <form onSubmit={handleSimulateEvent} className="space-y-3.5 text-xs">
              {/* Event Type */}
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Intrusion Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Animal', 'Human', 'Vehicle'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEventType(type)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                        eventType === type
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                    >
                      {getEventIcon(type)}
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Zone & Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Zone Plot
                  </label>
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-semibold focus:outline-hidden"
                  >
                    {farmConfig.zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        Zone {z.id} ({z.crop})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Section Quadrant
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value as SectionDirection)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-semibold focus:outline-hidden"
                  >
                    <option value="North">North Section</option>
                    <option value="East">East Section</option>
                    <option value="West">West Section</option>
                    <option value="South">South Section</option>
                  </select>
                </div>
              </div>

              {/* EXACT POSITION COORDINATES WITHIN SECTION (0% to 100%) */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5 text-rose-600" />
                    <span>Exact Section Coordinates</span>
                  </label>
                  <span className="font-mono text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-white dark:bg-stone-900 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                    X: {posX}% &bull; Y: {posY}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-stone-500 dark:text-stone-400 block mb-1 font-medium">
                      Position X (0% &rarr; 100%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={posX}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPosX(isNaN(val) ? 0 : Math.max(0, Math.min(100, val)));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500 dark:text-stone-400 block mb-1 font-medium">
                      Position Y (0% &rarr; 100%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={posY}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPosY(isNaN(val) ? 0 : Math.max(0, Math.min(100, val)));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Interactive Click-to-Position Coordinate Pad with Plant Groups */}
                <div>
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                      const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                      setPosX(Math.max(5, Math.min(95, clickX)));
                      setPosY(Math.max(5, Math.min(95, clickY)));
                    }}
                    className="relative w-full h-32 bg-stone-950 border border-stone-700 rounded-xl cursor-crosshair overflow-hidden group select-none shadow-inner"
                    title="Click anywhere inside to set coordinates and dynamically detect nearest 10-plant group"
                  >
                    {/* Render plant group boxes inside coordinate pad */}
                    <div className="absolute inset-0 pointer-events-none p-1.5">
                      {targetedSectionGroups.map((g) => {
                        const isNearest = nearestTargetGroupResult?.nearestGroup.groupId === g.groupId;
                        return (
                          <div
                            key={g.groupId}
                            style={{
                              left: `${g.boxLeft}%`,
                              top: `${g.boxTop}%`,
                              width: `${g.boxWidth}%`,
                              height: `${g.boxHeight}%`,
                            }}
                            className={`absolute rounded-lg border transition-all flex flex-col justify-between p-1 ${
                              isNearest
                                ? 'border-emerald-400 bg-emerald-950/60 ring-1 ring-emerald-400 z-10'
                                : 'border-stone-700/80 bg-stone-900/60'
                            }`}
                          >
                            <span className="text-[8px] font-mono font-bold text-emerald-400 leading-none">
                              {g.groupCode}
                            </span>
                            <div className="grid grid-cols-5 gap-0.5 justify-items-center">
                              {g.plants.map((p) => (
                                <div
                                  key={p.plantId}
                                  className={`w-1 h-1 rounded-full ${
                                    isNearest ? 'bg-emerald-400' : 'bg-stone-500'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[7px] text-stone-400 text-center leading-none">
                              {g.plantCount}p
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <span className="absolute top-1 left-1.5 text-[8px] text-stone-500 font-mono pointer-events-none">
                      (0%, 0%)
                    </span>
                    <span className="absolute bottom-1 right-1.5 text-[8px] text-stone-500 font-mono pointer-events-none">
                      (100%, 100%)
                    </span>

                    {/* Dynamic Target Marker */}
                    <div
                      style={{
                        left: `${posX}%`,
                        top: `${posY}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute z-20 w-5 h-5 rounded-full bg-rose-600 border-2 border-white shadow-md flex items-center justify-center pointer-events-none transition-all duration-75"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-stone-400 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => { setPosX(72); setPosY(45); }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:border-rose-400 text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    (72%, 45%)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPosX(30); setPosY(40); }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:border-rose-400 text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    (30%, 40%)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPosX(75); setPosY(70); }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:border-rose-400 text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    (75%, 70%)
                  </button>
                </div>
              </div>

              {/* CURRENT DETECTED LOCATION (SHARED ADDRESS OF THE NEAREST 10-PLANT GROUP) */}
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-emerald-600" />
                    <span>Current Detected Location</span>
                  </label>
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60">
                    Group Shared Address
                  </span>
                </div>

                <div className="font-extrabold text-sm text-stone-900 dark:text-white font-mono bg-white dark:bg-stone-900 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
                  {dynamicLocationAddress}
                </div>

                <div className="text-[11px] text-stone-600 dark:text-stone-300 bg-emerald-100/50 dark:bg-emerald-900/30 p-2 rounded-lg space-y-0.5">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Nearby:
                  </div>
                  <div>
                    {nearbyGroupSummary}
                  </div>
                </div>
              </div>

              {/* Point of Entry (Separate Field) */}
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Point of Entry (Where event entered the farm)
                </label>
                <input
                  type="text"
                  value={entryLocation}
                  onChange={(e) => setEntryLocation(e.target.value)}
                  placeholder="e.g. East Perimeter Fence"
                  className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Observation / Threat Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Animal moving through crop furrow"
                  className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-hidden resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Broadcast Intrusion Event</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Intrusion Log & Spatial Trajectory Cards */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-rose-600" />
          Intrusion History & Group Addressing Tracking Log
        </h3>

        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            No events logged yet. Use the simulation form above to test perimeter detection.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((evt) => {
              const isActive = evt.status === 'Active';
              const res = resolveEventPlantGroup(evt, farmConfig.zones);
              return (
                <div
                  key={evt.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between text-xs transition ${
                    isActive
                      ? 'border-rose-400 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 font-bold text-stone-900 dark:text-white">
                        {getEventIcon(evt.type)}
                        {evt.type} Intrusion
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isActive
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {evt.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-500 mb-2 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{evt.timestamp}</span>
                      </span>
                      <span>&bull;</span>
                      <strong className="text-stone-700 dark:text-stone-200">
                        {res.cleanLocationName || `Zone ${res.zoneId} — ${res.direction} Section`}
                      </strong>
                    </div>

                    {/* Coordinates & Group Shared Location Details */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-1.5 mb-2">
                      <div className="flex items-start gap-2 text-stone-600 dark:text-stone-300">
                        <span className="w-28 text-[10px] text-stone-400 font-bold uppercase shrink-0 pt-0.5">
                          DETECTED LOC:
                        </span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 break-words">
                          {res.currentLocation}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                        <span className="w-28 text-[10px] text-stone-400 font-bold uppercase shrink-0">
                          NEARBY GROUP:
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                          {res.nearbySummary}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                        <span className="w-28 text-[10px] text-stone-400 font-bold uppercase shrink-0">
                          COORDS:
                        </span>
                        <span className="font-mono font-medium">X={evt.x}%, Y={evt.y}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                        <span className="w-28 text-[10px] text-stone-400 font-bold uppercase shrink-0">
                          ENTRY:
                        </span>
                        <span className="font-medium truncate">{evt.entryLocation}</span>
                      </div>
                    </div>

                    <p className="text-stone-600 dark:text-stone-300 text-xs italic">
                      &ldquo;{res.cleanDescription || evt.description}&rdquo;
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    {isActive ? (
                      <button
                        onClick={() => resolveFarmEvent(evt.id)}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Resolved / Threat Cleared
                      </button>
                    ) : (
                      <span className="text-[11px] text-stone-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface SurveillanceQuadrantProps {
  zone: ZoneData;
  direction: SectionDirection;
  events: FarmEvent[];
  getEventIcon: (type: 'Animal' | 'Human' | 'Vehicle') => React.ReactNode;
  onResolveEvent: (id: string) => void;
}

const SurveillanceQuadrant: React.FC<SurveillanceQuadrantProps> = ({
  zone,
  direction,
  events,
  getEventIcon,
  onResolveEvent,
}) => {
  const section = zone.sections[direction];
  const hasEvents = events.length > 0;

  // Generate plant groups for this section directly from centralized dataset
  const sectionGroups = useMemo(() => {
    return generatePlantGroupsForSection(zone, section);
  }, [zone, section]);

  const totalPlants = sectionGroups.reduce((acc, g) => acc + g.plantCount, 0);

  return (
    <div
      className={`p-3 relative flex flex-col justify-between min-h-[190px] sm:min-h-[220px] transition-all select-none overflow-hidden ${
        hasEvents
          ? 'bg-rose-950/30 ring-1 ring-rose-400 dark:ring-rose-800'
          : 'bg-stone-900/80'
      }`}
    >
      {/* Top Header Row: Section Name + Status */}
      <div className="flex items-center justify-between w-full relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-xs tracking-wider uppercase text-white">
            {direction.toUpperCase()}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
            {totalPlants} plants &bull; {sectionGroups.length} groups
          </span>
          {hasEvents && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white animate-pulse">
              {events.length} {events.length === 1 ? 'Alert' : 'Alerts'}
            </span>
          )}
        </div>

        {hasEvents ? (
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
          </span>
        ) : (
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Clear
          </span>
        )}
      </div>

      {/* SECTION CANVAS WITH 10-PLANT GROUP BOXES AND INDEPENDENT EVENT MARKERS */}
      <div className="relative flex-1 w-full my-1 pointer-events-auto">
        {/* Dynamic Plant Group Boxes (Each 10 Plants as a Box with plant dots inside) */}
        <div className="absolute inset-0 pointer-events-none p-1">
          <div className="relative w-full h-full">
            {sectionGroups.map((group) => {
              const hasAlertNearGroup = events.some(
                (e) =>
                  e.nearestGroupAddress === group.address ||
                  e.nearestGroupId === group.groupId ||
                  e.nearestGroupCode === group.groupCode ||
                  e.currentLocation === group.address
              );

              return (
                <div
                  key={group.groupId}
                  style={{
                    left: `${group.boxLeft}%`,
                    top: `${group.boxTop}%`,
                    width: `${group.boxWidth}%`,
                    height: `${group.boxHeight}%`,
                  }}
                  className={`absolute rounded-xl border transition-all duration-150 flex flex-col justify-between p-1 shadow-md select-none ${
                    hasAlertNearGroup
                      ? 'bg-rose-950/70 border-rose-400 ring-2 ring-rose-500/80 z-10'
                      : 'bg-stone-900/80 border-stone-700/80 hover:border-emerald-400/60'
                  }`}
                  title={`${group.groupId} • ${group.address} (${group.plantCount} plants)`}
                >
                  {/* Group Box Header */}
                  <div className="flex items-center justify-between text-[9px] font-mono leading-none border-b border-stone-800 pb-0.5">
                    <span className="font-extrabold text-emerald-400 truncate">
                      {group.groupCode}
                    </span>
                    <span className="text-[8px] text-stone-400 font-semibold">
                      {group.plantCount}p
                    </span>
                  </div>

                  {/* Plant dots inside the box */}
                  <div className="flex-1 w-full my-0.5 flex items-center justify-center">
                    <div
                      className={`grid ${
                        group.plantCount <= 5 ? 'grid-cols-5' : 'grid-cols-5 grid-rows-2'
                      } gap-0.5 items-center justify-items-center w-full px-0.5`}
                    >
                      {group.plants.map((plant) => (
                        <div
                          key={plant.plantId}
                          className={`w-1.5 h-1.5 rounded-full ${
                            hasAlertNearGroup
                              ? 'bg-rose-400'
                              : plant.status === 'Healthy'
                              ? 'bg-emerald-400'
                              : plant.status === 'Warning'
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                          title={`${plant.plantId} (${plant.address})`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Group Box Footer */}
                  <div className="text-[7px] text-stone-400 text-center font-mono leading-none truncate">
                    {group.plantsSummary}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detected Event Markers at exact relative (X, Y) coordinates */}
        {hasEvents &&
          events.map((evt) => {
            const clampedX = Math.max(8, Math.min(92, evt.x));
            const clampedY = Math.max(12, Math.min(88, evt.y));
            const res = resolveEventPlantGroup(evt, [zone]);

            return (
              <div
                key={evt.id}
                style={{
                  left: `${clampedX}%`,
                  top: `${clampedY}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-30 group"
              >
                {/* Radar pulse wave around marker */}
                <span className="absolute -inset-1.5 rounded-full bg-rose-500 opacity-75 animate-ping pointer-events-none" />

                {/* Marker Pill with Icon & Plant Group Shared Address */}
                <div className="relative flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px] shadow-xl border border-white/90 cursor-pointer whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>
                    🔴 {evt.type}
                  </span>
                  <span className="text-[9px] font-mono text-rose-100 opacity-90">
                    {res.groupCode}
                  </span>
                </div>

                {/* Hover Tooltip Card */}
                <div className="hidden group-hover:block absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-64 p-3 bg-stone-900/95 backdrop-blur-xs text-white text-[10px] rounded-xl shadow-2xl border border-stone-700 z-40 pointer-events-auto">
                  <div className="font-extrabold flex justify-between items-center text-xs border-b border-stone-700 pb-1">
                    <span className="text-rose-400 flex items-center gap-1">
                      {getEventIcon(evt.type)}
                      {evt.type} Detected
                    </span>
                    <span className="text-[9px] text-stone-400">{evt.timestamp}</span>
                  </div>
                  <div className="mt-1.5 space-y-1 text-stone-300">
                    <div>
                      Current Detected Location:
                      <div className="font-mono font-bold text-rose-300 mt-0.5 break-words">
                        {res.currentLocation}
                      </div>
                    </div>
                    <div className="text-[9px] text-emerald-400 font-mono">
                      Nearby: {res.nearbySummary}
                    </div>
                    <div className="text-stone-400 text-[9px]">
                      Coords: X={evt.x}%, Y={evt.y}% &bull; Entry: {evt.entryLocation}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolveEvent(evt.id);
                    }}
                    className="mt-2 w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[9px] transition cursor-pointer"
                  >
                    Resolve Intrusion
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Bottom Footer Row: Sector identifier + Plant Groups summary */}
      <div className="pt-1.5 border-t border-stone-800 text-[10px] text-stone-400 flex items-center justify-between relative z-10 font-mono">
        <span>
          Sector {zone.id}-{direction.charAt(0)}
        </span>

        <span className="text-[9px] text-emerald-400">
          {sectionGroups.length} Plant Groups ({totalPlants} plants)
        </span>
      </div>
    </div>
  );
};
