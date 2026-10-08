import { Plant, PlantGroup, SectionData, SectionDirection, ZoneData } from '../types/farm';
import { getMainRiskFactor } from './healthEngine';

export const DIRECTION_INITIALS: Record<SectionDirection, string> = {
  North: 'N',
  South: 'S',
  East: 'E',
  West: 'W',
};

/**
 * Standard Shared Physical Address for a 10-plant group:
 * Format: Zone <ZoneId> / <Direction> / Group <DirInitial>-<GroupNum>
 * Example: Zone A / North / Group N-01 (or Zone 1 / North / Group N-01)
 */
export function getGroupAddress(
  zoneId: string,
  direction: SectionDirection,
  groupNumber: number
): string {
  const dirInitial = DIRECTION_INITIALS[direction] || direction[0];
  const groupPad = String(groupNumber).padStart(2, '0');
  return `Zone ${zoneId} / ${direction} / Group ${dirInitial}-${groupPad}`;
}

/**
 * Standard Group ID:
 * Format: Group <DirInitial>-<GroupNum>
 * Example: Group N-01
 */
export function getGroupId(direction: SectionDirection, groupNumber: number): string {
  const dirInitial = DIRECTION_INITIALS[direction] || direction[0];
  const groupPad = String(groupNumber).padStart(2, '0');
  return `Group ${dirInitial}-${groupPad}`;
}

/**
 * Generate 10-plant groups dynamically for a section.
 * Every 10 consecutive plants form exactly ONE Plant Group.
 * Any remainder (e.g. 5 in 105) forms the final group of 5 plants without creating fake plants.
 */
export function generatePlantGroupsForSection(
  zone: ZoneData,
  section: SectionData,
  maxGenerate?: number
): PlantGroup[] {
  const count =
    maxGenerate !== undefined ? Math.min(section.plantCount, maxGenerate) : section.plantCount;

  if (count <= 0) return [];

  const groups: PlantGroup[] = [];
  const dirInitial = DIRECTION_INITIALS[section.direction];
  const mainRisk = getMainRiskFactor(section.calculatedHealth);

  const numGroups = Math.ceil(count / 10);

  // Arrange group boxes cleanly inside section boundaries (0% to 100%)
  const cols =
    numGroups <= 1
      ? 1
      : numGroups <= 2
      ? 2
      : numGroups <= 3
      ? 3
      : numGroups <= 4
      ? 2
      : numGroups <= 6
      ? 3
      : numGroups <= 8
      ? 4
      : numGroups <= 12
      ? 4
      : numGroups <= 16
      ? 4
      : numGroups <= 20
      ? 5
      : numGroups <= 25
      ? 5
      : Math.ceil(Math.sqrt(numGroups * 1.25));

  const rows = Math.ceil(numGroups / cols);

  // Quadrant content boundaries
  const padX = 7;
  const padY = 9;
  const availW = 86;
  const availH = 82;

  const cellW = availW / cols;
  const cellH = availH / rows;

  const boxW = Math.max(13, cellW * 0.9);
  const boxH = Math.max(13, cellH * 0.9);

  for (let g = 0; g < numGroups; g++) {
    const groupNumber = g + 1;
    const c = g % cols;
    const r = Math.floor(g / cols);

    const boxCenterX = Math.round((padX + (c + 0.5) * cellW) * 10) / 10;
    const boxCenterY = Math.round((padY + (r + 0.5) * cellH) * 10) / 10;

    const boxLeft = Math.round((boxCenterX - boxW / 2) * 10) / 10;
    const boxTop = Math.round((boxCenterY - boxH / 2) * 10) / 10;

    const startPlantNumber = g * 10 + 1;
    const endPlantNumber = Math.min(count, (g + 1) * 10);
    const plantCountInGroup = endPlantNumber - startPlantNumber + 1;

    const groupId = getGroupId(section.direction, groupNumber);
    const groupCode = `${dirInitial}-${String(groupNumber).padStart(2, '0')}`;
    const sharedAddress = getGroupAddress(zone.id, section.direction, groupNumber);
    const startPad = String(startPlantNumber).padStart(3, '0');
    const endPad = String(endPlantNumber).padStart(3, '0');
    const plantsSummary = `P${startPad}–P${endPad}`;
    const plantIdRange = `${zone.id}-${dirInitial}-P${startPad}–${zone.id}-${dirInitial}-P${endPad}`;
    const cropName = section.crop || zone.crop || 'Crop';

    const groupPlants: Plant[] = [];

    // Position plant dots neatly inside this group box
    for (let p = 0; p < plantCountInGroup; p++) {
      const plantNum = startPlantNumber + p;
      const plantPad = String(plantNum).padStart(3, '0');
      const plantId = `${zone.id}-${dirInitial}-P${plantPad}`;

      let dotX: number;
      let dotY: number;

      if (plantCountInGroup <= 5) {
        // Single row of dots
        dotX =
          plantCountInGroup === 1
            ? boxCenterX
            : boxLeft + boxW * (0.2 + (p / (plantCountInGroup - 1)) * 0.6);
        dotY = boxTop + boxH * 0.55;
      } else {
        // 2 rows of 5 dots
        const dotCol = p % 5;
        const dotRow = Math.floor(p / 5); // 0 or 1
        dotX = boxLeft + boxW * (0.16 + (dotCol / 4) * 0.68);
        dotY = boxTop + boxH * (0.42 + dotRow * 0.32);
      }

      groupPlants.push({
        plantId,
        plantNumber: plantNum,
        groupId,
        groupCode,
        address: sharedAddress, // ONE SHARED ADDRESS FOR THE GROUP
        groupAddress: sharedAddress,
        zoneId: zone.id,
        sectionDirection: section.direction,
        row: r + 1,
        position: p + 1,
        crop: section.crop || zone.crop,
        status: section.calculatedHealth.status,
        riskLevel: section.calculatedHealth.riskLevel,
        mainRiskFactor: mainRisk,
        x: Math.round(dotX * 10) / 10,
        y: Math.round(dotY * 10) / 10,
        indexInGroup: p,
      });
    }

    groups.push({
      groupId,
      groupCode,
      groupNumber,
      zoneId: zone.id,
      sectionDirection: section.direction,
      address: sharedAddress,
      startPlantNumber,
      endPlantNumber,
      plantCount: plantCountInGroup,
      plantsSummary,
      plantIdRange,
      crop: cropName,
      plants: groupPlants,
      status: section.calculatedHealth.status,
      riskLevel: section.calculatedHealth.riskLevel,
      mainRiskFactor: mainRisk,
      boxX: boxCenterX,
      boxY: boxCenterY,
      boxLeft,
      boxTop,
      boxWidth: Math.round(boxW * 10) / 10,
      boxHeight: Math.round(boxH * 10) / 10,
    });
  }

  return groups;
}

