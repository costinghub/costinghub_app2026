export interface Enterprise {
  id: string;
  name: string;
  admin_id: string;
  calculation_limit: number;
  created_at: string;
}

export interface SubOrg {
  id: string;
  enterprise_id: string;
  name: string;
}

export interface ApiKey {
  id: string;
  enterprise_id: string;
  key: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  enterprise_id: string;
  action: string;
  user_id: string;
  timestamp: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface RegionCost {
  id: string;
  item_id: string;
  item_type: 'material' | 'machine' | 'tool';
  region: string;
  price: number;
  currency: string;
  valid_from: string;
  created_at?: string;
  user_id?: string;
}
export interface RegionCurrencyMap {
  id: string;
  region: string;
  currency: string;
  user_id?: string;
  created_at?: string;
}

export interface MaterialProperty {
  value: number | string | null;
  unit: string;
}

export interface MaterialMasterItem {
  id: string;
  name: string;
  category: "P - Steel" | "M - Stainless Steel" | "K - Cast Iron" | "N - Non-ferrous" | "S - Superalloys & Titanium" | "H - Hardened Steel" | "O - Polymers" | "SO - Special Alloys" | "Other";
  subCategory?: string;
  properties: { [key: string]: MaterialProperty } | Json;
  module?: 'machining' | 'casting' | 'forging';
  user_id?: string;
  created_at?: string;
}

export interface Machine {
  id: string;
  name: string;
  brand: string;
  model: string;
  hourlyRate: number;
  machineType: string;
  xAxis: number;
  yAxis: number;
  zAxis: number;
  powerKw: number;
  additionalAxis: string;
  module?: 'machining' | 'casting' | 'forging';
  user_id?: string;
  created_at?: string;
}

export interface ProcessParameter {
    name: string;
    label: string;
    unit: string;
    imperialLabel?: string;
    imperialUnit?: string;
}

export interface Process {
  id: string;
  name: string;
  group: string;
  compatibleMachineTypes: string[];
  parameters: ProcessParameter[] | Json;
  formula?: string;
  imageUrl?: string;
  module?: 'machining' | 'casting' | 'forging';
  user_id?: string;
  created_at?: string;
}

export interface Tool {
  id: string;
  name: string;
  brand: string;
  model: string;
  toolType: string;
  material: string;
  diameter: number;
  cornerRadius: number | null;
  numberOfTeeth: number | null;
  arborOrInsert: 'Arbor' | 'Insert' | 'Shank';
  compatibleMachineTypes: string[];
  cuttingSpeedVc: number | null;
  feedPerTooth: number | null;
  speedRpm: number | null;
  feedRate: number | null;
  estimatedLife: number | null;
  price: number | null;
  module?: 'machining' | 'casting' | 'forging';
  user_id?: string;
  created_at?: string;
}

export interface Operation {
  id: string;
  processName: string;
  parameters: { [key: string]: number };
  toolId?: string;
  toolName?: string;
  estimatedToolLifeHours?: number;
}

export interface Setup {
  id: string;
  name: string;
  operations: Operation[];
  timePerSetupMin: number;
  toolChangeTimeSec: number;
  efficiency: number;
  machineType?: string;
  machineId?: string;
  description?: string;
}

export interface BilletShapeParameters {
  length?: number;
  width?: number;
  height?: number;
  diameter?: number;
  outerDiameter?: number;
  innerDiameter?: number;
  side?: number;
  wallThickness?: number;
  outerWidth?: number;
  outerHeight?: number;
}

export interface SurfaceTreatment {
  id: string;
  name: string;
  cost: number;
  unit: 'per_kg' | 'per_area';
  based_on?: 'raw_weight' | 'finished_weight';
}

export interface Markups {
  general: number;
  admin: number;
  sales: number;
  miscellaneous: number;
  packing: number;
  transport: number;
  profit: number;
  duty: number;
}

export interface MachiningInput {
  id: string;
  original_id?: string;
  calculationNumber: string;
  partNumber: string;
  partName: string; 
  customerName: string;
  revision: string;
  partImage?: string; 
  createdAt: string;
  annualVolume: number; 
  batchVolume: number; 
  unitSystem: 'Metric' | 'Imperial';
  region: string;
  currency: string;
  materialCategory: string;
  materialType: string;
  rawMaterialProcess: 'Billet' | 'Casting' | 'Forging' | '3D Printing' | 'Other';
  billetShape?: 'Block' | 'Cylinder' | 'Tube' | 'Plate' | 'Bar' | 'Rod' | 'Cube' | 'Rectangle Tube';
  billetShapeParameters?: BilletShapeParameters;
  rawMaterialWeightKg: number;
  finishedPartWeightKg: number;
  partSurfaceAreaM2: number;
  materialCostPerKg: number; 
  materialDensityGcm3: number; 
  transportCostPerKg: number;
  heatTreatmentCostPerKg: number;
  surfaceTreatments: SurfaceTreatment[];
  setups: Setup[]; 
  markups: Markups;
}

export interface MarkupCosts {
  general: number;
  admin: number;
  sales: number;
  miscellaneous: number;
  packing: number;
  transport: number;
  profit: number;
  duty: number;
}

export interface SetupBreakdownElement {
  name: string;
  parameters?: string;
  cycleTimeMin: number;
  cost: number;
}

export interface SetupBreakdownItem {
  setupName: string;
  machineName: string;
  elements: SetupBreakdownElement[];
}

export interface MachiningResult {
  rawMaterialWeightKg: number;
  finishedPartWeightKg: number;
  totalMaterialCostPerKg: number;
  rawMaterialPartCost: number;
  materialCost: number; 
  surfaceTreatmentCost: number;
  operationTimeBreakdown: { processName: string; timeMin: number; id: string; machineName?: string }[];
  setupBreakdown?: SetupBreakdownItem[];
  totalCuttingTimeMin: number;
  totalSetupTimeMin: number; 
  totalToolChangeTimeMin: number; 
  cycleTimePerPartMin: number;
  totalMachineTimeHours: number;
  machiningCost: number;
  toolCost: number;
  markupCosts: MarkupCosts;
  totalCost: number;
  costPerPart: number;
}

export interface Calculation {
  id: string;
  name: string;
  inputs: MachiningInput | CastingInput | ForgingInput;
  results?: MachiningResult | CastingResult | ForgingResult;
  status: 'draft' | 'final';
  approval_status?: 'pending' | 'approved' | 'rejected';
  user_id: string;
  created_at: string;
  is_hidden?: boolean;
  duration_seconds?: number;
  parent_id?: string | null;
  revision_number?: number | null;
  calculatorType?: 'machining' | 'casting' | 'forging';
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role?: string;
  enterprise_id?: string;
  companyName: string | null;
  company_logo_url: string | null;
  phone: string | null;
  phone_country_code: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  region: string | null;
  calcNextNumber: number | null;
  calcPrefix: string | null;
  plan_name: string | null; 
  calculation_limit: number; 
  subscription_status: string | null;
  subscription_expires_on: string | null;
  calculations_created_this_period: number;
  company_website: string | null;
  industry: string | null;
  company_size: string | null;
  tax_id: string | null;
  country?: string | null;
  gemini_api_key?: string | null;
  claude_api_key?: string | null;
  openai_api_key?: string | null;
}

export interface LandingPageProps {
  onNavigate: (view: View) => void;
  user: User;
  session: { user: User; access_token: string } | null;
  calculationsCount?: number;
  materialsCount?: number;
  machinesCount?: number;
  processesCount?: number;
  toolsCount?: number;
}

export interface BackupData {
  module: 'machining' | 'casting' | 'forging';
  calculations: Calculation[];
  materials: MaterialMasterItem[];
  machines: Machine[];
  processes: Process[];
  tools: Tool[];
}

export interface SettingsPageProps {
  user: User;
  session: { user: User; access_token: string } | null;
  onUpdateUser: (user: Partial<User>) => void;
  onNavigate: (view: View) => void;
  isSuperAdmin: boolean;
  onExportData: () => BackupData;
  onImportData: (data: BackupData) => void;
}

export interface MaterialsPageProps {
  materials: MaterialMasterItem[];
  user: User;
  onAddMaterial: (material: MaterialMasterItem) => void;
  onUpdateMaterial: (material: MaterialMasterItem) => void;
  onDeleteMaterial: (materialId: string) => void;
  onAddMultipleMaterials: (materials: Omit<MaterialMasterItem, 'id' | 'user_id' | 'created_at'>[]) => void;
  onDeleteMultipleMaterials: (materialIds: string[]) => void;
}

export interface MachineLibraryPageProps {
  machines: Machine[];
  user: User;
  onAddMachine: (machine: Machine) => void;
  onUpdateMachine: (machine: Machine) => void;
  onDeleteMachine: (machineId: string) => void;
  onAddMultipleMachines: (machines: Omit<Machine, 'id' | 'user_id' | 'created_at'>[]) => void;
  onDeleteMultipleMachines: (machineIds: string[]) => void;
}

export interface ProcessLibraryPageProps {
  processes: Process[];
  user: User;
  onAddProcess: (process: Process) => void;
  onUpdateProcess: (process: Process) => void;
  onDeleteProcess: (processId: string) => void;
  onAddMultipleProcesses: (processes: Omit<Process, 'id' | 'user_id' | 'created_at'>[]) => void;
  onDeleteMultipleProcesses: (processIds: string[]) => void;
}

export type CalculatorHeaderInfo = {
  partNumber: string;
  calculationNumber: string;
} | null;

export interface CalculatorPageProps {
  materials: MaterialMasterItem[];
  machines: Machine[];
  processes: Process[];
  tools: Tool[];
  regionCosts: RegionCost[];
  regionCurrencyMap: RegionCurrencyMap[];
  templates: CalculationTemplate[];
  onSave: (calculation: Calculation) => void;
  onSaveDraft: (draft: Calculation) => void;
  onAutoSaveDraft: (draft: Calculation) => void;
  onSaveTemplate: (template: CalculationTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onBack: () => void;
  user: User;
  existingCalculation: Calculation | null;
  theme: 'light' | 'dark';
  onNavigate: (view: View) => void;
  onHeaderInfoChange: (info: CalculatorHeaderInfo) => void;
  onAddTool: (tool: Tool) => void;
  calculations?: Calculation[];
}

export interface DashboardPageProps {
  user: User;
  calculations: Calculation[];
  onNavigate: (view: View) => void;
  onEdit: (calculation: Calculation) => void;
  onDelete: (calculationId: string) => void;
  onViewResults: (calculation: Calculation) => void;
  onUpgrade: () => void;
  isSuperAdmin: boolean;
  theme: 'light' | 'dark';
  activeModule?: 'machining' | 'casting' | 'forging';
}

export interface ResultsPageProps {
  user: User;
  calculation: Calculation | null;
  onBack: () => void;
  materials: MaterialMasterItem[];
}

export interface QuoteModalProps {
  calculation: Calculation;
  user: User;
  onClose: () => void;
  materials: MaterialMasterItem[];
}

export interface SuperAdminPageProps {
    onNavigate: (view: View) => void;
}

export interface SubscriberInfo {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  calculation_count: number;
  subscribed_on: string;
  plan_name: string | null;
  subscription_status: string | null;
  subscription_expires_on: string | null;
}

export interface UserManagementPageProps {
  subscribers: SubscriberInfo[];
  theme: 'light' | 'dark';
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  onSendRecovery: (email: string) => Promise<void>;
  onSendConfirmation: (email: string) => Promise<void>;
}

export interface UserEditModalProps {
  user: SubscriberInfo;
  onSave: (userId: string, updates: Partial<User>) => Promise<void>;
  onClose: () => void;
}

export interface ToolLibraryPageProps {
  tools: Tool[];
  user: User;
  onAddTool: (tool: Tool) => void;
  onUpdateTool: (tool: Tool) => void;
  onDeleteTool: (toolId: string) => void;
  onAddMultipleTools: (tools: Omit<Tool, 'id' | 'user_id' | 'created_at'>[]) => void;
  onDeleteMultipleTools: (toolIds: string[]) => void;
}

export type GeminiSuggestion = {
    name: string;
    category: "P - Steel" | "M - Stainless Steel" | "K - Cast Iron" | "N - Non-ferrous" | "S - Superalloys & Titanium" | "H - Hardened Steel" | "O - Polymers" | "SO - Special Alloys" | "Other";
    subCategory?: string;
    properties: { [key: string]: MaterialProperty };
};

export type GeminiToolSuggestion = Omit<Tool, 'id' | 'user_id' | 'created_at' | 'speedRpm' | 'feedRate' | 'name'>;
export type GeminiProcessSuggestion = Omit<Process, 'id' | 'user_id' | 'created_at'>;
export type GeminiMachineSuggestion = Omit<Machine, 'id' | 'user_id' | 'created_at' | 'name'>;

export interface Feedback {
  id?: string;
  user_id: string;
  user_email: string;
  usage_duration: string;
  usage_experience: string;
  feature_requests: string | null;
  suggested_changes: string | null;
  created_at?: string;
}

export interface FeedbackPageProps {
  user: User;
  onSubmit: (feedbackData: Omit<Feedback, 'id' | 'user_id' | 'user_email' | 'created_at'>) => Promise<void>;
}

export interface FeedbackListPageProps {
  feedbacks: Feedback[];
}

export interface CostMasterPageProps {
  materials: MaterialMasterItem[];
  machines: Machine[];
  tools: Tool[];
  regionCosts: RegionCost[];
  regionCurrencyMap: RegionCurrencyMap[];
  user: User;
  onUpdateMaterial: (material: MaterialMasterItem) => void;
  onUpdateMachine: (machine: Machine) => void;
  onUpdateTool: (tool: Tool) => void;
  onAddRegionCost: (cost: Omit<RegionCost, 'id' | 'created_at' | 'user_id'>) => void;
  onUpdateRegionCost: (cost: Pick<RegionCost, 'id' | 'price' | 'valid_from'>) => void;
  onDeleteRegionCost: (costId: string) => void;
  onAddRegionCurrency: (map: Omit<RegionCurrencyMap, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  onDeleteRegionCurrency: (id: string) => Promise<void>;
}

export interface ChangeItem {
  type: 'new' | 'improvement' | 'fix';
  description: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: ChangeItem[];
}

export interface ChangelogPageProps {}

export interface CalculationTemplate {
  id: string;
  name: string;
  setups: Setup[];
  markups: Markups;
  user_id?: string;
  created_at?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  headerTemplate: string;
  footerTemplate: string;
  bodyTemplate: string; // Maybe HTML string?
  user_id?: string;
  created_at?: string;
}

export type View = 
  | 'auth'
  | 'landing'
  | 'calculations' 
  | 'calculator' 
  | 'castingCalculator'
  | 'forgingCalculator'
  | 'results' 
  | 'materials' 
  | 'machines' 
  | 'processes' 
  | 'settings' 
  | 'superadmin' 
  | 'subscription'
  | 'toolLibrary' 
  | 'subscribersList'
  | 'costMaster'
  | 'feedback'
  | 'feedbackList'
  | 'changelog'
  | 'enterprise'
  | 'enterpriseManagement'
  | 'reports'
  | 'resetPassword'
  | 'oauthConsent'
  | 'plansList';

export interface SubscriptionPlan {
  id: string;
  name: string;
  calculation_limit: number;
  prices: { [currency: string]: { price: number } };
  period: string;
  is_custom_price: boolean;
  features: string[];
  cta: string;
  most_popular: boolean;
  payment_link?: string;
}

export interface DocumentationSection {
  id: string;
  step: number;
  title: string;
  content: string;
  image_url: string | null;
  image_caption: string;
}

export interface DocumentationPageProps {
  content: DocumentationSection[];
  onUpdate: (section: DocumentationSection) => void;
  isSuperAdmin: boolean;
}

export interface CastingInput {
  id: string;
  original_id?: string;
  calculationNumber: string;
  partNumber: string;
  partName: string;
  customerName: string;
  revision: string;
  partImage?: string;
  createdAt: string;
  annualVolume: number;
  batchVolume: number;
  unitSystem: 'Metric' | 'Imperial';
  region: string;
  currency: string;
  
