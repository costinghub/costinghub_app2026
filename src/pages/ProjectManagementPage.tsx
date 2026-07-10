import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  FileText, 
  Printer, 
  DollarSign, 
  Settings, 
  Package, 
  Activity, 
  Check, 
  TrendingUp, 
  Percent, 
  Clock, 
  Layers, 
  Box, 
  Building, 
  Users,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { Calculation, Machine, Process, User } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface ProjectMachiningOperation {
  id: string;
  name: string;
  machineId: string;
  machineName: string;
  machineRate: number; // $/hr
  processName: string;
  setupTimeMin: number;
  cycleTimeMin: number;
  toolingCost: number; // total allocated tool cost
  batchSize: number;
}

interface ProjectPart {
  id: string;
  calculationId: string;
  partName: string;
  partNumber: string;
  blankType: 'casting' | 'forging' | 'stamping';
  subModule: string; // e.g. "Sand Casting"
  blankCost: number; // original estimated blank cost
  annualVolume: number;
  machiningOperations: ProjectMachiningOperation[];
  workflowSequence?: string[];
}

interface ProjectMarkups {
  assemblyCostPerUnit: number;
  packagingCostPerUnit: number;
  logisticsCostPerUnit: number;
  sgaMarkupPercent: number;
  profitMarkupPercent: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  customerName: string;
  projectId: string; // formatted ID like PROJ-1001
  createdAt: string;
  updatedAt: string;
  parts: ProjectPart[];
  markups: ProjectMarkups;
  userId: string;
}

interface ProjectManagementPageProps {
  user: User;
  calculations: Calculation[];
  machines: Machine[]; // Machining machines
  processes: Process[]; // Machining processes
  onNavigate: (view: any) => void;
}

