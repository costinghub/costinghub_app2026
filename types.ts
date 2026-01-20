
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', 
  ENTERPRISE_ADMIN = 'ENTERPRISE_ADMIN', 
  COST_ENGINEER = 'COST_ENGINEER', 
  APPROVER = 'APPROVER', 
  VIEWER = 'VIEWER' 
}

export type ModuleType = 'MACHINING' | 'CASTING' | 'MHR' | 'ASSEMBLY' | 'ADMIN';

export interface LicenseLimits {
  [UserRole.ENTERPRISE_ADMIN]: number;
  [UserRole.COST_ENGINEER]: number;
  [UserRole.APPROVER]: number;
  [UserRole.VIEWER]: number;
  [UserRole.SUPER_ADMIN]?: number;
}

export interface ApprovalRule {
  doerEmail: string;
  approverEmail: string;
}

export interface Enterprise {
  id: string;
  name: string;
  domain: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  adminEmail: string;
  
  // Governance
  approvalRequired: boolean;
  approvalRules: ApprovalRule[];

  // Subscription & Limits
  status: 'ACTIVE' | 'SUSPENDED' | 'PAST_DUE';
  subscriptionStatus: 'ACTIVE' | 'CANCELLED' | 'TRIAL';
  maxCalculations: number; 
  
  modules: ModuleType[]; 
  licenses: LicenseLimits; 
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  mfaEnabled?: boolean;
  companyAddress?: string;
  phoneNumber?: string;
}

export interface Customer {
  id: string;
  name: string;
  location: string;
  currency: string;
}

export type FeedbackSegment = 'CALCULATOR_FEEDBACK' | 'FEATURE_REQUIREMENT' | 'BUG_REPORT' | 'OTHER';

export interface UserFeedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  organizationId: string;
  segment: FeedbackSegment;
  comments: string;
  createdAt: Date;
}

export type CalcStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'FINAL';

export interface MachiningCostSheet {
  id: string;
  calculationNumber: string;
  revision?: string;
  customerId?: string;
  partNumber: string;
  partName: string;
  materialId: string;
  rawMaterialWeight: number;
  finishedWeight: number;
  materialRate: number;
  scrapRate: number;
  setups: MachiningSetup[];
  secondaryProcesses: SelectedProcess[];
  
  // Detailed Overheads
  generalOverheadPercent: number;
  adminOverheadPercent: number;
  salesOverheadPercent: number;
  rejectionPercent: number;
  
  profitPercent: number;
  batchSize: number;
  status: CalcStatus;
  approvalComments?: string;
  requestedBy?: string;
  updatedAt: Date;
}

export interface CastingCostSheet {
  id: string;
  calcNumber: string;
  revision?: string;
  partName: string;
  customer: string;
  gradeId: string;
  
  // Dimensions for Layout
  partLength: number;
  partWidth: number;
  partHeight: number;
  safetyMargin: number; 

  // Weight & Yield
  netWeight: number;
  yieldPercent: number; 
  grossWeight: number; 
  
  returnCreditRate: number;
  furnaceId: string;
  energyRate: number;
  
  mouldingBoxId: string;
  cavities: number; 
  
  sandCost: number;
  binderCost: number;
  cores: CastingCore[];
  
  // Finishing
  fettlingProcesses: SelectedProcess[]; 
  
  rejectionPercent: number;
  overheadPercent: number;
  profitPercent: number;
  status?: CalcStatus;
  approvalComments?: string;
  updatedAt: Date;
}

export interface AssemblyCostSheet {
  id: string;
  calcNumber: string;
  revision?: string;
  assemblyName: string;
  assemblyNumber: string;
  customer: string;
  batchSize: number;
  bom: AssemblyBOMItem[];
  labor: AssemblyLaborOp[];
  packagingCost: number;
  logisticsCost: number;
  overheadPercent: number;
  profitPercent: number;
  status?: CalcStatus;
  approvalComments?: string;
  updatedAt: Date;
}