  // Casting Material Info
  materialCategory: string; // e.g., "Ferrous", "Non-Ferrous"
  materialType: string; // e.g. "Grey Cast Iron", "Ductile Iron", "Cast Steel", "Cast Aluminum"
  rawMaterialWeightKg: number; 
  finishedPartWeightKg: number;
  materialCostPerKg: number;
  materialDensityGcm3: number;
  
  // Casting Specific Parameters
  castingProcess: 'Sand Casting' | 'Pressure Die Casting' | 'Investment Casting' | 'Permanent Mold';
  yieldRate: number; // e.g. 60%
  scrapReturnValuePercent: number; // e.g. 50%
  scrapReturnRate: number; // e.g. 95%

  // Tooling & Pattern
  patternCost: number; // Cost of pattern or die ($)
  patternLifeShots: number; // Lifetime of pattern/die
  coresUsed: boolean;
  coreWeightKg: number;
  coreMaterialCostPerKg: number;
  coreBinderCostPerKg: number;
  
  // Casting Process Rates
  meltingCostPerKg: number; // melting energy/overhead cost per kg
  moldingCycleTimeMin: number; // time to make one mold
  moldingHourlyRate: number; // labor/machine rate for molding ($/hr)
  pouringTimeSec: number; // time to pour liquid metal
  pouringHourlyRate: number; // labor rate for pouring ($/hr)
  
