import { HealthStatus, RiskLevel, SectionHealthCalculation, SensorInput } from '../types/farm';

export function calculateSectionHealth(input: SensorInput, cropName = 'Standard Crop'): SectionHealthCalculation {
  const {
    temperature,
    humidity,
    soilMoisture,
    rainfall,
    pestRisk,
    nutrientCondition,
  } = input;

  // Check if no values have been entered at all
  const hasTemp = temperature !== null && temperature !== undefined;
  const hasHumidity = humidity !== null && humidity !== undefined;
  const hasMoisture = soilMoisture !== null && soilMoisture !== undefined;

  if (!hasTemp && !hasHumidity && !hasMoisture) {
    return {
      healthScore: null,
      status: 'Awaiting Input',
      riskLevel: 'Unknown',
      warnings: ['Awaiting manual sensor input. Enter values to compute twin health.'],
      factors: {
        temperatureStatus: 'Not entered',
        moistureStatus: 'Not entered',
        humidityStatus: 'Not entered',
        stressScore: 0,
      },
    };
  }

  let score = 100;
  const warnings: string[] = [];
  let tempStatus = 'Optimal';
  let moistureStatus = 'Optimal';
  let humidityStatus = 'Optimal';

  // 1. Temperature Calculation (°C)
  if (hasTemp) {
    const t = temperature as number;
    if (t >= 20 && t <= 30) {
      tempStatus = 'Optimal (20°C - 30°C)';
    } else if (t > 30 && t <= 35) {
      score -= 12;
      tempStatus = 'Mild Heat Stress';
      warnings.push(`Elevated temperature (${t}°C): Transpiration stress detected`);
    } else if (t > 35 && t <= 41) {
      score -= 28;
      tempStatus = 'Severe Heat Stress';
      warnings.push(`High Heat Stress (${t}°C): Stomatal closure & flower abortion hazard`);
    } else if (t > 41) {
      score -= 45;
      tempStatus = 'Extreme Thermal Shock';
      warnings.push(`Critical Thermal Shock (${t}°C): Rapid tissue scorching & cell breakdown`);
    } else if (t >= 15 && t < 20) {
      score -= 10;
      tempStatus = 'Sub-optimal Cool';
      warnings.push(`Cool temperature (${t}°C): Metabolic growth rate suppressed`);
    } else if (t >= 10 && t < 15) {
      score -= 25;
      tempStatus = 'Cold Stress';
      warnings.push(`Cold Stress (${t}°C): Risk of chilling damage to ${cropName}`);
    } else if (t < 10) {
      score -= 42;
      tempStatus = 'Frost Hazard';
      warnings.push(`Frost Threat (${t}°C): Severe freezing risk to foliage`);
    }
  }

  // 2. Soil Moisture Calculation (%)
  if (hasMoisture) {
    const m = soilMoisture as number;
    if (m >= 50 && m <= 75) {
      moistureStatus = 'Optimal (50% - 75%)';
    } else if (m >= 40 && m < 50) {
      score -= 12;
      moistureStatus = 'Mild Moisture Deficit';
      warnings.push(`Mild moisture deficit (${m}%): Soil drying out, schedule irrigation`);
    } else if (m >= 25 && m < 40) {
      score -= 28;
      moistureStatus = 'Moderate to Severe Drought';
      warnings.push(`Drought Stress (${m}%): Nearing permanent wilting point`);
    } else if (m < 25) {
      score -= 45;
      moistureStatus = 'Critical Desiccation';
      warnings.push(`Critical Desiccation (${m}%): Extreme water deficit, immediate drip needed`);
    } else if (m > 75 && m <= 85) {
      score -= 12;
      moistureStatus = 'High Soil Saturation';
      warnings.push(`Soil saturation high (${m}%): Slow down irrigation cycles`);
    } else if (m > 85) {
      score -= 35;
      moistureStatus = 'Severe Waterlogging';
      warnings.push(`Waterlogged Root Zone (${m}%): Anoxia hazard & asphyxiation of roots`);
    }
  }

  // 3. Humidity Calculation (%)
  if (hasHumidity) {
    const h = humidity as number;
    if (h >= 50 && h <= 75) {
      humidityStatus = 'Optimal (50% - 75%)';
    } else if (h > 75 && h <= 85) {
      score -= 10;
      humidityStatus = 'Elevated Humidity';
      warnings.push(`Elevated ambient humidity (${h}%): Mild fungal spore incubation risk`);
    } else if (h > 85) {
      score -= 22;
      humidityStatus = 'Dangerous High Humidity';
      warnings.push(`Excessive humidity (${h}%): High threat of fungal blight and mildew`);
    } else if (h < 35) {
      score -= 12;
      humidityStatus = 'Arid Air';
      warnings.push(`Arid air condition (${h}%): High vapor pressure deficit`);
    }
  }

  // Compound rule: High Heat + High Humidity = Fast Fungal/Bacterial Blight
  if (hasTemp && hasHumidity) {
    if ((temperature as number) >= 27 && (humidity as number) >= 80) {
      score -= 10;
      warnings.push('Compound Threat: High heat combined with saturated humidity promotes bacterial spot & blight');
    }
  }

  // Compound rule: High Heat + Low Soil Moisture = Severe Acute Wilt
  if (hasTemp && hasMoisture) {
    if ((temperature as number) >= 33 && (soilMoisture as number) <= 30) {
      score -= 12;
      warnings.push('Compound Threat: High ambient heat coupled with dry root zone accelerates acute crop wilting');
    }
  }

  // 4. Rainfall factor
  if (rainfall !== null && rainfall !== undefined && rainfall > 50) {
    if (hasMoisture && (soilMoisture as number) > 75) {
      score -= 10;
      warnings.push(`Heavy rainfall (${rainfall}mm) on saturated soil: Soil erosion & nitrogen runoff warning`);
    }
  }

  // 5. Pest & Nutrient factors
  if (pestRisk === 'High') {
    score -= 18;
    warnings.push('High pest vulnerability reported: Immediate crop inspection required');
  } else if (pestRisk === 'Moderate') {
    score -= 8;
    warnings.push('Moderate pest activity detected');
  }

  if (nutrientCondition === 'Deficient') {
    score -= 15;
    warnings.push('Nutrient deficiency reported: Foliar NPK fertigation advised');
  }

  // Clamp score
  const finalScore = Math.max(5, Math.min(100, score));

  let status: HealthStatus = 'Healthy';
  let riskLevel: RiskLevel = 'Low';

  if (finalScore >= 80) {
    status = 'Healthy';
    riskLevel = 'Low';
  } else if (finalScore >= 60) {
    status = 'Warning';
    riskLevel = 'Moderate';
  } else if (finalScore >= 40) {
    status = 'High Risk';
    riskLevel = 'High';
  } else {
    status = 'Critical';
    riskLevel = 'Severe';
  }

  if (warnings.length === 0) {
    warnings.push('All entered parameters within optimal agronomical thresholds.');
  }

  return {
    healthScore: finalScore,
    status,
    riskLevel,
    warnings,
    factors: {
      temperatureStatus: tempStatus,
      moistureStatus: moistureStatus,
      humidityStatus: humidityStatus,
      stressScore: 100 - finalScore,
    },
  };
}

export function getMainRiskFactor(calculation: SectionHealthCalculation): string {
  if (calculation.status === 'Awaiting Input') return 'Awaiting sensor input';
  if (calculation.status === 'Healthy') return 'Optimal parameters';
  return calculation.warnings[0] || 'Sub-optimal environmental condition';
}