export const ProjectManagementPage: React.FC<ProjectManagementPageProps> = ({
  user,
  calculations,
  machines,
  processes,
  onNavigate,
}) => {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  // New Operation Form state
  const [opName, setOpName] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [selectedProcessName, setSelectedProcessName] = useState('');
  const [opSetupTime, setOpSetupTime] = useState(30);
  const [opCycleTime, setOpCycleTime] = useState(2.5);
  const [opTooling, setOpTooling] = useState(0);

  // Notification state
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Load and seed projects on mount
  useEffect(() => {
    const saved = localStorage.getItem('costinghub_projects');
    let loadedProjects: Project[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loadedProjects = parsed.filter((p: Project) => p.userId === user.id);
      } catch (e) {
        console.error('Error loading projects', e);
      }
    }

    if (loadedProjects.length === 0) {
      // Seed two beautiful, complex multimillion-dollar industry projects
      const seeded: Project[] = [
        {
          id: 'seeded-proj-1',
          name: 'Caterpillar C18 Tier 4 Diesel Engine Block Assembly',
          description: 'Consolidated should-cost bill of materials for high-capacity heavy marine propulsion cylinder blocks. Merges high-grade sand casting cylinder structures with multi-stage CNC face milling, deep hole line boring, and block surface finish grinding.',
          customerName: 'Caterpillar Inc. Marine Div.',
          projectId: 'PROJ-9402',
          createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          parts: [
            {
              id: 'seeded-part-1-1',
              calculationId: 'seeded-calc-1-1',
              partName: 'C18 Engine Cylinder Block Lower Housing',
              partNumber: 'CAT-458-9021',
              blankType: 'casting',
              subModule: 'Sand Casting',
              blankCost: 1420.50,
              annualVolume: 1200,
              machiningOperations: [
                {
                  id: 'seeded-op-1-1-1',
                  name: 'Rough Face Milling Lower Deck',
                  machineId: 'vmc3',
                  machineName: 'VMC 5-Axis Heavy CNC Gantry',
                  machineRate: 110.00,
                  processName: 'Face Milling',
                  setupTimeMin: 120,
                  cycleTimeMin: 32.5,
                  toolingCost: 1800,
                  batchSize: 1200
                },
                {
                  id: 'seeded-op-1-1-2',
                  name: 'Precision Deck Line Boring (Cylinders 1-6)',
                  machineId: 'boring-1',
                  machineName: 'Floor-Type Boring Mill',
                  machineRate: 145.00,
                  processName: 'Boring & Reaming',
                  setupTimeMin: 180,
                  cycleTimeMin: 45.0,
                  toolingCost: 3200,
                  batchSize: 1200
                }
              ]
            },
            {
              id: 'seeded-part-1-2',
              calculationId: 'seeded-calc-1-2',
              partName: 'V12 Forged High-Carbon Crankshaft Blank',
              partNumber: 'CAT-311-0082',
              blankType: 'forging',
              subModule: 'Closed Die Forging',
              blankCost: 875.00,
              annualVolume: 1200,
              machiningOperations: [
                {
                  id: 'seeded-op-1-2-1',
                  name: 'Crank Pin Precision Lathe Turning',
                  machineId: 'lathe1',
                  machineName: 'Multi-Spindle Lathe Center',
                  machineRate: 85.00,
                  processName: 'Precision Turning',
                  setupTimeMin: 90,
                  cycleTimeMin: 18.2,
                  toolingCost: 1500,
                  batchSize: 1200
                }
              ]
            }
          ],
          markups: {
            assemblyCostPerUnit: 145.00,
            packagingCostPerUnit: 42.50,
            logisticsCostPerUnit: 185.00,
            sgaMarkupPercent: 8.5,
            profitMarkupPercent: 12.0
          },
          userId: user.id
        },
        {
          id: 'seeded-proj-2',
          name: 'Tesla Model Y Ultra-High-Pressure Megacasting Rear Underbody',
          description: 'Cost rollup audit for 6,000-ton giga press structural aluminum underbodies. Merges HPDC blank estimations with sub-appended multi-spindle drilling patterns and robotized quality verification lines.',
          customerName: 'Tesla Gigafactory Texas',
          projectId: 'PROJ-8810',
          createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          parts: [
            {
              id: 'seeded-part-2-1',
              calculationId: 'seeded-calc-2-1',
              partName: 'Giga Casting Single-Piece Aluminum Rear Underbody',
              partNumber: 'TSL-1090224-00-C',
              blankType: 'casting',
              subModule: 'HPDC',
              blankCost: 340.25,
              annualVolume: 45000,
              machiningOperations: [
                {
                  id: 'seeded-op-2-1-1',
                  name: 'Automated Multi-Spindle CNC Gate Removal',
                  machineId: 'vmc-robo',
                  machineName: 'Robotized CNC Trimming Station',
                  machineRate: 75.00,
                  processName: 'Profile Milling',
                  setupTimeMin: 45,
                  cycleTimeMin: 3.2,
                  toolingCost: 4500,
                  batchSize: 45000
                },
                {
                  id: 'seeded-op-2-1-2',
                  name: 'Suspension Node Mounting Drilling & Tapping',
                  machineId: 'drill-robo',
                  machineName: '32-Spindle CNC Gang Drill',
                  machineRate: 65.00,
                  processName: 'Drilling & Tapping',
                  setupTimeMin: 60,
                  cycleTimeMin: 2.1,
                  toolingCost: 12000,
                  batchSize: 45000
                }
              ]
            }
          ],
          markups: {
            assemblyCostPerUnit: 35.00,
            packagingCostPerUnit: 12.00,
            logisticsCostPerUnit: 48.00,
            sgaMarkupPercent: 4.5,
            profitMarkupPercent: 8.0
          },
          userId: user.id
        }
      ];

      // Save them and update state
      let allProjects: Project[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          allProjects = parsed.filter((p: Project) => p.userId !== user.id);
        } catch (e) {
          allProjects = [];
        }
      }
      const finalProjects = [...allProjects, ...seeded];
      localStorage.setItem('costinghub_projects', JSON.stringify(finalProjects));
      setProjects(seeded);
    } else {
      setProjects(loadedProjects);
    }
  }, [user.id]);

  const showNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const saveProjectsToStorage = (updatedProjects: Project[]) => {
    // Merge with other users' projects if they exist
    let allProjects: Project[] = [];
    const saved = localStorage.getItem('costinghub_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        allProjects = parsed.filter((p: Project) => p.userId !== user.id);
      } catch (e) {
        allProjects = [];
      }
    }
    const finalProjects = [...allProjects, ...updatedProjects];
    localStorage.setItem('costinghub_projects', JSON.stringify(finalProjects));
    setProjects(updatedProjects);
  };

  // Helper: Filter completed casting, forging, stamping calculations
  const eligibleCalculations = calculations.filter(
    (c) => 
      c.results && 
      (c.calculatorType === 'casting' || c.calculatorType === 'forging' || c.calculatorType === 'stamping')
  );

  // Helper: Calculate standard cost metrics for a machining operation
  const calculateOpCost = (op: ProjectMachiningOperation): number => {
    const hourlyRate = op.machineRate;
    const batchSize = op.batchSize || 1000;
    
    // Machine operational cost per part
    const runTimeCost = (op.cycleTimeMin * (hourlyRate / 60));
    const setupCostShared = ((op.setupTimeMin * (hourlyRate / 60)) / batchSize);
    const toolingCostShared = (op.toolingCost / batchSize);

    return runTimeCost + setupCostShared + toolingCostShared;
  };

  // Helper: Calculate total machining cost for a project part
  const getPartMachiningCost = (part: ProjectPart): number => {
    return part.machiningOperations.reduce((sum, op) => {
      // sync batch size with annual volume
      const updatedOp = { ...op, batchSize: part.annualVolume };
      return sum + calculateOpCost(updatedOp);
    }, 0);
  };

  // Helper: Get final finished unit cost for a part
  const getPartFinishedCost = (part: ProjectPart): number => {
    return part.blankCost + getPartMachiningCost(part);
  };

  // Create new project action
  const handleCreateProject = () => {
    const nextNum = projects.length + 1001;
    const newProj: Project = {
      id: crypto.randomUUID(),
      name: 'New Merged Costing Project',
      description: 'Consolidated should-cost analysis with custom secondary finishing operations.',
      customerName: 'Internal',
      projectId: `PROJ-${nextNum}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parts: [],
      markups: {
        assemblyCostPerUnit: 0,
        packagingCostPerUnit: 0,
        logisticsCostPerUnit: 0,
        sgaMarkupPercent: 10,
        profitMarkupPercent: 15,
      },
      userId: user.id,
    };

    const updated = [...projects, newProj];
    saveProjectsToStorage(updated);
    setCurrentProject(newProj);
    setIsEditing(true);
    setSelectedPartId(null);
    showNotification('New project skeleton generated', 'success');
  };

  // Delete project
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      const filtered = projects.filter((p) => p.id !== id);
      saveProjectsToStorage(filtered);
      showNotification('Project deleted', 'info');
    }
  };

  // Save current project state
  const handleSaveProject = () => {
    if (!currentProject) return;

    const updatedProject = {
      ...currentProject,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = projects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
    saveProjectsToStorage(updatedList);
    setIsEditing(false);
    setCurrentProject(null);
    showNotification('Project cost sheet successfully stored!', 'success');
  };

  const handleExportPDF = () => {
    if (!window.html2pdf) {
      alert("PDF export is currently unavailable.");
      return;
    }

    if (!currentProject) return;

    setIsExporting(true);

    setTimeout(() => {
      const element = document.getElementById('project-print-sheet');
      if (!element) {
        setIsExporting(false);
        return;
      }

      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `Consolidation_Sheet_${currentProject.projectId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      window.html2pdf().set(opt).from(element).save().then(() => {
        setIsExporting(false);
      }).catch((err: any) => {
        console.error("PDF Export error:", err);
        setIsExporting(false);
      });
    }, 150);
  };

  // Add Part to Project
  const handleAddPartToProject = (calcId: string) => {
    if (!currentProject) return;

    const calc = calculations.find((c) => c.id === calcId);
    if (!calc || !calc.results) return;

    // Determine sub-module/type
    let subModule = 'Standard';
    if (calc.calculatorType === 'casting') {
      subModule = calc.inputs?.processType || 'Casting Method';
    } else if (calc.calculatorType === 'forging') {
      subModule = calc.inputs?.forgingMethod || 'Forging Method';
    } else if (calc.calculatorType === 'stamping') {
      subModule = calc.inputs?.stampingType || 'Stamping Process';
    }

    // Determine unit blank cost
    const blankCost = calc.results.costPerPart || calc.results.totalCost || 0;

    const newPart: ProjectPart = {
      id: crypto.randomUUID(),
      calculationId: calc.id,
      partName: calc.inputs?.partName || calc.name || 'Unnamed Part',
      partNumber: calc.inputs?.partNumber || 'N/A',
      blankType: calc.calculatorType as any,
      subModule,
      blankCost,
      annualVolume: calc.inputs?.annualVolume || calc.inputs?.volume || 1000,
      machiningOperations: [],
    };

    const updatedParts = [...currentProject.parts, newPart];
    const updatedProj = { ...currentProject, parts: updatedParts };
    setCurrentProject(updatedProj);
    setSelectedPartId(newPart.id);
    showNotification(`Part "${newPart.partName}" added`, 'success');
  };

  // Remove Part from Project
  const handleRemovePartFromProject = (partId: string) => {
    if (!currentProject) return;

    const filtered = currentProject.parts.filter((p) => p.id !== partId);
    setCurrentProject({ ...currentProject, parts: filtered });
    if (selectedPartId === partId) {
      setSelectedPartId(filtered.length > 0 ? filtered[0].id : null);
    }
    showNotification('Part removed from bundle', 'info');
  };

  // Update Part quantity / annual volume
  const handleUpdatePartVolume = (partId: string, volume: number) => {
    if (!currentProject) return;

    const updated = currentProject.parts.map((p) => {
      if (p.id === partId) {
        return { ...p, annualVolume: Math.max(1, volume) };
      }
      return p;
    });

    setCurrentProject({ ...currentProject, parts: updated });
  };

  // Add Machining Operation to Part
  const handleAddMachiningOp = () => {
    if (!currentProject || !selectedPartId) return;

    if (!selectedMachineId) {
      alert('Please select a valid machine.');
      return;
    }

    const machine = machines.find((m) => m.id === selectedMachineId);
    const machineName = machine ? machine.name : 'Custom Machine';
    const machineRate = machine ? machine.hourlyRate : 50;

    const processName = selectedProcessName || 'General Machining';
    const finalOpName = opName.trim() || `${processName} - ${machineName}`;

    const activePart = currentProject.parts.find((p) => p.id === selectedPartId);
    if (!activePart) return;

    const newOp: ProjectMachiningOperation = {
      id: crypto.randomUUID(),
      name: finalOpName,
      machineId: selectedMachineId,
      machineName,
      machineRate,
      processName,
      setupTimeMin: Number(opSetupTime) || 0,
      cycleTimeMin: Number(opCycleTime) || 0,
      toolingCost: Number(opTooling) || 0,
      batchSize: activePart.annualVolume,
    };

    const updatedParts = currentProject.parts.map((p) => {
      if (p.id === selectedPartId) {
        return {
          ...p,
          machiningOperations: [...p.machiningOperations, newOp],
        };
      }
      return p;
    });

    setCurrentProject({ ...currentProject, parts: updatedParts });
    
    // Clear form
    setOpName('');
    setSelectedMachineId('');
    setSelectedProcessName('');
    setOpSetupTime(30);
    setOpCycleTime(2.5);
    setOpTooling(0);

    showNotification('Machining operation appended', 'success');
  };

  // Remove Machining Operation from Part
  const handleRemoveMachiningOp = (opId: string) => {
    if (!currentProject || !selectedPartId) return;

    const updatedParts = currentProject.parts.map((p) => {
      if (p.id === selectedPartId) {
        return {
          ...p,
          machiningOperations: p.machiningOperations.filter((op) => op.id !== opId),
        };
      }
      return p;
    });

    setCurrentProject({ ...currentProject, parts: updatedParts });
    showNotification('Operation removed', 'info');
  };

  // Update Project Markup fields
  const handleUpdateMarkup = (field: keyof ProjectMarkups, val: number) => {
    if (!currentProject) return;

    setCurrentProject({
      ...currentProject,
      markups: {
        ...currentProject.markups,
        [field]: Number(val) || 0,
      },
    });
  };

  // Total Calculations for Entire Project
  const getProjectTotals = () => {
    if (!currentProject) {
      return {
        totalBlanksCost: 0,
        totalMachiningCost: 0,
        sumFinishedPartsCost: 0,
        totalPartsQuantity: 0,
        assemblyMarkup: 0,
        packagingMarkup: 0,
        logisticsMarkup: 0,
        subtotalCost: 0,
        sgaOverhead: 0,
        profitOverhead: 0,
        grandTotalCost: 0,
        averageUnitCost: 0,
      };
    }

    let totalBlanksCost = 0;
    let totalMachiningCost = 0;
    let sumFinishedPartsCost = 0;
    let totalPartsQuantity = 0;

    currentProject.parts.forEach((part) => {
      const blankUnit = part.blankCost;
      const machiningUnit = getPartMachiningCost(part);
      const finishedUnit = blankUnit + machiningUnit;
      const quantity = part.annualVolume;

      totalBlanksCost += blankUnit * quantity;
      totalMachiningCost += machiningUnit * quantity;
      sumFinishedPartsCost += finishedUnit * quantity;
      totalPartsQuantity += quantity;
    });

    // We assume the project produces a single assembled system.
    // If the assembly contains multiple parts, we can assume the batch size of the project 
    // is guided by the maximum quantity of parts or the average. Let's use the average part quantity or 
    // let it be unit-rate driven. Let's assume the project produces assemblies, and the assembly quantity is the quantity of the primary part. 
    // To keep it simple and robust, let's say the total finished parts sum is the baseline.
    // Markups can be calculated as unit rate * total assemblies (using the maximum part quantity as assembly volume, or default 1).
    const maxPartVolume = currentProject.parts.reduce((max, p) => Math.max(max, p.annualVolume), 0) || 1;

    const assemblyMarkup = currentProject.markups.assemblyCostPerUnit * maxPartVolume;
    const packagingMarkup = currentProject.markups.packagingCostPerUnit * maxPartVolume;
    const logisticsMarkup = currentProject.markups.logisticsCostPerUnit * maxPartVolume;

    const subtotalCost = sumFinishedPartsCost + assemblyMarkup + packagingMarkup + logisticsMarkup;
    
    const sgaOverhead = subtotalCost * (currentProject.markups.sgaMarkupPercent / 100);
    const subtotalWithSGA = subtotalCost + sgaOverhead;
    
    const profitOverhead = subtotalWithSGA * (currentProject.markups.profitMarkupPercent / 100);
    const grandTotalCost = subtotalWithSGA + profitOverhead;

    const averageUnitCost = maxPartVolume > 0 ? grandTotalCost / maxPartVolume : 0;

    return {
      totalBlanksCost,
      totalMachiningCost,
      sumFinishedPartsCost,
      totalPartsQuantity: maxPartVolume,
      assemblyMarkup,
      packagingMarkup,
      logisticsMarkup,
      subtotalCost,
      sgaOverhead,
      profitOverhead,
      grandTotalCost,
      averageUnitCost,
    };
  };

  const projectTotals = getProjectTotals();

  // Active Part Reference
  const activePart = currentProject?.parts.find((p) => p.id === selectedPartId);

  // Workflow Sequence Helpers
  const activePartWorkflow = React.useMemo(() => {
    if (!activePart) return [];
    if (activePart.workflowSequence && activePart.workflowSequence.length > 0) {
      return activePart.workflowSequence;
    }
    // Fallback default workflow
    const defaultWorkflow: string[] = [];
    if (activePart.blankType === 'casting') {
      defaultWorkflow.push('Casting');
    } else if (activePart.blankType === 'forging') {
      defaultWorkflow.push('Forging');
    } else if (activePart.blankType === 'stamping') {
      defaultWorkflow.push('Stamping');
    }
    defaultWorkflow.push('Machining');
    return defaultWorkflow;
  }, [activePart]);

  const getPartWorkflowSequence = (part: ProjectPart): string[] => {
    if (part.workflowSequence && part.workflowSequence.length > 0) {
      return part.workflowSequence;
    }
    const defaultWorkflow: string[] = [];
    if (part.blankType === 'casting') {
      defaultWorkflow.push('Casting');
    } else if (part.blankType === 'forging') {
      defaultWorkflow.push('Forging');
    } else if (part.blankType === 'stamping') {
      defaultWorkflow.push('Stamping');
    }
    defaultWorkflow.push('Machining');
    return defaultWorkflow;
  };

  const handleUpdatePartWorkflow = (partId: string, newSequence: string[]) => {
    if (!currentProject) return;
    const updatedParts = currentProject.parts.map((p) => {
      if (p.id === partId) {
        return { ...p, workflowSequence: newSequence };
      }
      return p;
    });
    setCurrentProject({ ...currentProject, parts: updatedParts });
  };

  const [draggedWorkflowIndex, setDraggedWorkflowIndex] = React.useState<number | null>(null);

  const handleWorkflowDragStart = (e: React.DragEvent, index: number) => {
    setDraggedWorkflowIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleWorkflowDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleWorkflowDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedWorkflowIndex === null || draggedWorkflowIndex === targetIndex || !activePart || !currentProject) return;

    const newSequence = [...activePartWorkflow];
    const [draggedItem] = newSequence.splice(draggedWorkflowIndex, 1);
    newSequence.splice(targetIndex, 0, draggedItem);

    handleUpdatePartWorkflow(activePart.id, newSequence);
    setDraggedWorkflowIndex(null);
    showNotification('Workflow sequence updated!', 'info');
  };

  const toggleWorkflowStep = (step: string) => {
    if (!activePart || !currentProject) return;
    let newSequence = [...activePartWorkflow];
    if (newSequence.includes(step)) {
      if (newSequence.length <= 1) {
        showNotification('Must have at least one workflow step!', 'info');
        return;
      }
      newSequence = newSequence.filter((s) => s !== step);
    } else {
      newSequence.push(step);
    }
    handleUpdatePartWorkflow(activePart.id, newSequence);
  };

  // Search Filtered Projects
  const filteredProjects = projects.filter((p) => {
    const s = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.description.toLowerCase().includes(s) ||
      p.customerName.toLowerCase().includes(s) ||
      p.projectId.toLowerCase().includes(s)
    );
  });

  // Recharts Chart Data Preparations
  const getComparisonChartData = () => {
    if (!currentProject) return [];
    return currentProject.parts.map((p) => ({
      name: p.partName.length > 15 ? p.partName.substring(0, 12) + '...' : p.partName,
      'Blank Cost': Number(p.blankCost.toFixed(2)),
      'Machining Cost': Number(getPartMachiningCost(p).toFixed(2)),
      'Total Finished Unit Cost': Number(getPartFinishedCost(p).toFixed(2)),
    }));
  };

  const getPieChartData = () => {
    const totals = projectTotals;
    if (totals.grandTotalCost === 0) return [];
    return [
      { name: 'Blanks Base', value: Number(totals.totalBlanksCost.toFixed(0)), color: '#6366f1' },
      { name: 'Machining Finishing', value: Number(totals.totalMachiningCost.toFixed(0)), color: '#10b981' },
      { name: 'Assembly Operations', value: Number(totals.assemblyMarkup.toFixed(0)), color: '#f59e0b' },
      { name: 'Packaging & Logistics', value: Number((totals.packagingMarkup + totals.logisticsMarkup).toFixed(0)), color: '#3b82f6' },
      { name: 'SG&A & Profit Margins', value: Number((totals.sgaOverhead + totals.profitOverhead).toFixed(0)), color: '#ec4899' },
    ].filter((item) => item.value > 0);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in relative">
      {/* Visual Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border border-border bg-surface text-text-primary flex items-center gap-3 animate-fade-in">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary">Project Management Hub</p>
            <p className="text-[11px] text-text-muted">{notification.text}</p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="border-b border-border/80 pb-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center flex-wrap gap-x-2">
              <span className="text-[#7c3aed] dark:text-[#a855f7]">Project</span>
              <span className="text-black dark:text-white font-black">Management</span>
              <span className="text-text-muted font-normal text-xl mx-1 select-none">|</span>
              <span className="text-text-primary font-bold text-xl uppercase tracking-wider">
                Multi-Part Cost Merging
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-3xl">
              Consolidate casting, forging, and stamping blank estimations. Append secondary machining finishing operations, setup parameters, and markups to resolve fully-finished complex assemblies.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button onClick={handleCreateProject} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Merge Calculations
              </Button>
            ) : (
              <Button onClick={handleSaveProject} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Cost Sheet
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PROJECT DIRECTORY LIST VIEW (Default View) */}
      {!isEditing && (
        <div className="space-y-6 no-print">
          {/* STATS HIGHLIGHT BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-border/60 hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-primary/10">
                <FolderKanban className="w-16 h-16" />
              </div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Merged Projects</p>
              <h2 className="text-3xl font-black text-text-primary mt-2">{projects.length}</h2>
              <p className="text-xs text-text-secondary mt-1">Multi-part consolidated bills</p>
            </Card>

            <Card className="p-5 border-border/60 hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-emerald-500/10">
                <Activity className="w-16 h-16" />
              </div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Active Components</p>
              <h2 className="text-3xl font-black text-emerald-600 mt-2">
                {projects.reduce((sum, p) => sum + p.parts.length, 0)}
              </h2>
              <p className="text-xs text-text-secondary mt-1">Cast, forged & stamped blanks</p>
            </Card>

            <Card className="p-5 border-border/60 hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-blue-500/10">
                <TrendingUp className="w-16 h-16" />
              </div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Secondary Operations</p>
              <h2 className="text-3xl font-black text-blue-600 mt-2">
                {projects.reduce((sum, p) => sum + p.parts.reduce((s, pt) => s + pt.machiningOperations.length, 0), 0)}
              </h2>
              <p className="text-xs text-text-secondary mt-1">Sub-appended machining processes</p>
            </Card>

            <Card className="p-5 border-border/60 hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-amber-500/10">
                <DollarSign className="w-16 h-16" />
              </div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Merged Value</p>
              <h2 className="text-3xl font-black text-amber-600 mt-2">
                ${projects.reduce((sum, p) => {
                  // Get sum total cost
                  let partsSum = 0;
                  p.parts.forEach((part) => {
                    const opsCost = part.machiningOperations.reduce((sumOp, op) => sumOp + calculateOpCost({ ...op, batchSize: part.annualVolume }), 0);
                    partsSum += (part.blankCost + opsCost) * part.annualVolume;
                  });
                  const maxVol = p.parts.reduce((max, pt) => Math.max(max, pt.annualVolume), 0) || 1;
                  const addOn = (p.markups.assemblyCostPerUnit + p.markups.packagingCostPerUnit + p.markups.logisticsCostPerUnit) * maxVol;
                  const subt = partsSum + addOn;
                  const overhead = subt * (1 + p.markups.sgaMarkupPercent / 100) * (1 + p.markups.profitMarkupPercent / 100);
                  return sum + (overhead || 0);
                }, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h2>
              <p className="text-xs text-text-secondary mt-1">Sum value of all finished runs</p>
            </Card>
          </div>

          {/* PROJECT SEARCH AND TABLE */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Consolidated Project Sheets</h3>
                <p className="text-xs text-text-secondary">Review, delete or compile merged bill of materials costing summaries.</p>
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              />
            </div>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-background/50">
                <FolderKanban className="w-12 h-12 text-text-muted mx-auto mb-4 animate-pulse" />
                <h4 className="font-bold text-text-primary text-base">No Merged Projects Found</h4>
                <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                  Consolidate individual blank calculations (cast parts, forged items, sheet stampings) into unified product assemblies. Click "Merge Calculations" to begin.
                </p>
                <button
                  onClick={handleCreateProject}
                  className="mt-4 inline-flex items-center gap-2 bg-[#7c3aed] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-[#6d28d9] transition-all"
                >
                  <Plus className="w-4 h-4" /> Start Merging Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase font-black tracking-widest text-text-muted">
                      <th className="pb-3 pl-4">Project ID</th>
                      <th className="pb-3">Project Details</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3 text-center">Consolidated Parts</th>
                      <th className="pb-3 text-right">Finished Cost / unit</th>
                      <th className="pb-3 text-right">Total Budget</th>
                      <th className="pb-3 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {filteredProjects.map((p) => {
                      // Calculate totals
                      let partsSum = 0;
                      p.parts.forEach((part) => {
                        const opsCost = part.machiningOperations.reduce((sumOp, op) => sumOp + calculateOpCost({ ...op, batchSize: part.annualVolume }), 0);
                        partsSum += (part.blankCost + opsCost) * part.annualVolume;
                      });
                      const maxVol = p.parts.reduce((max, pt) => Math.max(max, pt.annualVolume), 0) || 1;
                      const addOn = (p.markups.assemblyCostPerUnit + p.markups.packagingCostPerUnit + p.markups.logisticsCostPerUnit) * maxVol;
                      const subt = partsSum + addOn;
                      const grand = subt * (1 + p.markups.sgaMarkupPercent / 100) * (1 + p.markups.profitMarkupPercent / 100);
                      const unitAvg = grand / maxVol;

                      return (
                        <tr 
                          key={p.id}
                          onClick={() => {
                            setCurrentProject(p);
                            setIsEditing(true);
                            setSelectedPartId(p.parts.length > 0 ? p.parts[0].id : null);
                          }}
                          className="hover:bg-background/40 cursor-pointer transition-colors group"
                        >
                          <td className="py-4 pl-4 font-mono font-bold text-[#7c3aed]">{p.projectId}</td>
                          <td className="py-4">
                            <p className="font-bold text-text-primary group-hover:text-[#7c3aed] transition-colors">{p.name}</p>
                            <p className="text-xs text-text-secondary truncate max-w-xs">{p.description}</p>
                          </td>
                          <td className="py-4 font-medium text-text-primary">{p.customerName}</td>
                          <td className="py-4 text-center">
                            <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                              {p.parts.length} Blanks
                            </span>
                          </td>
                          <td className="py-4 text-right font-bold text-text-primary">${unitAvg.toFixed(2)}</td>
                          <td className="py-4 text-right font-black text-emerald-600">${grand.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td className="py-4 text-right pr-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentProject(p);
                                  setIsEditing(true);
                                  setSelectedPartId(p.parts.length > 0 ? p.parts[0].id : null);
                                }}
                                className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                title="Edit Project Cost Sheet"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteProject(p.id, e)}
                                className="p-1.5 hover:bg-rose-500/10 text-rose-600 rounded-lg transition-colors"
                                title="Delete Project"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE PROJECT EDITING & CONSOLIDATION WORKSPACE */}
      {isEditing && currentProject && (
        <div className="space-y-6">
          
          {/* GENERAL INFO FORM BAR */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4 no-print text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-[#7c3aed] uppercase tracking-widest">
              <FolderKanban className="w-4.5 h-4.5" />
              <span>Project Blueprint Settings</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-muted uppercase tracking-wider block">Project Code</label>
                <input
                  type="text"
                  value={currentProject.projectId}
                  onChange={(e) => setCurrentProject({ ...currentProject, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black text-text-muted uppercase tracking-wider block">Project Assembly Name</label>
                <input
                  type="text"
                  value={currentProject.name}
                  onChange={(e) => setCurrentProject({ ...currentProject, name: e.target.value })}
                  placeholder="e.g. 4-Cylinder Block Casting & Machining Bundle"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-muted uppercase tracking-wider block">Customer / Stakeholder</label>
                <input
                  type="text"
                  value={currentProject.customerName}
                  onChange={(e) => setCurrentProject({ ...currentProject, customerName: e.target.value })}
                  placeholder="General Motors"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-muted uppercase tracking-wider block">Assembly Scope & Process Narrative</label>
              <textarea
                rows={2}
                value={currentProject.description}
                onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
                placeholder="Consolidate the manufacturing parameters..."
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl text-text-secondary focus:outline-none focus:ring-2 focus:ring-[#7c3aed] resize-none"
              />
            </div>
          </div>

          {/* MAIN 3-COLUMN WORKSPACE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
            
            {/* COLUMN 1: Consolidated Part Selector & Part List (4 cols) */}
            <div className="lg:col-span-4 space-y-6 text-left">
              <Card className="p-5 border-border/80 flex flex-col h-full min-h-[500px]">
                <div className="flex justify-between items-center border-b border-border/60 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                      <Layers className="w-4.5 h-4.5 text-primary" />
                      1. Merge Blanks
                    </h3>
                    <p className="text-[10px] text-text-secondary">Attach completed casting/forged/stamped components.</p>
                  </div>
                </div>

                {/* SELECT ESTIMATION INJECTION FORM */}
                <div className="space-y-3 mb-4">
                  <label className="text-xs font-black text-text-muted uppercase tracking-wider block">Select Calculation Result</label>
                  <div className="flex gap-2">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          handleAddPartToProject(val);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                      defaultValue=""
                    >
                      <option value="" disabled>-- Link completed part --</option>
                      {eligibleCalculations.map((calc) => (
                        <option key={calc.id} value={calc.id}>
                          [{calc.calculatorType?.toUpperCase()}] {calc.inputs?.partName || calc.name} (${(calc.results?.costPerPart || calc.results?.totalCost || 0).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  {eligibleCalculations.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-bold leading-normal">
                      ⚠️ No completed casting, forging, or stamping estimates were found in your workspace history. Complete them first to pull them in here.
                    </p>
                  )}
                </div>

                {/* ACTIVE PARTS LIST */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border pb-1">Merged Parts Bundle</p>
                  {currentProject.parts.length === 0 ? (
                    <div className="text-center py-10 bg-background/55 rounded-xl border border-dashed border-border flex flex-col justify-center items-center">
                      <Box className="w-8 h-8 text-text-muted mb-2 animate-bounce" />
                      <p className="text-[11px] font-medium text-text-muted">No linked components yet.</p>
                      <p className="text-[9px] text-text-secondary mt-1">Add calculations above to initialize costing.</p>
                    </div>
                  ) : (
                    currentProject.parts.map((part) => (
                      <div
                        key={part.id}
                        onClick={() => setSelectedPartId(part.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left relative group ${
                          selectedPartId === part.id
                            ? 'bg-[#7c3aed]/5 border-[#7c3aed]/50 shadow-xs'
                            : 'bg-background hover:bg-surface border-border hover:border-border/80'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePartFromProject(part.id);
                          }}
                          className="absolute top-3 right-3 text-text-muted hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md"
                          title="Remove part"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-1.5 pr-6">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                              part.blankType === 'casting'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                                : part.blankType === 'forging'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                            }`}>
                              {part.blankType}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono truncate">{part.subModule}</span>
                          </div>
                          
                          <h4 className="font-extrabold text-sm text-text-primary leading-tight truncate">
                            {part.partName}
                          </h4>
                          
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40 mt-1">
                            <div>
                              <span className="text-text-muted block text-[10px]">Blank Base</span>
                              <span className="font-bold text-text-primary">${part.blankCost.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-text-muted block text-[10px]">Volume Qty</span>
                              <span className="font-black text-text-primary font-mono">{part.annualVolume}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* COLUMN 2: Machining Operations Management (5 cols) */}
            <div className="lg:col-span-5 text-left">
              <Card className="p-5 border-border/80 h-full min-h-[500px] flex flex-col">
                <div className="border-b border-border/60 pb-3 mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                      <Settings className="w-4.5 h-4.5 text-primary animate-spin-slow" />
                      2. Secondary Machining operations
                    </h3>
                    <p className="text-[10px] text-text-secondary">Attach post-process CNC finishing parameters on the active blank.</p>
                  </div>
                </div>

                {!activePart ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center py-20 bg-background/30 rounded-xl border border-dashed border-border">
                    <Activity className="w-10 h-10 text-text-muted mb-3 animate-pulse" />
                    <h4 className="font-bold text-text-primary text-sm">No Part Selected</h4>
                    <p className="text-xs text-text-secondary mt-1 max-w-xs">
                      Please select one of your merged parts in the Left Panel to configure its specific machining operations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    {/* Active Part Header */}
                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase text-text-muted tracking-wider">Active Consolidation Part</p>
                        <h4 className="font-extrabold text-text-primary text-sm truncate">{activePart.partName}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-text-muted uppercase">Qty:</span>
                        <input
                          type="number"
                          value={activePart.annualVolume}
                          onChange={(e) => handleUpdatePartVolume(activePart.id, Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs bg-background border border-border rounded-lg text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* Visual Workflow Sequencer (Drag & Drop) */}
                    <div className="bg-background border border-border/85 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center border-b border-border/40 pb-2">
                        <div>
                          <p className="text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-[#7c3aed]" />
                            Production Sequence (Drag & Drop)
                          </p>
                          <p className="text-[9px] text-text-secondary">Drag steps horizontally to sequence casting, forging, stamping, and machining steps.</p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            const defaultWorkflow: string[] = [];
                            if (activePart.blankType === 'casting') {
                              defaultWorkflow.push('Casting');
                            } else if (activePart.blankType === 'forging') {
                              defaultWorkflow.push('Forging');
                            } else if (activePart.blankType === 'stamping') {
                              defaultWorkflow.push('Stamping');
                            }
                            defaultWorkflow.push('Machining');
                            handleUpdatePartWorkflow(activePart.id, defaultWorkflow);
                          }}
                          className="text-[9px] h-6 px-2 border-border font-bold bg-background hover:bg-surface text-text-muted hover:text-text-primary"
                        >
                          Reset Sequence
                        </Button>
                      </div>

                      {/* Horizontal Drag-and-Drop Sequence List */}
                      <div className="flex flex-wrap items-center gap-1.5 py-1">
                        {activePartWorkflow.map((step, idx) => {
                          let stepStyles = 'bg-indigo-50/70 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400';
                          if (step === 'Forging') {
                            stepStyles = 'bg-rose-50/70 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400';
                          } else if (step === 'Stamping') {
                            stepStyles = 'bg-purple-50/70 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-900/60 dark:text-purple-400';
                          } else if (step === 'Machining') {
                            stepStyles = 'bg-emerald-50/70 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-400';
                          }

                          const isDragged = draggedWorkflowIndex === idx;

                          return (
                            <React.Fragment key={step + '-' + idx}>
                              {idx > 0 && (
                                <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                              )}
                              <div
                                draggable
                                onDragStart={(e) => handleWorkflowDragStart(e, idx)}
                                onDragOver={(e) => handleWorkflowDragOver(e, idx)}
                                onDrop={(e) => handleWorkflowDrop(e, idx)}
                                onDragEnd={() => setDraggedWorkflowIndex(null)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all select-none cursor-grab active:cursor-grabbing ${stepStyles} ${
                                  isDragged ? 'opacity-30 border-dashed border-[#7c3aed] scale-95' : 'hover:shadow-xs hover:border-[#7c3aed]/40'
                                }`}
                                title="Drag to reorder"
                              >
                                <span className="text-text-muted text-[10px] select-none">⋮⋮</span>
                                <span className="bg-background/90 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-mono border border-border font-black">
                                  {idx + 1}
                                </span>
                                <span>{step}</span>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Quick Add / Remove Buttons */}
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[9px] font-black uppercase text-text-muted tracking-wider">Include steps in routing:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {['Casting', 'Forging', 'Stamping', 'Machining'].map((step) => {
                            const isIncluded = activePartWorkflow.includes(step);
                            return (
                              <button
                                key={step}
                                type="button"
                                onClick={() => toggleWorkflowStep(step)}
                                className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition-all flex items-center gap-1 ${
                                  isIncluded
                                    ? 'bg-[#7c3aed]/10 border-[#7c3aed]/30 text-[#7c3aed]'
                                    : 'bg-surface border-border text-text-muted hover:text-text-primary hover:border-border/80'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isIncluded ? 'bg-[#7c3aed]' : 'bg-text-muted'}`} />
                                {step}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Appended Operations */}
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] pr-1 my-3">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border pb-1">Appended Processes</p>
                      {activePart.machiningOperations.length === 0 ? (
                        <div className="text-center py-10 bg-background/50 rounded-xl border border-dashed border-border">
                          <p className="text-[11px] font-bold text-text-muted">No Machining Appended</p>
                          <p className="text-[10px] text-text-secondary mt-0.5">Part is estimated as a pure raw blank. Add finishing operations below.</p>
                        </div>
                      ) : (
                        activePart.machiningOperations.map((op) => {
                          const opCost = calculateOpCost({ ...op, batchSize: activePart.annualVolume });
                          return (
                            <div key={op.id} className="p-3 bg-background border border-border/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                              <div className="min-w-0">
                                <p className="font-bold text-text-primary truncate">{op.name}</p>
                                <p className="text-[10px] text-text-secondary font-mono mt-0.5">
                                  {op.machineName} • Rate: ${op.machineRate}/hr • Cycle: {op.cycleTimeMin} min
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-[9px] text-text-secondary block font-bold">Add cost / part</span>
                                  <span className="font-black text-emerald-600">+${opCost.toFixed(3)}</span>
                                </div>
                                <button
                                  onClick={() => handleRemoveMachiningOp(op.id)}
                                  className="p-1 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                                  title="Delete operation"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add Operation Form */}
                    <div className="bg-background border border-border rounded-xl p-4 space-y-3">
                      <p className="text-[10px] font-black text-text-primary uppercase tracking-widest border-b border-border pb-1">Append Finishing Operation</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-muted uppercase block">Finishing Process</label>
                          <select
                            value={selectedProcessName}
                            onChange={(e) => {
                              setSelectedProcessName(e.target.value);
                              // Auto populate operation name
                              if (!opName) {
                                setOpName(`${e.target.value} Processing`);
                              }
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none"
                          >
                            <option value="">-- Custom Process --</option>
                            {processes.map((p) => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                            {/* Fallbacks */}
                            <option value="Face Milling">Face Milling</option>
                            <option value="Profile Milling">Profile Milling</option>
                            <option value="Drilling & Tapping">Drilling & Tapping</option>
                            <option value="Boring & Reaming">Boring & Reaming</option>
                            <option value="Precision Turning">Precision Turning</option>
                            <option value="Surface Grinding">Surface Grinding</option>
                            <option value="Cylindrical Grinding">Cylindrical Grinding</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-muted uppercase block">CNC Machinery</label>
                          <select
                            value={selectedMachineId}
                            onChange={(e) => setSelectedMachineId(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none font-medium"
                          >
                            <option value="">-- Select Machine Rate --</option>
                            {machines.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} (${m.hourlyRate}/hr)
                              </option>
                            ))}
                            {/* Simple defaults if empty */}
                            <option value="vmc3">VMC 3-Axis CNC ($65/hr)</option>
                            <option value="lathe1">CNC Lathe Turning Center ($55/hr)</option>
                            <option value="drill1">Radial Drilling Machine ($40/hr)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-text-muted uppercase block flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#7c3aed]" /> Cycle Time (m)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={opCycleTime}
                            onChange={(e) => setOpCycleTime(Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-lg text-center font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-text-muted uppercase block">Setup Time (m)</label>
                          <input
                            type="number"
                            value={opSetupTime}
                            onChange={(e) => setOpSetupTime(Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-lg text-center font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-text-muted uppercase block">Special Tooling ($)</label>
                          <input
                            type="number"
                            value={opTooling}
                            onChange={(e) => setOpTooling(Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-lg text-center font-bold text-emerald-600"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddMachiningOp}
                        className="w-full bg-[#7c3aed] text-white py-1.5 rounded-lg text-xs font-bold hover:bg-[#6d28d9] transition-colors flex items-center justify-center gap-1"
                      >
                        <PlusCircle className="w-4 h-4" /> Append finishing Operation
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* COLUMN 3: Cost Realization Summary & Visualizations (3 cols) */}
            <div className="lg:col-span-3 text-left">
              <Card className="p-5 border-border/80 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-border/60 pb-3">
                    <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                      <DollarSign className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
                      3. Consolidated Cost
                    </h3>
                    <p className="text-[10px] text-text-secondary">Summary of realized product roll-up.</p>
                  </div>

                  {/* MINI METRICS */}
                  <div className="bg-background border border-border p-3.5 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-text-secondary">
                      <span>Linked Blanks run:</span>
                      <span className="font-bold text-text-primary font-mono">${projectTotals.totalBlanksCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-text-secondary">
                      <span>Value-add machining:</span>
                      <span className="font-bold text-text-primary font-mono">${projectTotals.totalMachiningCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-text-primary font-bold border-t border-border/50 pt-2">
                      <span>Subtotal Cost:</span>
                      <span className="font-black text-text-primary font-mono">${projectTotals.sumFinishedPartsCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* ASSEMBLY AND PROJECT LEVEL MARKUPS */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border pb-1">Assembly Markups</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-text-secondary font-medium">Assembly / Join cost ($/unit):</span>
                        <input
                          type="number"
                          step="0.1"
                          value={currentProject.markups.assemblyCostPerUnit}
                          onChange={(e) => handleUpdateMarkup('assemblyCostPerUnit', Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-background border border-border rounded-lg text-center font-bold text-text-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-text-secondary font-medium">Packaging & Prep ($/unit):</span>
                        <input
                          type="number"
                          step="0.1"
                          value={currentProject.markups.packagingCostPerUnit}
                          onChange={(e) => handleUpdateMarkup('packagingCostPerUnit', Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-background border border-border rounded-lg text-center font-bold text-text-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-text-secondary font-medium">Shipping & Logistics ($/unit):</span>
                        <input
                          type="number"
                          step="0.1"
                          value={currentProject.markups.logisticsCostPerUnit}
                          onChange={(e) => handleUpdateMarkup('logisticsCostPerUnit', Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-background border border-border rounded-lg text-center font-bold text-text-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs border-t border-border/40 pt-2">
                        <span className="text-text-secondary font-medium flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5 text-primary" /> SG&A Markup (%):
                        </span>
                        <input
                          type="number"
                          value={currentProject.markups.sgaMarkupPercent}
                          onChange={(e) => handleUpdateMarkup('sgaMarkupPercent', Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-background border border-border rounded-lg text-center font-bold text-text-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-text-secondary font-medium flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Target Profit (%):
                        </span>
                        <input
                          type="number"
                          value={currentProject.markups.profitMarkupPercent}
                          onChange={(e) => handleUpdateMarkup('profitMarkupPercent', Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-background border border-border rounded-lg text-center font-bold text-text-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* GRAND TOTAL BIG BOARD */}
                <div className="mt-6 pt-4 border-t border-border bg-emerald-500/5 -mx-5 px-5 pb-1 rounded-b-2xl">
                  <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest block">Consolidated Selling Price</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      ${projectTotals.averageUnitCost.toFixed(2)}<span className="text-[10px] font-bold text-text-muted"> / finished unit</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary mt-1 font-mono">
                    <span>Total Project Value:</span>
                    <span className="font-bold">${projectTotals.grandTotalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* VISUAL CHARTS ROW */}
          {currentProject.parts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 no-print">
              <div className="md:col-span-8">
                <Card className="p-5 border-border/80 text-left">
                  <h3 className="font-extrabold text-text-primary text-sm mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> Cost Comparison per Component (Unit Cost)
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getComparisonChartData()} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <RechartsTooltip />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="Blank Cost" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Machining Cost" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <div className="md:col-span-4">
                <Card className="p-5 border-border/80 text-left">
                  <h3 className="font-extrabold text-text-primary text-sm mb-4 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-500" /> Total Project Budget Weighting
                  </h3>
                  <div className="h-64 w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {getPieChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => `$${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase">Grand total</span>
                      <span className="text-base font-black text-text-primary font-mono">
                        ${(projectTotals.grandTotalCost / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 mt-2 text-[10px] text-text-secondary font-medium">
                    {getPieChartData().map((entry, index) => (
                      <div key={index} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span>{entry.name}</span>
                        </div>
                        <span className="font-mono font-bold">${entry.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* PRINT-READY SUMMARY COST SHEET BILL OF MATERIALS (BOM) */}
          <div id="project-print-sheet" className="bg-surface border border-border rounded-2xl p-8 shadow-sm space-y-6 text-left print-only block">
            <div className="flex justify-between items-start border-b border-border pb-5">
              <div>
                <h1 className="text-3xl font-black text-text-primary tracking-tight">CostingHub Consolidation Sheet</h1>
                <p className="text-xs font-mono text-[#7c3aed] mt-1 uppercase tracking-widest font-black">
                  Multi-Part Production Bill of Materials (BOM) & Machining Finishing Audit
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 text-xs font-medium">
                  <div>
                    <span className="text-text-muted uppercase text-[9px] tracking-wider block font-bold">Project Ref Code</span>
                    <span className="text-text-primary font-bold font-mono text-sm">{currentProject.projectId}</span>
                  </div>
                  <div>
                    <span className="text-text-muted uppercase text-[9px] tracking-wider block font-bold">Client / Customer</span>
                    <span className="text-text-primary font-bold text-sm">{currentProject.customerName}</span>
                  </div>
                  <div>
                    <span className="text-text-muted uppercase text-[9px] tracking-wider block font-bold">Created On</span>
                    <span className="text-text-primary font-semibold">{new Date(currentProject.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-text-muted uppercase text-[9px] tracking-wider block font-bold">Compiled By</span>
                    <span className="text-text-primary font-semibold">{user.name || user.email}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-text-muted uppercase text-[10px] font-bold tracking-wider block">Estimated System Selling Price</span>
                <span className="text-3xl font-black text-emerald-600 font-mono block mt-1">
                  ${projectTotals.averageUnitCost.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-text-muted uppercase block">USD per assembled unit</span>
                <div className="mt-4 inline-block bg-primary/5 border border-primary/15 rounded-xl px-4 py-2 text-left">
                  <span className="text-text-muted uppercase text-[9px] tracking-wider block font-bold">Active assembly Volume</span>
                  <span className="text-text-primary font-black font-mono text-base">{projectTotals.totalPartsQuantity} units</span>
                </div>
              </div>
            </div>

            {/* Part Breakdown Table */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-text-primary uppercase tracking-widest border-b border-border pb-1">Merged Parts & Operations Breakdown</h3>
              
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 uppercase font-black text-[9px] text-text-muted">
                    <th className="py-2">Component Name</th>
                    <th className="py-2">Process Module</th>
                    <th className="py-2 text-right">Annual Run Qty</th>
                    <th className="py-2 text-right">Blank Base Cost</th>
                    <th className="py-2 text-right">Machining Cost Add</th>
                    <th className="py-2 text-right">Total Unit Cost</th>
                    <th className="py-2 text-right">Extended Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentProject.parts.map((p) => {
                    const machCost = getPartMachiningCost(p);
                    const finishedCost = p.blankCost + machCost;
                    const extended = finishedCost * p.annualVolume;
                    return (
                      <React.Fragment key={p.id}>
                        <tr className="font-bold bg-background/30 text-text-primary">
                          <td className="py-3 pl-1">
                            <span className="text-text-primary">{p.partName}</span>
                            <span className="text-[9px] text-text-muted block font-mono font-normal">Part No: {p.partNumber}</span>
                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              {getPartWorkflowSequence(p).map((step, idx) => (
                                <React.Fragment key={idx}>
                                  {idx > 0 && <span className="text-[8px] text-text-muted">→</span>}
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold ${
                                    step === 'Casting' ? 'bg-indigo-50/70 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400' :
                                    step === 'Forging' ? 'bg-rose-50/70 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400' :
                                    step === 'Stamping' ? 'bg-purple-50/70 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-900/60 dark:text-purple-400' :
                                    'bg-emerald-50/70 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-400'
                                  }`}>
                                    {step}
                                  </span>
                                </React.Fragment>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 capitalize text-text-primary">
                            {p.blankType} • <span className="font-mono text-[10px] text-text-muted">{p.subModule}</span>
                          </td>
                          <td className="py-3 text-right font-mono font-bold">{p.annualVolume}</td>
                          <td className="py-3 text-right font-mono">${p.blankCost.toFixed(2)}</td>
                          <td className="py-3 text-right font-mono text-emerald-600">+${machCost.toFixed(2)}</td>
                          <td className="py-3 text-right font-mono font-black text-[#7c3aed]">${finishedCost.toFixed(2)}</td>
                          <td className="py-3 text-right font-mono font-black">${extended.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        </tr>
                        {p.machiningOperations.length > 0 && (
                          <tr>
                            <td colSpan={7} className="py-2 bg-background/10 border-b border-border/20">
                              <div className="pl-6 space-y-1 text-[10px] text-text-secondary">
                                <p className="font-bold uppercase tracking-wider text-text-muted text-[8px] mb-1">Sub-appended Machining Finishing Details:</p>
                                {p.machiningOperations.map((op, idx) => {
                                  const opC = calculateOpCost({ ...op, batchSize: p.annualVolume });
                                  return (
                                    <div key={op.id} className="flex justify-between max-w-4xl font-mono text-[10px]">
                                      <span>Op {idx + 1}: {op.name} ({op.machineName} @ ${op.machineRate}/hr, Setup: {op.setupTimeMin} min, Cycle: {op.cycleTimeMin} min)</span>
                                      <span className="font-bold text-emerald-600">+${opC.toFixed(3)} per unit</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Budget Summary section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border">
              <div className="space-y-2 text-xs text-text-secondary">
                <p className="font-black uppercase tracking-widest text-[10px] text-text-primary">Project Scope Notes</p>
                <p className="text-xs leading-relaxed italic">{currentProject.description || 'No specific consolidation notes defined.'}</p>
                <div className="pt-4 space-y-1.5 text-[10px]">
                  <p className="font-bold uppercase tracking-wider text-[8px] text-text-muted">Standard Calculation Rules:</p>
                  <p>1. Secondary machining calculations account for amortized machine setup times over the specified batch size.</p>
                  <p>2. Tooling allocations are fully shared across the annual volume parameters.</p>
                  <p>3. SGA and Profit markups are compounded on total consolidated manufacturing costs.</p>
                </div>
              </div>

              <div className="bg-background border border-border p-5 rounded-2xl space-y-3 text-sm text-left">
                <p className="font-black uppercase tracking-widest text-[10px] text-text-primary border-b border-border pb-1">Assembly cost sheet summary</p>
                
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-text-secondary">
                    <span>Sum of Raw Blanks:</span>
                    <span className="font-bold text-text-primary">${projectTotals.totalBlanksCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Sum of Machining Finishing:</span>
                    <span className="font-bold text-text-primary">${projectTotals.totalMachiningCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Assembly & Labor markup:</span>
                    <span className="font-bold text-text-primary">${projectTotals.assemblyMarkup.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Packaging & Logistics Prep:</span>
                    <span className="font-bold text-text-primary">${(projectTotals.packagingMarkup + projectTotals.logisticsMarkup).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-text-primary font-bold border-t border-border/50 pt-2">
                    <span>Total Manufactured Subtotal:</span>
                    <span className="font-black text-text-primary">${projectTotals.subtotalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>SG&A Corporate Markup ({currentProject.markups.sgaMarkupPercent}%):</span>
                    <span className="font-bold text-text-primary">${projectTotals.sgaOverhead.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Calculated Margin Target ({currentProject.markups.profitMarkupPercent}%):</span>
                    <span className="font-bold text-text-primary">${projectTotals.profitOverhead.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[#7c3aed] font-black border-t border-border pt-2 text-sm">
                    <span>GRAND TOTAL SELLING BUDGET:</span>
                    <span className="text-emerald-600">${projectTotals.grandTotalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-12 text-center text-[10px] text-text-muted border-t border-border/40 font-mono uppercase tracking-wider">
              Securely Consolidated via CostingHub Enterprise Engine • Confidentially Protected Document
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-xl no-print">
            <Button
              onClick={() => {
                setIsEditing(false);
                setCurrentProject(null);
              }}
              variant="secondary"
              className="text-text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Project Directory
            </Button>

             <div className="flex gap-3">
               <Button
                 onClick={() => window.print()}
                 className="border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-bold"
               >
                 <Printer className="w-4 h-4 mr-2" />
                 Print Cost Sheet
               </Button>
 
               <Button
                 onClick={handleExportPDF}
                 disabled={isExporting}
                 className="border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold"
               >
                 {isExporting ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Saving PDF...
                   </>
                 ) : (
                   <>
                     <FileText className="w-4 h-4 mr-2" />
                     Export PDF
                   </>
                 )}
               </Button>
 
               <Button onClick={handleSaveProject} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                <Save className="w-4 h-4 mr-2" />
                Save Consolidation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