/**
 * Returns all individual plant records for a section, each tagged with its group and shared address.
 */
export function generatePlantsForSection(
  zone: ZoneData,
  section: SectionData,
  maxGenerate?: number
): Plant[] {
  const groups = generatePlantGroupsForSection(zone, section, maxGenerate);
  const plants: Plant[] = [];
  for (const grp of groups) {
    plants.push(...grp.plants);
  }
  return plants;
}

/**
 * Returns all plant groups across all zones in the farm.
 */
export function generateAllPlantGroups(zones: ZoneData[], maxPerSection?: number): PlantGroup[] {
  const allGroups: PlantGroup[] = [];
  const directions: SectionDirection[] = ['North', 'South', 'East', 'West'];

  for (const zone of zones) {
    for (const dir of directions) {
      const section = zone.sections[dir];
      if (section) {
        allGroups.push(...generatePlantGroupsForSection(zone, section, maxPerSection));
      }
    }
  }

  return allGroups;
}

/**
 * Returns all plants across all zones, guaranteed to match the group address architecture.
 */
export function generateAllPlants(zones: ZoneData[], maxPerSection?: number): Plant[] {
  const allPlants: Plant[] = [];
  const directions: SectionDirection[] = ['North', 'South', 'East', 'West'];

  for (const zone of zones) {
    for (const dir of directions) {
      const section = zone.sections[dir];
      if (section) {
        allPlants.push(...generatePlantsForSection(zone, section, maxPerSection));
      }
    }
  }

  return allPlants;
}

export interface NearestGroupResult {
  nearestGroup: PlantGroup;
  nearestPlant: Plant | null;
  distance: number;
  sharedAddress: string;
  locationNote: string;
  nearbySummary: string;
}

