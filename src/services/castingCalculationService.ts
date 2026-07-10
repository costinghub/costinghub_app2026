import type { CastingInput, CastingResult, MarkupCosts, SurfaceTreatment } from '../types';

export const calculateCastingCosts = (
  input: CastingInput,
  regionCosts: any[] = [] // placeholder if we do regional pricing, just like in machining
): CastingResult => {
  const {
    batchVolume = 1,
    finishedPartWeightKg = 0,
    materialCostPerKg = 0,
    yieldRate = 60,
    scrapReturnValuePercent = 50,
    scrapReturnRate = 95,
    patternCost = 0,
    patternLifeShots = 10000,
    coresUsed = false,
    coreWeightKg = 0,
    coreMaterialCostPerKg = 0,
    coreBinderCostPerKg = 0,
    meltingCostPerKg = 0,
    moldingCycleTimeMin = 0,
    moldingHourlyRate = 0,
    pouringTimeSec = 0,
    pouringHourlyRate = 0,
    fettlingTimeMin = 0,
    fettlingHourlyRate = 0,
    inspectionCostPerPart = 0,
    heatTreatmentCostPerPart = 0,
    partSurfaceAreaM2 = 0,
    surfaceTreatments = [],
    markups,
    projectedAreaCm2 = 0,
    numberOfCavities = 1,
    injectionPressureBar = 0,
    safetyFactor = 1.2,
    castingProcess,
    waxWeightKg = 0,
    waxCostPerKg = 10,
    patternInjectionTimeSec = 0
  } = input;

  const vol = batchVolume > 0 ? batchVolume : 1;

  // Moulding Box & Cavity Calculation Logic
  let recommendedCavities = undefined;
  let boxVolumeCm3 = undefined;
  let sandWeightKg = undefined;
  let isHeightWarning = false;

  const boxL = input.mouldingBoxLengthMm || 0;
  const boxW = input.mouldingBoxWidthMm || 0;
  const boxH = input.mouldingBoxHeightMm || 0;

  if (boxL > 0 && boxW > 0 && boxH > 0) {
    boxVolumeCm3 = (boxL * boxW * boxH) / 1000;
    // Standard silica sand density is roughly 1.6 g/cm³
    sandWeightKg = (boxVolumeCm3 * 1.6) / 1000;
  }

  const partL = input.partLengthMm || 0;
  const partW = input.partWidthMm || 0;
  const partH = input.partHeightMm || 0;
  const margin = input.safetyMarginMm || 50;

  if (boxL > 0 && boxW > 0 && partL > 0 && partW > 0) {
    // Orientation 1: part L along box L, part W along box W
    const nx1 = Math.floor((boxL - 2 * margin + margin) / (partL + margin));
    const ny1 = Math.floor((boxW - 2 * margin + margin) / (partW + margin));
    const n1 = Math.max(0, nx1) * Math.max(0, ny1);

    // Orientation 2: part L along box W, part W along box L
    const nx2 = Math.floor((boxL - 2 * margin + margin) / (partW + margin));
    const ny2 = Math.floor((boxW - 2 * margin + margin) / (partL + margin));
    const n2 = Math.max(0, nx2) * Math.max(0, ny2);

    recommendedCavities = Math.max(n1, n2);
  }

  if (boxH > 0 && partH > 0 && boxH < (partH + 2 * margin)) {
    isHeightWarning = true;
  }

  // Determine actual cavities to apply for gating analysis, clamping force and tooling amortization
  const actualCavities = (input.cavityCalculationAuto && recommendedCavities && recommendedCavities > 0)
    ? recommendedCavities
    : (numberOfCavities > 0 ? numberOfCavities : 1);

  // Engineering Calculations
  let calculatedTonnage = undefined;
  if ((castingProcess === 'Pressure Die Casting' || castingProcess === 'HPDC' || castingProcess === 'LPDC') && projectedAreaCm2 > 0) {
    const totalArea = (projectedAreaCm2 * actualCavities) + (input.runnerProjectedAreaCm2 || 0);
    const pressure = input.intensificationPressureBar || injectionPressureBar || (castingProcess === 'HPDC' ? 800 : 100);
    calculatedTonnage = (totalArea * pressure) / 1000 * safetyFactor;
  }

  const waxCostPerPart = (castingProcess === 'Investment Casting') ? (waxWeightKg * waxCostPerKg) : 0;
  // If patternInjectionTimeSec is provided, we can add it to molding cost or separate it.
  // For simplicity, we add it to molding time if process is investment.
  const effectiveMoldingTime = patternInjectionTimeSec > 0 
    ? (moldingCycleTimeMin + (patternInjectionTimeSec / 60)) 
    : moldingCycleTimeMin;

  // 1) Weight and material analysis
  const effectiveYield = yieldRate > 0 && yieldRate <= 100 ? yieldRate : 100;
  const pouredWeightKg = finishedPartWeightKg / (effectiveYield / 100);
  const scrapWeightKg = Math.max(0, pouredWeightKg - finishedPartWeightKg);

  const rawMaterialPartCost = pouredWeightKg * materialCostPerKg;

  // Scrap return logic
  const scrapReturnFactor = scrapReturnRate / 100;
  const scrapValueMultiplier = scrapReturnValuePercent / 100;
  const scrapCreditPerPart = scrapWeightKg * materialCostPerKg * scrapValueMultiplier * scrapReturnFactor;
  const netMaterialCostPerPart = Math.max(0, rawMaterialPartCost - scrapCreditPerPart);

  // 2) Melting & Pouring Energy/Ops Costs
  const meltingCostPerPart = pouredWeightKg * meltingCostPerKg;
  const moldingCostPerPart = (effectiveMoldingTime / 60) * moldingHourlyRate;
  const pouringCostPerPart = (pouringTimeSec / 3600) * pouringHourlyRate;

  // 3) Core Cost
  const coreCostPerPart = coresUsed
    ? coreWeightKg * (coreMaterialCostPerKg + coreBinderCostPerKg)
    : 0;

  // 4) Fettling / Clean-up
  const fettlingCostPerPart = (fettlingTimeMin / 60) * fettlingHourlyRate;

  // 5) Pattern / Mold Tooling Amortization
  let toolingAmortizedCostPerPart = 0;
  if (input.isToolingAmortizedAuto !== false) {
    // Standard calculation: (Cost * Sharing Factor) / Lifetime
    // Sharing factor defaults to 1.0 (fully owned by this part)
    const sharingFactor = input.toolingSharingFactor ?? 1.0;
    const cavCount = actualCavities;
    toolingAmortizedCostPerPart = patternLifeShots > 0 
      ? (patternCost * sharingFactor / (patternLifeShots * cavCount)) 
      : 0;
  } else {
    // Manual override prioritized
    toolingAmortizedCostPerPart = input.toolingAmortizedCostOverride ?? 0;
  }

  // 6) Surface Treatment
  let surfaceTreatmentCostPerPart = 0;
  surfaceTreatments.forEach((treatment: SurfaceTreatment) => {
    if (treatment.unit === 'per_kg') {
      const weight = treatment.based_on === 'raw_weight' ? pouredWeightKg : finishedPartWeightKg;
      surfaceTreatmentCostPerPart += weight * treatment.cost;
    } else if (treatment.unit === 'per_area') {
      surfaceTreatmentCostPerPart += partSurfaceAreaM2 * treatment.cost;
    }
  });

  // 7) Base Manufacturing Cost
  const baseManufacturingCost =
    netMaterialCostPerPart +
    meltingCostPerPart +
    moldingCostPerPart +
    pouringCostPerPart +
    coreCostPerPart +
    fettlingCostPerPart +
    waxCostPerPart +
    Number(inspectionCostPerPart) +
    Number(heatTreatmentCostPerPart);

  // 8) Markup calculations
  // Base 1 covers materials, melting, molding, pouring, cores, fettling, inspection, heat treat, tooling
  const baseCost1 = baseManufacturingCost + toolingAmortizedCostPerPart;
  // Base 2 includes surface treatments
  const baseCost2 = baseCost1 + surfaceTreatmentCostPerPart;

  const markupCostsPerPart: MarkupCosts = {
    general: baseCost1 * ((markups.general || 0) / 100),
    admin: baseCost1 * ((markups.admin || 0) / 100),
    sales: baseCost1 * ((markups.sales || 0) / 100),
    miscellaneous: baseCost1 * ((markups.miscellaneous || 0) / 100),
    packing: baseCost2 * ((markups.packing || 0) / 100),
    transport: baseCost2 * ((markups.transport || 0) / 100),
    profit: baseCost2 * ((markups.profit || 0) / 100),
    duty: baseCost2 * ((markups.duty || 0) / 100),
  };

  const totalMarkupCostPerPart = Object.values(markupCostsPerPart).reduce((sum, cost) => sum + cost, 0);
  const costPerPart = baseCost2 + totalMarkupCostPerPart;
  const totalCost = costPerPart * vol;

  // Scale markup weights to full batch for ResultsDisplay compatibility
  const markupCosts: MarkupCosts = Object.keys(markupCostsPerPart).reduce((acc, key) => {
    (acc as any)[key] = (markupCostsPerPart as any)[key] * vol;
    return acc;
  }, {} as MarkupCosts);

  return {
    pouredWeightKg,
    scrapWeightKg,
    rawMaterialPartCost,
    scrapCreditPerPart,
    netMaterialCostPerPart,
    
    meltingCostPerPart,
    moldingCostPerPart,
    pouringCostPerPart,
    coreCostPerPart,
    fettlingCostPerPart,
    
    calculatedTonnage,
    waxCostPerPart,
    
    // Moulding Box & Cavity Results
    recommendedCavities,
    boxVolumeCm3,
    sandWeightKg,
    isHeightWarning,
    
    toolingAmortizedCostPerPart,
    surfaceTreatmentCost: surfaceTreatmentCostPerPart * vol,
    
    baseManufacturingCost,
    
    markupCosts,
    totalCost,
    costPerPart,
  };
};