  fettlingTimeMin: number; // fettling time per part
  fettlingHourlyRate: number; // fettling hourly labor rate
  
  inspectionCostPerPart: number; // NDT or visual inspection ($)
  heatTreatmentCostPerPart: number; // heat treatment ($/part)
  
  surfaceTreatments: SurfaceTreatment[];
  markups: Markups;
}

export interface CastingResult {
  pouredWeightKg: number;
  scrapWeightKg: number;
  rawMaterialPartCost: number;
  scrapCreditPerPart: number;
  netMaterialCostPerPart: number;
  
  meltingCostPerPart: number;
  moldingCostPerPart: number;
  pouringCostPerPart: number;
  coreCostPerPart: number;
  fettlingCostPerPart: number;
  
  toolingAmortizedCostPerPart: number;
  surfaceTreatmentCost: number;
  
  baseManufacturingCost: number;
  
  markupCosts: MarkupCosts;
  totalCost: number;
  costPerPart: number;
}

export interface ForgingInput {
  id: string;
  original_id?: string;
  calculationNumber: string;
  partNumber: string;
  partName: string;
  customerName: string;
  revision: string;
  partImage?: string;
  createdAt: string;
  annualVolume: number;
  batchVolume: number;
  unitSystem: 'Metric' | 'Imperial';
  region: string;
  currency: string;
  