/**
 * Centralized Detection Finder:
 * Given target coordinates (X, Y) within a section, finds which 10-plant group the detected object
 * is inside or nearest to, and returns its SHARED GROUP ADDRESS.
 */
export function getNearestPlantGroup(
  groups: PlantGroup[],
  targetX: number,
  targetY: number
): NearestGroupResult | null {
  if (!groups || groups.length === 0) return null;

  let nearestGroup: PlantGroup = groups[0];
  let minGroupDistance = Infinity;
  let nearestPlantInGroup: Plant | null = null;

  for (const grp of groups) {
    // Check if directly inside the group box boundary
    const isInsideBox =
      targetX >= grp.boxLeft &&
      targetX <= grp.boxLeft + grp.boxWidth &&
      targetY >= grp.boxTop &&
      targetY <= grp.boxTop + grp.boxHeight;

    // Distance to box center
    const centerDist = Math.hypot(grp.boxX - targetX, grp.boxY - targetY);
    const effectiveDist = isInsideBox ? centerDist * 0.5 : centerDist;

    if (effectiveDist < minGroupDistance) {
      minGroupDistance = effectiveDist;
      nearestGroup = grp;
    }
  }

  // Find closest individual plant inside the identified group
  if (nearestGroup.plants.length > 0) {
    let minPlantDist = Infinity;
    for (const p of nearestGroup.plants) {
      const pDist = Math.hypot(p.x - targetX, p.y - targetY);
      if (pDist < minPlantDist) {
        minPlantDist = pDist;
        nearestPlantInGroup = p;
      }
    }
  }

  return {
    nearestGroup,
    nearestPlant: nearestPlantInGroup,
    distance: minGroupDistance,
    sharedAddress: nearestGroup.address,
    locationNote: nearestGroup.address,
    nearbySummary: `Plant Group ${nearestGroup.groupId} • ${nearestGroup.plantCount} plants • ${nearestGroup.plantsSummary}`,
  };
}

/**
 * Retrieve a specific PlantGroup by its ID.
 */
export function getPlantGroup(groups: PlantGroup[], groupId: string): PlantGroup | null {
  return groups.find((g) => g.groupId === groupId || g.groupCode === groupId) || null;
}

/**
 * Retrieve member plants of a plant group.
 */
export function getGroupMembers(group: PlantGroup): Plant[] {
  return group.plants;
}

/**
 * Backward-compatible helper for finding closest plant, now also populates group address.
 */
export function findNearestPlant(plants: Plant[], targetX: number, targetY: number): Plant | null {
  if (!plants || plants.length === 0) return null;
  let nearest = plants[0];
  let minDistance = Infinity;

  for (const plant of plants) {
    const dist = Math.hypot(plant.x - targetX, plant.y - targetY);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = plant;
    }
  }

  return nearest;
}

export interface EventGroupResolution {
  currentLocation: string; // e.g. "Zone B / North / Group N-02"
  groupId: string; // e.g. "Group N-02"
  groupCode: string; // e.g. "N-02"
  groupAddress: string; // e.g. "Zone B / North / Group N-02"
  plantCount: number; // e.g. 10
  plantsSummary: string; // e.g. "P011–P020"
  nearbySummary: string; // e.g. "N-02 (10 plants, P011–P020)"
  nearestPlantId?: string;
  zoneId: string;
  direction: SectionDirection;
  cleanDescription?: string;
  cleanLocationName?: string;
}

/**
 * Universal Event Location Resolver:
 * Maps any event (existing, legacy, or moving) to its enclosing/nearest 10-plant group.
 * Guarantees that "Near Plant ..." is NEVER shown, and only the SHARED GROUP ADDRESS is returned.
 *
 * Examples:
 * - "Near Plant B-N-R09-P11" -> Zone B / North / Group N-02 | N-02 (10 plants, P011–P020)
 * - "Near Plant B-E-R04-P04" -> Zone B / East / Group E-01 | E-01 (10 plants, P001–P010)
 * - "Near Plant A-N-R01-P06" -> Zone A / North / Group N-01 | N-01 (10 plants, P001–P010)
 */
