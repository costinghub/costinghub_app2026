import type { ForgingInput, ForgingResult, MarkupCosts, SurfaceTreatment } from '../types';

export const calculateForgingCosts = (
  input: ForgingInput,
  regionCosts: any[] = []
): ForgingResult => {
  const {
    batchVolume = 1,
    finishedPartWeightKg = 0,
    materialCostPerKg = 0,
    yieldRate = 75,
    scaleLossPercent = 3,
    scrapReturnValuePercent = 30,
    scrapReturnRate = 90,
    dieCost = 0,
    dieLifeShots = 10000,
    heatingEnergyCostPerKg = 0.20,
    shearingHourlyRate = 45,
    shearingCycleTimeSec = 15,
    forgingCycleTimeSec = 30,
    forgingMachineHourlyRate = 120,
    trimmingCycleTimeSec = 15,
    trimmingHourlyRate = 50,
    inspectionCostPerPart = 0,
    heatTreatmentCostPerPart = 0,
    partSurfaceAreaM2 = 0,
    surfaceTreatments = [],
    markups
  } = input;

  const vol = batchVolume > 0 ? batchVolume : 1;

  // 1) Weight and material analysis
  const effectiveYield = yieldRate > 0 && yieldRate <= 100 ? yieldRate : 100;
  const rawBilletWeightBeforeScaleLoss = finishedPartWeightKg / (effectiveYield / 100);
  
  const scaleLossFactor = scaleLossPercent / 100;
  const rawBilletWeightKg = rawBilletWeightBeforeScaleLoss / (1 - scaleLossFactor);
  const scaleLossWeightKg = rawBilletWeightKg * scaleLossFactor;
  const flashScrapWeightKg = Math.max(0, rawBilletWeightKg - finishedPartWeightKg - scaleLossWeightKg);

  const rawMaterialBilletCost = rawBilletWeightKg * materialCostPerKg;

  // Scrap return logic for flash scrap
  const scrapReturnFactor = scrapReturnRate / 100;
  const scrapValueMultiplier = scrapReturnValuePercent / 100;
  const scrapCreditPerPart = flashScrapWeightKg * materialCostPerKg * scrapValueMultiplier * scrapReturnFactor;
  const netMaterialCostPerPart = Math.max(0, rawMaterialBilletCost - scrapCreditPerPart);

  // 2) Processing & Energy Routing
  const heatingCostPerPart = rawBilletWeightKg * heatingEnergyCostPerKg;
  const shearingCostPerPart = (shearingCycleTimeSec / 3600) * shearingHourlyRate;
  const forgingPressCostPerPart = (forgingCycleTimeSec / 3600) * forgingMachineHourlyRate;
  const trimmingCostPerPart = (trimmingCycleTimeSec / 3600) * trimmingHourlyRate;

  // 3) Die Tooling Amortization
  const toolingAmortizedCostPerPart = dieLifeShots > 0 ? (dieCost / dieLifeShots) : 0;

  // 4) Surface Treatment
  let surfaceTreatmentCostPerPart = 0;
  surfaceTreatments.forEach((treatment: SurfaceTreatment) => {
    if (treatment.unit === 'per_kg') {
      const weight = treatment.based_on === 'raw_weight' ? rawBilletWeightKg : finishedPartWeightKg;
      surfaceTreatmentCostPerPart += weight * treatment.cost;
    } else if (treatment.unit === 'per_area') {
      surfaceTreatmentCostPerPart += partSurfaceAreaM2 * treatment.cost;
    }
  });

  // 5) Base Manufacturing Cost (excl surface treatment and die amortization)
  const baseManufacturingCost =
    netMaterialCostPerPart +
    heatingCostPerPart +
    shearingCostPerPart +
    forgingPressCostPerPart +
    trimmingCostPerPart +
    Number(inspectionCostPerPart) +
    Number(heatTreatmentCostPerPart);

  // 6) Markup calculations
  const baseCost1 = baseManufacturingCost + toolingAmortizedCostPerPart;
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
    rawBilletWeightKg,
    flashScrapWeightKg,
    scaleLossWeightKg,
    rawMaterialBilletCost,
    scrapCreditPerPart,
    netMaterialCostPerPart,
    
    heatingCostPerPart,
    shearingCostPerPart,
    forgingPressCostPerPart,
    trimmingCostPerPart,
    toolingAmortizedCostPerPart,
    surfaceTreatmentCost: surfaceTreatmentCostPerPart * vol,
    
    baseManufacturingCost,
    
    markupCosts,
    totalCost,
    costPerPart,
  };
};