  // Forging Material Info
  materialCategory: string; // e.g. "Alloy Steel", "Carbon Steel"
  materialType: string; // e.g. "AISI 4140", "AISI 1045", "Aluminum 6061"
  finishedPartWeightKg: number;
  materialCostPerKg: number;
  materialDensityGcm3: number;
  
  // Forging Specific Yield / Parameters
  forgingProcess: 'Closed Die Forging' | 'Open Die Forging' | 'Ring Rolling' | 'Warm/Cold Forging';
  yieldRate: number; // e.g. 75%
  scaleLossPercent: number; // e.g. 3% (matter lost in furnace oxide scale)
  scrapReturnValuePercent: number; // e.g. 30% (flash value returned)
  scrapReturnRate: number; // e.g. 90% (returned flash percentage capture)

  // Tooling & Forging Dies
  dieCost: number; // Die set purchase cost
  dieLifeShots: number; // Total parts produced before wearing out

  // Forging Operational / Cycle Rates
  heatingEnergyCostPerKg: number; // high-temp furnace energy per kg heated
  shearingHourlyRate: number; // labor/equipment rate for billet shearing/cutting
  shearingCycleTimeSec: number; // seconds to cut one billet piece
  forgingCycleTimeSec: number; // cycle time on forging press/hammer
  forgingMachineHourlyRate: number; // high tonnage forging press or hammer line rate ($/hr)
  
  trimmingCycleTimeSec: number; // cycle time to trim flash from forged part
  trimmingHourlyRate: number; // trimmer line labor/overhead rate ($/hr)
  
  inspectionCostPerPart: number; // NDT/quality audit ($/part)
  heatTreatmentCostPerPart: number; // heat treatment ($/part)
  partSurfaceAreaM2: number; // surface area for flat plating or blast descaling
  surfaceTreatments: SurfaceTreatment[];
  markups: Markups;
}

export interface ForgingResult {
  rawBilletWeightKg: number;
  flashScrapWeightKg: number;
  scaleLossWeightKg: number;
  rawMaterialBilletCost: number;
  scrapCreditPerPart: number;
  netMaterialCostPerPart: number;
  
  heatingCostPerPart: number;
  shearingCostPerPart: number;
  forgingPressCostPerPart: number;
  trimmingCostPerPart: number;
  toolingAmortizedCostPerPart: number;
  surfaceTreatmentCost: number;
  
  baseManufacturingCost: number;
  
  markupCosts: MarkupCosts;
  totalCost: number;
  costPerPart: number;
}

