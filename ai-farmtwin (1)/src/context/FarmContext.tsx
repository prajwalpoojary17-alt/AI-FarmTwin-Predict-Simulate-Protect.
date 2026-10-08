import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  FarmConfig,
  FarmEvent,
  SectionData,
  SectionDirection,
  SensorInput,
  UserProfile,
  ZoneData,
} from '../types/farm';
import { calculateSectionHealth } from '../utils/healthEngine';
import { createFreshUserFarmConfig, createZone, ZONE_LETTERS } from '../utils/initialData';
import {
  resolveEventPlantGroup,
  migrateLegacyEvents,
} from '../utils/plantAddressing';
import {
  logoutFirebase,
  onFirebaseAuthStateChange,
  syncUserFarmToFirestore,
} from '../services/firebase';

export type NavigationTab =
  | 'dashboard'
  | 'digital-twin'
  | 'crop-health'
  | 'plants'
  | 'events'
  | 'simulator'
  | 'reports'
  | 'settings';

interface FarmSummaryStats {
  avgTemp: number | null;
  avgHumidity: number | null;
  avgMoisture: number | null;
  healthyCount: number;
  warningCount: number;
  highRiskCount: number;
  criticalCount: number;
  awaitingCount: number;
  totalSections: number;
}

interface FarmContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  farmConfig: FarmConfig;
  setFarmConfig: React.Dispatch<React.SetStateAction<FarmConfig>>;
  events: FarmEvent[];
  setEvents: React.Dispatch<React.SetStateAction<FarmEvent[]>>;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedSection: SectionData | null;
  setSelectedSection: (sec: SectionData | null) => void;
  updateSectionInputs: (zoneId: string, direction: SectionDirection, inputs: SensorInput) => void;
  updateFarmConfig: (updater: Partial<FarmConfig> | ((prev: FarmConfig) => FarmConfig)) => void;
  setZoneCount: (count: number) => void;
  updateZoneCropAndPlants: (zoneId: string, crop: string, plantCount: number) => void;
  addFarmEvent: (event: Omit<FarmEvent, 'id' | 'timestamp' | 'status'>) => void;
  resolveFarmEvent: (id: string) => void;
  moveFarmEvent: (id: string, newX: number, newY: number) => void;
  clearAllEvents: () => void;
  summaryStats: FarmSummaryStats;
  updateOverallFarmSensors: (readings: {
    temperature: number | null;
    humidity: number | null;
    soilMoisture: number | null;
    weatherCondition: string;
  }) => void;
  logout: () => void;
  resetAllInputsToAwaiting: () => void;
  applyPreset: (zoneId: string, direction: SectionDirection, preset: SensorInput) => void;
  applyPresetToAllSections: (preset: SensorInput) => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user - initialized from cached profile
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('farmtwin_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          emailVerified: true,
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);

  // User-specific farmConfig: NEVER initialize with shared/global demo data
  const [farmConfig, setFarmConfig] = useState<FarmConfig>(() => {
    if (user?.id) {
      try {
        const cached = localStorage.getItem(`farmtwin_config_${user.id}`);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.warn('Error reading user cached config:', e);
      }
    }
    return createFreshUserFarmConfig(user?.farmName || '', user?.fullName || '');
  });

  // User-specific events: NEVER initialize with shared/global demo events, and automatically migrate any legacy individual plant strings
  const [events, setEvents] = useState<FarmEvent[]>(() => {
    if (user?.id) {
      try {
        const cached = localStorage.getItem(`farmtwin_events_${user.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          return migrateLegacyEvents(parsed, farmConfig.zones);
        }
      } catch (e) {
        console.warn('Error reading user cached events:', e);
      }
    }
    return [];
  });

  // Guard flag: Ensure Firestore is loaded before syncing out changes
  const isCloudLoadedRef = React.useRef(false);

  // Apply theme to document element and persist
  useEffect(() => {
    const isDark = farmConfig.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [farmConfig.theme]);

  // Listen for Firebase Auth state changes (seamlessly handles refresh and multi-user switching)
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChange((authData) => {
      if (authData) {
        setUser({
          ...authData.user,
          emailVerified: true,
        });

        try {
          const { emailVerified: _omitted, ...safeUser } = authData.user;
          localStorage.setItem('farmtwin_active_user', JSON.stringify(safeUser));
        } catch {}

        const activeConfig = authData.savedConfig
          ? authData.savedConfig
          : createFreshUserFarmConfig(authData.user.farmName, authData.user.fullName);

        setFarmConfig(activeConfig);

        // Migrate any legacy events that contained individual plant addresses
        const migratedEvents = migrateLegacyEvents(authData.savedEvents || [], activeConfig.zones);
        setEvents(migratedEvents);
        isCloudLoadedRef.current = true;
      } else {
        // Logged out or no session: wipe memory state immediately
        isCloudLoadedRef.current = false;
        setUser(null);
        setFarmConfig(createFreshUserFarmConfig('', ''));
        setEvents([]);
        localStorage.removeItem('farmtwin_active_user');
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync active user to local storage whenever user object updates.
  useEffect(() => {
    if (user) {
      try {
        const { emailVerified: _omitted, ...safeUser } = user;
        localStorage.setItem('farmtwin_active_user', JSON.stringify(safeUser));
      } catch {}
    } else {
      localStorage.removeItem('farmtwin_active_user');
    }
  }, [user]);

  // Sync state to Firestore under users/{uid} and safe UID-scoped local cache
  // Only sync if user is authenticated and initial cloud load completed
  useEffect(() => {
    if (user?.id && isCloudLoadedRef.current) {
      syncUserFarmToFirestore(user.id, farmConfig, events);

      // In local mode without live Firebase session, persist state to local backend
      fetch(`/api/farm-twin/state/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmConfig, events }),
      }).catch(() => {});

      try {
        localStorage.setItem(`farmtwin_config_${user.id}`, JSON.stringify(farmConfig));
        localStorage.setItem(`farmtwin_events_${user.id}`, JSON.stringify(events));
      } catch (err) {
        // ignore storage quota issues
      }
    }
  }, [farmConfig, events, user]);

  // Keep selectedSection updated if underlying section data changes
  useEffect(() => {
    if (selectedSection) {
      const zone = farmConfig.zones.find((z) => z.id === selectedSection.zoneId);
      if (zone) {
        const updatedSec = zone.sections[selectedSection.direction];
        if (updatedSec) {
          setSelectedSection(updatedSec);
        }
      }
    }
  }, [farmConfig]);

  // Update Section Inputs (The Manual Input Core)
  const updateSectionInputs = useCallback(
    (zoneId: string, direction: SectionDirection, inputs: SensorInput) => {
      setFarmConfig((prev) => {
        const nextZones = prev.zones.map((zone) => {
          if (zone.id !== zoneId) return zone;
          const currentSec = zone.sections[direction];
          const newInputs = {
            ...inputs,
            lastUpdated: 'Just now',
          };
          const newCalculation = calculateSectionHealth(newInputs, currentSec.crop);

          const updatedSec: SectionData = {
            ...currentSec,
            manualInputs: newInputs,
            calculatedHealth: newCalculation,
          };

          return {
            ...zone,
            sections: {
              ...zone.sections,
              [direction]: updatedSec,
            },
          };
        });

        return {
          ...prev,
          zones: nextZones,
        };
      });
    },
    []
  );

  // Apply a specific preset to a section
  const applyPreset = useCallback(
    (zoneId: string, direction: SectionDirection, preset: SensorInput) => {
      updateSectionInputs(zoneId, direction, preset);
    },
    [updateSectionInputs]
  );

  // Apply a preset to all sections
  const applyPresetToAllSections = useCallback(
    (preset: SensorInput) => {
      setFarmConfig((prev) => {
        const nextZones = prev.zones.map((zone) => {
          const directions: SectionDirection[] = ['North', 'South', 'East', 'West'];
          const updatedSections = { ...zone.sections };

          directions.forEach((dir) => {
            const sec = updatedSections[dir];
            const newInputs = {
              ...preset,
              lastUpdated: 'Just now',
            };
            updatedSections[dir] = {
              ...sec,
              manualInputs: newInputs,
              calculatedHealth: calculateSectionHealth(newInputs, sec.crop),
            };
          });

          return {
            ...zone,
            sections: updatedSections,
          };
        });

        return {
          ...prev,
          zones: nextZones,
        };
      });
    },
    []
  );

  // Reset all inputs to "Awaiting Input"
  const resetAllInputsToAwaiting = useCallback(() => {
    setFarmConfig((prev) => {
      const nextZones = prev.zones.map((zone) => {
        const directions: SectionDirection[] = ['North', 'South', 'East', 'West'];
        const updatedSections = { ...zone.sections };

        directions.forEach((dir) => {
          const sec = updatedSections[dir];
          const emptyInputs: SensorInput = {
            temperature: null,
            humidity: null,
            soilMoisture: null,
            lightIntensity: null,
            rainfall: null,
            waterStress: null,
            pestRisk: null,
            nutrientCondition: null,
          };

          updatedSections[dir] = {
            ...sec,
            manualInputs: emptyInputs,
            calculatedHealth: calculateSectionHealth(emptyInputs, sec.crop),
          };
        });

        return {
          ...zone,
          sections: updatedSections,
        };
      });

      return {
        ...prev,
        zones: nextZones,
      };
    });
  }, []);

  // Update overall farm configuration
  const updateFarmConfig = useCallback(
    (updater: Partial<FarmConfig> | ((prev: FarmConfig) => FarmConfig)) => {
      setFarmConfig((prev) => {
        if (typeof updater === 'function') {
          return updater(prev);
        }
        return { ...prev, ...updater };
      });
    },
    []
  );

  // Set number of zones dynamically (2 to 10 zones)
  const setZoneCount = useCallback((count: number) => {
    const validCount = Math.max(1, Math.min(10, count));

    setFarmConfig((prev) => {
      const currentZones = [...prev.zones];
      const currentLen = currentZones.length;

      if (validCount === currentLen) return prev;

      if (validCount > currentLen) {
        for (let i = currentLen; i < validCount; i++) {
          const newZone = createZone(i, '', 0);
          currentZones.push(newZone);
        }
      } else {
        currentZones.splice(validCount);
      }

      const totalPlants = currentZones.reduce((acc, z) => acc + (z.totalPlants || 0), 0);

      return {
        ...prev,
        zoneCount: validCount,
        zones: currentZones,
        totalPlants,
      };
    });
  }, []);

  // Update specific zone crop and plant count
  const updateZoneCropAndPlants = useCallback(
    (zoneId: string, crop: string, plantCount: number) => {
      setFarmConfig((prev) => {
        const validPlantCount = Math.max(0, plantCount);
        const directions: SectionDirection[] = ['North', 'South', 'East', 'West'];
        const quarterPlants = Math.floor(validPlantCount / 4);
        const remainder = validPlantCount % 4;

        const updatedZones = prev.zones.map((zone) => {
          if (zone.id !== zoneId) return zone;

          const updatedSections = { ...zone.sections };
          directions.forEach((dir, idx) => {
            const count = quarterPlants + (idx < remainder ? 1 : 0);
            const currentSec = updatedSections[dir];
            const currentInputs = currentSec ? currentSec.manualInputs : {
              temperature: null,
              humidity: null,
              soilMoisture: null,
              lightIntensity: null,
              rainfall: null,
              waterStress: null,
              pestRisk: null,
              nutrientCondition: null,
            };

            updatedSections[dir] = {
              id: `${zoneId}-${dir}`,
              zoneId,
              direction: dir,
              crop,
              plantCount: count,
              manualInputs: currentInputs,
              calculatedHealth: calculateSectionHealth(currentInputs, crop),
            };
          });

          return {
            ...zone,
            crop,
            totalPlants: validPlantCount,
            sections: updatedSections,
          };
        });

        const totalPlants = updatedZones.reduce((acc, z) => acc + (z.totalPlants || 0), 0);

        return {
          ...prev,
          zones: updatedZones,
          totalPlants,
        };
      });
    },
    []
  );

  // Add event
  const addFarmEvent = useCallback(
    (newEvent: Omit<FarmEvent, 'id' | 'timestamp' | 'status'>) => {
      const id = `evt-${Date.now().toString(36)}`;
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const res = resolveEventPlantGroup(newEvent, farmConfig.zones);
      const createdEvent: FarmEvent = {
        ...newEvent,
        id,
        timestamp,
        status: 'Active',
        zoneId: res.zoneId,
        direction: res.direction,
        locationName: res.cleanLocationName || newEvent.locationName || `Zone ${res.zoneId} — ${res.direction} Section`,
        description: res.cleanDescription || newEvent.description,
        currentLocation: res.currentLocation, // ALWAYS THE GROUP SHARED ADDRESS
        nearestPlantAddress: res.groupAddress,
        nearestGroupId: res.groupId,
        nearestGroupCode: res.groupCode,
        nearestGroupAddress: res.groupAddress,
        nearestGroupPlantCount: res.plantCount,
        nearestGroupPlantsSummary: res.plantsSummary,
      };

      setEvents((prev) => [createdEvent, ...prev]);
    },
    [farmConfig.zones]
  );

  // Resolve event
  const resolveFarmEvent = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'Resolved' as const } : e))
    );
  }, []);

  // Move existing event across coordinates (dynamic group address update)
  const moveFarmEvent = useCallback(
    (id: string, newX: number, newY: number) => {
      setEvents((prev) =>
        prev.map((evt) => {
          if (evt.id !== id) return evt;
          const updatedCoords = { ...evt, x: newX, y: newY, positionX: newX, positionY: newY };
          const res = resolveEventPlantGroup(updatedCoords, farmConfig.zones);
          return {
            ...updatedCoords,
            zoneId: res.zoneId,
            direction: res.direction,
            locationName: res.cleanLocationName || evt.locationName || `Zone ${res.zoneId} — ${res.direction} Section`,
            description: res.cleanDescription || evt.description,
            currentLocation: res.currentLocation, // Instantly updates to new group address!
            nearestPlantAddress: res.groupAddress,
            nearestGroupId: res.groupId,
            nearestGroupCode: res.groupCode,
            nearestGroupAddress: res.groupAddress,
            nearestGroupPlantCount: res.plantCount,
            nearestGroupPlantsSummary: res.plantsSummary,
            nearestPlantId: res.nearestPlantId || evt.nearestPlantId,
          };
        })
      );
    },
    [farmConfig.zones]
  );

  // Clear all events
  const clearAllEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Compute summary stats across all sections
  const summaryStats: FarmSummaryStats = useMemo(() => {
    let totalTemp = 0;
    let tempCount = 0;
    let totalHum = 0;
    let humCount = 0;
    let totalMoist = 0;
    let moistCount = 0;

    let healthy = 0;
    let warning = 0;
    let highRisk = 0;
    let critical = 0;
    let awaiting = 0;
    let sectionsTotal = 0;

    const dirs: SectionDirection[] = ['North', 'South', 'East', 'West'];

    farmConfig.zones.forEach((zone) => {
      dirs.forEach((dir) => {
        const sec = zone.sections[dir];
        if (sec) {
          sectionsTotal++;
          const inputs = sec.manualInputs;
          if (inputs.temperature !== null) {
            totalTemp += inputs.temperature;
            tempCount++;
          }
          if (inputs.humidity !== null) {
            totalHum += inputs.humidity;
            humCount++;
          }
          if (inputs.soilMoisture !== null) {
            totalMoist += inputs.soilMoisture;
            moistCount++;
          }

          switch (sec.calculatedHealth.status) {
            case 'Healthy':
              healthy++;
              break;
            case 'Warning':
              warning++;
              break;
            case 'High Risk':
              highRisk++;
              break;
            case 'Critical':
              critical++;
              break;
            case 'Awaiting Input':
            default:
              awaiting++;
              break;
          }
        }
      });
    });

    return {
      avgTemp: tempCount > 0 ? Math.round((totalTemp / tempCount) * 10) / 10 : null,
      avgHumidity: humCount > 0 ? Math.round((totalHum / humCount) * 10) / 10 : null,
      avgMoisture: moistCount > 0 ? Math.round((totalMoist / moistCount) * 10) / 10 : null,
      healthyCount: healthy,
      warningCount: warning,
      highRiskCount: highRisk,
      criticalCount: critical,
      awaitingCount: awaiting,
      totalSections: sectionsTotal,
    };
  }, [farmConfig]);

  const updateOverallFarmSensors = useCallback(
    (readings: {
      temperature: number | null;
      humidity: number | null;
      soilMoisture: number | null;
      weatherCondition: string;
    }) => {
      setFarmConfig((prev) => ({
        ...prev,
        overallTemperature: readings.temperature,
        overallHumidity: readings.humidity,
        overallSoilMoisture: readings.soilMoisture,
        weatherCondition: readings.weatherCondition,
      }));
    },
    []
  );

  // Complete Private Logout: Wipes all application memory state and returns cleanly to login
  const logout = useCallback(async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      console.warn('Notice signing out from Firebase:', e);
    }
    // Wipe in-memory state
    setUser(null);
    setFarmConfig(createFreshUserFarmConfig('', ''));
    setEvents([]);
    setSelectedSection(null);
    setActiveTab('dashboard');

    // Clean up all local caches
    try {
      localStorage.removeItem('farmtwin_active_user');
      localStorage.removeItem('farmtwin_user');
      localStorage.removeItem('farmtwin_config');
      localStorage.removeItem('farmtwin_events');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('farmtwin_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
  }, []);

  const value = {
    user,
    setUser,
    farmConfig,
    setFarmConfig,
    events,
    setEvents,
    activeTab,
    setActiveTab,
    selectedSection,
    setSelectedSection,
    updateSectionInputs,
    updateFarmConfig,
    setZoneCount,
    updateZoneCropAndPlants,
    addFarmEvent,
    resolveFarmEvent,
    moveFarmEvent,
    clearAllEvents,
    summaryStats,
    updateOverallFarmSensors,
    logout,
    resetAllInputsToAwaiting,
    applyPreset,
    applyPresetToAllSections,
  };

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
};

export function useFarm(): FarmContextType {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}
