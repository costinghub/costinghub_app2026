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
    markups
  } = input;

  const vol = batchVolume > 0 ? batchVolume : 1;

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
  const moldingCostPerPart = (moldingCycleTimeMin / 60) * moldingHourlyRate;
  const pouringCostPerPart = (pouringTimeSec / 3600) * pouringHourlyRate;

  // 3) Core Cost
  const coreCostPerPart = coresUsed
    ? coreWeightKg * (coreMaterialCostPerKg + coreBinderCostPerKg)
    : 0;

  // 4) Fettling / Clean-up
  const fettlingCostPerPart = (fettlingTimeMin / 60) * fettlingHourlyRate;

  // 5) Pattern / Mold Tooling Amortization
  const toolingAmortizedCostPerPart = patternLifeShots > 0 ? (patternCost / patternLifeShots) : 0;

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

  // 7) Base Manufacturing Cost (excl surface treatment and tool amortization, matching machining's cost splits)
  const baseManufacturingCost =
    netMaterialCostPerPart +
    meltingCostPerPart +
    moldingCostPerPart +
    pouringCostPerPart +
    coreCostPerPart +
    fettlingCostPerPart +
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
    
    toolingAmortizedCostPerPart,
    surfaceTreatmentCost: surfaceTreatmentCostPerPart * vol,
    
    baseManufacturingCost,
    
    markupCosts,
    totalCost,
    costPerPart,
  };
};