export interface CostProfile { id: string; name: string; country: string; currency: string; period: string; isDefault?: boolean; materialCosts: Record<string, number>; toolCosts: Record<string, number>; machineCosts: Record<string, number>; }
export interface Process { id: string; name: string; category: 'HEAT_TREATMENT' | 'SURFACE_FINISH' | 'MACHINING' | 'WELDING' | 'QUALITY' | 'LOGISTICS' | 'OTHER'; strategy?: MachiningStrategy; unit: 'HR' | 'KG' | 'UNIT' | 'M2' | 'BATCH'; defaultRate: number; description?: string; calculationFormula?: string; requiredParameters?: string; }
export interface SelectedProcess { 
  id: string; 
  processId: string; 
  name: string; 
  category: string; 
  unit: string; 
  rate: number; 
  quantity: number; 
  totalCost: number; 
  weightReference?: 'RAW' | 'FINISHED' | 'CUSTOM'; 
}
export interface MachiningMaterial { id: string; name: string; category: string; density: number; hardness: string; }
export type ToolType = 'END_MILL' | 'BALL_NOSE_MILL' | 'BULL_NOSE_MILL' | 'FACE_MILL' | 'CHAMFER_MILL' | 'SLOT_MILL' | 'T_SLOT_CUTTER' | 'WOODRUFF_CUTTER' | 'FLY_CUTTER' | 'TWIST_DRILL' | 'CENTER_DRILL' | 'STEP_DRILL' | 'REAMER' | 'COUNTERBORE' | 'COUNTERSINK' | 'TAP' | 'BORING_HEAD' | 'TURNING_GENERAL' | 'TURNING_INSERT' | 'TURNING_HOLDER' | 'BORING_BAR' | 'PARTING_INSERT' | 'GROOVING_INSERT' | 'THREADING_INSERT' | 'KNURLING_TOOL' | 'SURFACE_GRINDING_WHEEL' | 'CYLINDRICAL_GRINDING_WHEEL' | 'HONING_STONE' | 'HONING_TOOL' | 'GEAR_HOB' | 'GEAR_SHAPER' | 'BROACH' | 'SAW_BLADE';
export interface Tool { id: string; name: string; type: ToolType; material: 'HSS' | 'CARBIDE' | 'COBALT' | 'PCD' | 'CERAMIC' | 'CBN' | 'DIAMOND' | 'ABRASIVE' | 'STEEL'; abrasiveMaterial?: 'ALUMINUM_OXIDE' | 'SILICON_CARBIDE' | 'CBN' | 'DIAMOND' | 'SG'; brand: string; model: string; cost: number; lifeExpParts: number; diameter?: number; cuttingLength?: number; shankDiameter?: number; isIndexable?: boolean; flutes?: number; numberOfInserts?: number; isoCode?: string; holderCode?: string; insertShape?: string; cornerRadius?: number; approachAngle?: number; minBoreDia?: number; threadSize?: string; width?: number; gritSize?: number; gearModule?: number; pressureAngle?: number; defaultCuttingSpeed?: number; defaultFeedPerTooth?: number; defaultFeedPerRev?: number; }
export type MachineCategory = 'MILLING' | 'TURNING' | 'VTL' | 'HMC' | 'GRINDING' | 'LAPPING' | 'HONING' | 'BROACHING' | 'BURNISHING' | 'GEAR' | 'EDM' | 'SAWING' | 'FINISHING';
export interface Machine { 
  id: string; 
  name: string; 
  category: MachineCategory; 
  subType: string; 
  brand?: string;
  model?: string;
  axis4?: boolean;
  axis5?: boolean;
  multiAxis?: boolean;
  powerKw: number; 
  maxRpm: number; 
  maxX?: number; 
  maxY?: number; 
  maxZ?: number; 
  maxTurningDia?: number; 
  maxTurningLen?: number; 
  rapidFeed?: number; 
  capabilities?: string; 
}

