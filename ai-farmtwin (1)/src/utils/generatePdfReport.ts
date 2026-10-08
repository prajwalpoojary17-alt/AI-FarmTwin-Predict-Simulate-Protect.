import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FarmConfig, SectionData } from '../types/farm';

export interface ReportPdfData {
  farmConfig: FarmConfig;
  currentTemp: string;
  currentHumidity: string;
  currentMoisture: string;
  currentWeather: string;
  overallHealthScore: number | null;
  plantBreakdown: {
    healthy: number;
    warning: number;
    highRisk: number;
    critical: number;
    awaiting: number;
  };
  allSections: SectionData[];
  warningSections: SectionData[];
  formattedDate: string;
}

export function generateReportPDF(data: ReportPdfData): void {
  const {
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
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currentY = 16;

  // 1. Header Banner Box
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(margin, currentY, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AI FARMTWIN - EXECUTIVE FARM HEALTH REPORT', margin + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('PREDICT. SIMULATE. PROTECT. | Live Telemetry & Agronomic Audit', margin + 6, currentY + 16);

  currentY += 28;

  // 2. Farm Identity & Metadata Section
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(farmConfig.farmName || 'Smart Agricultural Farm', margin, currentY);

  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const leftMeta = [
    `Farm Manager: ${farmConfig.farmManager || 'Alex Mercer'}`,
    `Report Date: ${formattedDate}`,
    `Total Acreage: ${farmConfig.acres} Acres`,
  ];

  const rightMeta = [
    `Total Managed Plots: ${farmConfig.zoneCount} Zones (${farmConfig.zoneCount * 4} Sections)`,
    `Total Plants Inventory: ${farmConfig.totalPlants.toLocaleString()} Plants`,
    `Telemetry Status: Synchronized (Live Application Data)`,
  ];

  leftMeta.forEach((txt, i) => {
    doc.text(txt, margin, currentY + i * 5);
  });

  rightMeta.forEach((txt, i) => {
    doc.text(txt, margin + contentWidth / 2, currentY + i * 5);
  });

  currentY += 19;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  currentY += 7;

  // 3. Section: Current Overall Farm Telemetry & Readings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Current Overall Farm Sensor Readings', margin, currentY);

  currentY += 4;

  const overallHealthLabel =
    overallHealthScore !== null
      ? `${overallHealthScore}% (${overallHealthScore >= 80 ? 'Healthy' : overallHealthScore >= 60 ? 'Warning' : 'Critical'})`
      : 'Awaiting Input';

  const telemetryTableData = [
    [
      { content: 'Overall Temperature', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number] } },
      currentTemp,
      { content: 'Overall Humidity', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number] } },
      currentHumidity,
    ],
    [
      { content: 'Overall Soil Moisture', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number] } },
      currentMoisture,
      { content: 'Weather Condition', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number] } },
      currentWeather,
    ],
    [
      { content: 'Overall Farm Crop Health', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number] } },
      overallHealthLabel,
      { content: 'Total Monitored Sections', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number] } },
      `${allSections.length} Sections (4 per zone)`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    body: telemetryTableData,
  });

  currentY = (doc as any).lastAutoTable.finalY + 9;

  // 4. Section: Plant Inventory Health Distribution Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Plant Health Inventory Summary', margin, currentY);

  currentY += 4;

  const totalFarmPlants = farmConfig.totalPlants || 1;
  const calcPct = (count: number) => Math.round((count / totalFarmPlants) * 100);

  const healthTableData = [
    [
      'Healthy Plants',
      plantBreakdown.healthy.toLocaleString(),
      `${calcPct(plantBreakdown.healthy)}%`,
      'Nominal physiological status, zero active stress',
    ],
    [
      'Warning Plants',
      plantBreakdown.warning.toLocaleString(),
      `${calcPct(plantBreakdown.warning)}%`,
      'Sub-optimal conditions requiring monitoring',
    ],
    [
      'High-Risk Plants',
      plantBreakdown.highRisk.toLocaleString(),
      `${calcPct(plantBreakdown.highRisk)}%`,
      'Severe moisture or thermal stress detected',
    ],
    [
      'Critical Plants',
      plantBreakdown.critical.toLocaleString(),
      `${calcPct(plantBreakdown.critical)}%`,
      'Immediate agronomic intervention required',
    ],
    [
      'Awaiting Input',
      plantBreakdown.awaiting.toLocaleString(),
      `${calcPct(plantBreakdown.awaiting)}%`,
      'Pending sensor readings / manual baseline entry',
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    head: [['Status Category', 'Plant Count', 'Farm Share (%)', 'Agronomic Assessment']],
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    body: healthTableData,
  });

  currentY = (doc as any).lastAutoTable.finalY + 9;

  // 5. Section: Zone-Wise Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Zone-Wise Farm Configuration & Health Summary', margin, currentY);

  currentY += 4;

  const zoneTableData = farmConfig.zones.map((zone) => [
    `Zone ${zone.id}`,
    zone.crop,
    zone.totalPlants.toLocaleString(),
    zone.sections.North.calculatedHealth.status,
    zone.sections.South.calculatedHealth.status,
    zone.sections.East.calculatedHealth.status,
    zone.sections.West.calculatedHealth.status,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Zone Name', 'Crop Variety', 'Total Plants', 'North Health', 'South Health', 'East Health', 'West Health']],
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    body: zoneTableData,
  });

  currentY = (doc as any).lastAutoTable.finalY + 9;

  // 6. Section: Section-Wise Crop Health & Telemetry Detail
  // Check if we need a new page for section table
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Detailed Section-Wise Telemetry & Crop Health Matrix', margin, currentY);

  currentY += 4;

  const sectionTableData = allSections.map((sec) => [
    `Zone ${sec.zoneId} - ${sec.direction}`,
    sec.crop,
    sec.plantCount.toString(),
    sec.manualInputs.temperature !== null ? `${sec.manualInputs.temperature}°C` : '—',
    sec.manualInputs.humidity !== null ? `${sec.manualInputs.humidity}%` : '—',
    sec.manualInputs.soilMoisture !== null ? `${sec.manualInputs.soilMoisture}%` : '—',
    sec.calculatedHealth.healthScore !== null ? `${sec.calculatedHealth.healthScore}%` : '—',
    sec.calculatedHealth.status,
    sec.calculatedHealth.warnings.length > 0 ? sec.calculatedHealth.warnings[0] : 'Optimal parameters',
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    head: [['Section Address', 'Crop', 'Plants', 'Temp', 'Humidity', 'Soil Moist', 'Score', 'Status', 'Primary Warning/Stress']],
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    body: sectionTableData,
  });

  currentY = (doc as any).lastAutoTable.finalY + 9;

  // 7. Section: Relevant Warning & Critical Information
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('5. Active Agronomic Warnings & Critical Alerts', margin, currentY);

  currentY += 4;

  if (warningSections.length === 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'plain',
      body: [['Nominal Status: All monitored plots and sections are operating within optimal agronomic thresholds. Zero critical alerts.']],
      bodyStyles: { fontSize: 8.5, textColor: [16, 185, 129], fontStyle: 'bold' },
    });
    currentY = (doc as any).lastAutoTable.finalY + 6;
  } else {
    const warningTableData = warningSections.map((sec) => [
      `Zone ${sec.zoneId} - ${sec.direction} (${sec.crop})`,
      sec.calculatedHealth.status,
      `Temp: ${sec.manualInputs.temperature ?? '—'}°C | Humidity: ${sec.manualInputs.humidity ?? '—'}% | Moisture: ${sec.manualInputs.soilMoisture ?? '—'}%`,
      sec.calculatedHealth.warnings.join('; '),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['Affected Section', 'Status', 'Current Telemetry', 'Active Agronomic Stress Warnings']],
      headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      body: warningTableData,
    });
    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 8. Add Page Numbers and Footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    doc.text('AI FarmTwin Prototype • Software Digital Twin • "Predict. Simulate. Protect."', margin, pageHeight - 8);
    doc.text(`Generated on ${formattedDate} | Live Application Data`, margin + contentWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text(`Page ${page} of ${totalPages}`, margin + contentWidth, pageHeight - 8, { align: 'right' });
  }

  // 9. Save and download PDF file
  const sanitizedFarmName = (farmConfig.farmName || 'Farm')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const filename = `AI-FarmTwin-${sanitizedFarmName}-Report.pdf`;

  doc.save(filename);
}