export function resolveEventPlantGroup(
  evt: {
    zoneId?: string;
    direction?: SectionDirection;
    x?: number;
    y?: number;
    currentLocation?: string;
    nearestPlantId?: string;
    nearestGroupId?: string;
    nearestGroupCode?: string;
    nearestGroupAddress?: string;
    description?: string;
    locationName?: string;
  },
  zones: ZoneData[]
): EventGroupResolution {
  const combinedStr = `${evt.nearestPlantId || ''} ${evt.currentLocation || ''} ${evt.locationName || ''} ${evt.description || ''}`;

  // 1. Check for legacy plant string like "Near Plant B-N-R09-P11" or "B-N-R09-P11" or "B-E-P04"
  const legacyMatch = combinedStr.match(/(?:Near\s*Plant\s*)?([A-Za-z0-9]+)-([NSEW])-R?\d*-?P(\d+)/i);
  let parsedZoneId: string | null = null;
  let parsedDirection: SectionDirection | null = null;
  let parsedPlantNum: number | null = null;

  if (legacyMatch) {
    parsedZoneId = legacyMatch[1].toUpperCase();
    const dirLetter = legacyMatch[2].toUpperCase();
    parsedDirection =
      dirLetter === 'N' ? 'North' :
      dirLetter === 'S' ? 'South' :
      dirLetter === 'E' ? 'East' : 'West';
    parsedPlantNum = parseInt(legacyMatch[3], 10);
  } else {
    // Check for zone/direction mentions in text
    const zoneMatch = combinedStr.match(/Zone\s*([A-Za-z0-9]+)/i);
    if (zoneMatch) parsedZoneId = zoneMatch[1].toUpperCase();

    const dirMatch = combinedStr.match(/(North|South|East|West)/i);
    if (dirMatch) parsedDirection = dirMatch[1] as SectionDirection;

    const plantNumMatch = combinedStr.match(/P(\d+)/i);
    if (plantNumMatch) parsedPlantNum = parseInt(plantNumMatch[1], 10);
  }

  // Resolve Zone and Section
  const resolvedZoneId = parsedZoneId || evt.zoneId || (zones[0] ? zones[0].id : 'A');
  const zone =
    zones.find((z) => z.id.toUpperCase() === resolvedZoneId.toUpperCase()) ||
    zones[0] ||
    ({ id: resolvedZoneId, sections: {} as any } as ZoneData);

  const resolvedDirection: SectionDirection = parsedDirection || evt.direction || 'North';
  const section = zone?.sections?.[resolvedDirection];
  const dirInitial = DIRECTION_INITIALS[resolvedDirection] || 'N';

  // 2. If a specific plant number was identified (e.g. plant 11 -> Group N-02)
  if (parsedPlantNum !== null && !isNaN(parsedPlantNum) && parsedPlantNum > 0) {
    const groupNumber = Math.max(1, Math.ceil(parsedPlantNum / 10));
    const groupCode = `${dirInitial}-${String(groupNumber).padStart(2, '0')}`;
    const groupId = `Group ${groupCode}`;
    const sharedAddress = getGroupAddress(zone.id, resolvedDirection, groupNumber);

    const startPlantNumber = (groupNumber - 1) * 10 + 1;
    let endPlantNumber = groupNumber * 10;
    if (section && section.plantCount > 0 && section.plantCount < endPlantNumber) {
      endPlantNumber = section.plantCount;
    }
    const plantCount = Math.max(1, endPlantNumber - startPlantNumber + 1);
    const startPad = String(startPlantNumber).padStart(3, '0');
    const endPad = String(endPlantNumber).padStart(3, '0');
    const plantsSummary = `P${startPad}–P${endPad}`;
    const nearbySummary = `${groupCode} (${plantCount} plants, ${plantsSummary})`;

    // Sanitize description: strip "Near Plant ..." or "near Plant ..."
    let cleanDesc = evt.description;
    if (cleanDesc) {
      cleanDesc = cleanDesc.replace(/(?:Near\s*Plant|near\s*Plant)\s*[A-Za-z0-9]+-[NSEW]-R?\d*-?P\d+/gi, `Group ${groupCode}`);
    }

    return {
      currentLocation: sharedAddress,
      groupId,
      groupCode,
      groupAddress: sharedAddress,
      plantCount,
      plantsSummary,
      nearbySummary,
      nearestPlantId: `${zone.id}-${dirInitial}-P${String(parsedPlantNum).padStart(3, '0')}`,
      zoneId: zone.id,
      direction: resolvedDirection,
      cleanDescription: cleanDesc,
      cleanLocationName: `Zone ${zone.id} — ${resolvedDirection} Section`,
    };
  }

  // 3. Otherwise: resolve from section groups using coordinates (X, Y)
  const posX = typeof evt.x === 'number' ? evt.x : 50;
  const posY = typeof evt.y === 'number' ? evt.y : 50;

  let finalGroup: PlantGroup | null = null;
  let nearestPlantId: string | undefined = evt.nearestPlantId;

  if (section && section.plantCount > 0) {
    const groups = generatePlantGroupsForSection(zone, section);
    if (groups.length > 0) {
      const nearestRes = getNearestPlantGroup(groups, posX, posY);
      if (nearestRes) {
        finalGroup = nearestRes.nearestGroup;
        nearestPlantId = nearestRes.nearestPlant?.plantId;
      }
    }
  }

  // If section has no plant records yet, compute mathematically for quadrant coordinates
  if (!finalGroup) {
    const groupNumber = 1;
    const groupCode = `${dirInitial}-01`;
    const groupId = `Group ${groupCode}`;
    const sharedAddress = getGroupAddress(zone.id, resolvedDirection, groupNumber);
    const plantCount = 10;
    const plantsSummary = 'P001–P010';
    const nearbySummary = `${groupCode} (${plantCount} plants, ${plantsSummary})`;

    let cleanDesc = evt.description;
    if (cleanDesc) {
      cleanDesc = cleanDesc.replace(/(?:Near\s*Plant|near\s*Plant)\s*[A-Za-z0-9]+-[NSEW]-R?\d*-?P\d+/gi, `Group ${groupCode}`);
    }

    return {
      currentLocation: sharedAddress,
      groupId,
      groupCode,
      groupAddress: sharedAddress,
      plantCount,
      plantsSummary,
      nearbySummary,
      nearestPlantId,
      zoneId: zone.id,
      direction: resolvedDirection,
      cleanDescription: cleanDesc,
      cleanLocationName: `Zone ${zone.id} — ${resolvedDirection} Section`,
    };
  }

  const groupAddress = finalGroup.address;
  const nearbySummary = `${finalGroup.groupCode} (${finalGroup.plantCount} plants, ${finalGroup.plantsSummary})`;

  let cleanDesc = evt.description;
  if (cleanDesc) {
    cleanDesc = cleanDesc.replace(/(?:Near\s*Plant|near\s*Plant)\s*[A-Za-z0-9]+-[NSEW]-R?\d*-?P\d+/gi, `Group ${finalGroup.groupCode}`);
  }

  return {
    currentLocation: groupAddress, // ALWAYS SHARED GROUP ADDRESS: "Zone B / North / Group N-02"
    groupId: finalGroup.groupId,
    groupCode: finalGroup.groupCode,
    groupAddress,
    plantCount: finalGroup.plantCount,
    plantsSummary: finalGroup.plantsSummary,
    nearbySummary,
    nearestPlantId: nearestPlantId || finalGroup.plants[0]?.plantId,
    zoneId: zone.id,
    direction: resolvedDirection,
    cleanDescription: cleanDesc,
    cleanLocationName: `Zone ${zone.id} — ${resolvedDirection} Section`,
  };
}

/**
 * Migration Function for Existing / Stored Events:
 * Cleanses any legacy individual plant references ("Near Plant ...") and converts them into
 * their proper shared 10-plant group addresses.
 */
export function migrateLegacyEvents(eventsList: any[], zones: ZoneData[]): any[] {
  if (!eventsList || !Array.isArray(eventsList)) return [];
  return eventsList.map((evt) => {
    const res = resolveEventPlantGroup(evt, zones);
    return {
      ...evt,
      zoneId: res.zoneId,
      direction: res.direction,
      locationName: res.cleanLocationName || evt.locationName || `Zone ${res.zoneId} — ${res.direction} Section`,
      description: res.cleanDescription || evt.description,
      currentLocation: res.currentLocation,
      nearestPlantAddress: res.groupAddress,
      nearestGroupId: res.groupId,
      nearestGroupCode: res.groupCode,
      nearestGroupAddress: res.groupAddress,
      nearestGroupPlantCount: res.plantCount,
      nearestGroupPlantsSummary: res.plantsSummary,
    };
  });
}