export interface ChemicalElement { id: string; symbol: string; name: string; ratePerKg: number; purity: number; }
export interface CastingGrade { id: string; name: string; baseRate: number; chemicalComposition?: string; }
export interface MouldingBox { id: string; name: string; length: number; width: number; height: number; sandWeight: number; machineRate: number; manpowerRate: number; productionRate: number; }
export interface MeltingFurnace { id: string; name: string; energyPerKg: number; consumableRate: number; meltingLossPercent: number; }
export interface FettlingProcess { id: string; name: string; hourlyRate: number; capacityPerHr: number; unit: 'KG' | 'PC'; }
export interface FoundryConsumables { sandCostPerKg: number; binderCostPerKg: number; energyCostPerKwh: number; laborRatePerHr: number; }

export interface AssemblyBOMItem { id: string; itemNumber: string; description: string; type: 'BOUGHT_OUT' | 'MANUFACTURED' | 'HARDWARE'; qty: number; unitCost: number; }
export interface AssemblyLaborOp { id: string; operationName: string; skillLevel: 'UNSKILLED' | 'SKILLED' | 'EXPERT'; hours: number; hourlyRate: number; }
export interface MHRCalculation { id: string; machineName: string; purchasePrice: number; installationCost: number; usefulLifeYears: number; salvageValuePercent: number; interestRatePercent: number; powerRatingKw: number; powerRatePerUnit: number; spaceSqFt: number; rentPerSqFt: number; consumablesPerMonth: number; maintenanceAnnualPercent: number; operatorSalary: number; supervisionPercent: number; shiftsPerDay: number; hoursPerShift: number; daysPerYear: number; efficiencyPercent: number; }
export type MachiningStrategy = 'FACE_MILLING' | 'POCKET_MILLING' | 'SLOT_MILLING' | 'PROFILE_MILLING' | 'CHAMFER_MILLING' | 'OD_TURNING' | 'FACING_TURNING' | 'GROOVING' | 'VTL_TURNING' | 'THREAD_TURNING' | 'PARTING' | 'BORING' | 'DRILLING' | 'TAPPING' | 'REAMING' | 'COUNTERBORING' | 'CENTER_DRILLING' | 'GEAR_HOBBING' | 'SURFACE_GRINDING' | 'CYLINDRICAL_GRINDING' | 'HONING' | 'LAPPING' | 'BROACHING' | 'BURNISHING';
export interface OperationToolParams { toolId?: string; toolName?: string; diameter?: number; flutes?: number; insertShape?: string; noseRadius?: number; gritSize?: number; wheelWidth?: number; hobStarts?: number; }
export interface OperationDrawingParams { lengthOfCut?: number; widthOfCut?: number; depthOfCut?: number; stockRemoval?: number; startDiameter?: number; endDiameter?: number; radialDepth?: number; numberPasses?: number; module?: number; numberOfTeeth?: number; faceWidth?: number; surfaceArea?: number; strokeLength?: number; pitch?: number; }
export interface Operation { id: string; name: string; strategy: MachiningStrategy; machineId: string; toolParams: OperationToolParams; drawingParams: OperationDrawingParams; cuttingSpeed?: number; rpm?: number; feedPerRev?: number; feedPerTooth?: number; feedRate?: number; setupTimeMin: number; cycleTimeMin: number; rejectionRate: number; }
export interface MachiningSetup { 
  id: string; 
  sequence: number; 
  name: string; 
  machineCategory?: MachineCategory; 
  machineId?: string; 
  setupTimeHr: number; 
  loadingTimeMin: number; 
  unloadingTimeMin: number; 
  toolChangeTimeSec: number; 
  efficiencyPercent: number; 
  operations: Operation[]; 
}
export interface CastingCore { id: string; name: string; weight: number; sandCost: number; productionRate: number; machineRate: number; }
export interface ChatMessage { id: string; role: 'user' | 'model'; text: string; timestamp: Date; }
