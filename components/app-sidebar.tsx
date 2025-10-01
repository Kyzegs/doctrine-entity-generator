'use client';

import * as React from "react";
import {
  Save,
  FolderOpen,
  Download,
  Upload,
  Settings2,
  ChevronDown,
  FileText,
  Clipboard,
  Trash2,
  Code2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Preset, GenerationOptions, ShareableConfiguration } from "@/lib/types";
import { useVersion } from "@/hooks/use-version";
import { toast } from "sonner";

interface AppSidebarProps {
  currentOptions: GenerationOptions;
  onLoadPreset: (options: GenerationOptions) => void;
  onExportToFile: () => void;
  onExportToClipboard: () => void;
  onImportFromFile: () => void;
  onImportFromClipboard: () => void;
}

export function AppSidebar({
  currentOptions,
  onLoadPreset,
  onExportToFile,
  onExportToClipboard,
  onImportFromFile,
  onImportFromClipboard,
}: AppSidebarProps) {
  const { displayVersion } = useVersion();
  const [presets, setPresets] = React.useState<Preset[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('entityGeneratorPresets');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
  const [presetToUpdate, setPresetToUpdate] = React.useState<string | null>(null);
  const [newPresetName, setNewPresetName] = React.useState('');
  const [newPresetDescription, setNewPresetDescription] = React.useState('');

  const savePresetsToStorage = (updatedPresets: Preset[]) => {
    localStorage.setItem('entityGeneratorPresets', JSON.stringify(updatedPresets));
    setPresets(updatedPresets);
  };

  const handleCreatePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const newPreset: Preset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      options: { ...currentOptions }
    };

    const updatedPresets = [...presets, newPreset];
    savePresetsToStorage(updatedPresets);

    toast.success(`Preset "${newPresetName}" created successfully`);
    setNewPresetName('');
    setNewPresetDescription('');
    setIsCreateDialogOpen(false);
  };

  const handleLoadPreset = (preset: Preset) => {
    onLoadPreset(preset.options);
    toast.success(`Preset "${preset.name}" loaded`);
  };

  const handleDeletePreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    const updatedPresets = presets.filter(p => p.id !== presetId);
    savePresetsToStorage(updatedPresets);

    if (preset) {
      toast.success(`Preset "${preset.name}" deleted`);
    }
  };

  const handleUpdatePreset = (presetId: string) => {
    setPresetToUpdate(presetId);
    setIsConfirmDialogOpen(true);
  };

  const confirmUpdatePreset = () => {
    if (!presetToUpdate) return;

    const presetIndex = presets.findIndex(p => p.id === presetToUpdate);
    if (presetIndex === -1) return;

    // Save the old preset for undo
    const oldPreset = { ...presets[presetIndex] };
    const presetName = oldPreset.name;

    const updatedPresets = [...presets];
    updatedPresets[presetIndex] = {
      ...updatedPresets[presetIndex],
      options: { ...currentOptions },
      updatedAt: new Date().toISOString()
    };

    savePresetsToStorage(updatedPresets);
    
    // Show toast with undo action
    toast.success(`Preset "${presetName}" updated`, {
      action: {
        label: 'Undo',
        onClick: () => {
          // Restore the old preset
          const revertPresets = [...presets];
          const currentIndex = revertPresets.findIndex(p => p.id === presetToUpdate);
          if (currentIndex !== -1) {
            revertPresets[currentIndex] = oldPreset;
            savePresetsToStorage(revertPresets);
            toast.success(`Reverted "${presetName}" to previous version`);
          }
        }
      }
    });

    setIsConfirmDialogOpen(false);
    setPresetToUpdate(null);
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-4">
            <Code2 className="h-6 w-6" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm">Entity Generator</span>
              <span className="text-xs text-sidebar-foreground/70">Doctrine ORM</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Presets Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Presets</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setIsCreateDialogOpen(true)}>
                    <Save className="h-4 w-4" />
                    <span>Save as Preset</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {presets.length > 0 && (
                  <Collapsible defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <FolderOpen className="h-4 w-4" />
                          <span>My Presets</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {presets.map((preset) => (
                            <SidebarMenuSubItem key={preset.id} className="group/preset">
                              <div className="flex flex-col w-full">
                                <SidebarMenuSubButton
                                  onClick={() => handleLoadPreset(preset)}
                                  className="flex-col items-start h-auto py-2"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-medium truncate">{preset.name}</span>
                                    <div className="flex items-center gap-0.5 ml-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdatePreset(preset.id);
                                        }}
                                        className="h-6 w-6 opacity-0 group-hover/preset:opacity-100 transition-opacity"
                                        title="Update preset"
                                      >
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeletePreset(preset.id);
                                        }}
                                        className="h-6 w-6 text-destructive hover:text-destructive/80 hover:bg-destructive/10 opacity-0 group-hover/preset:opacity-100 transition-opacity"
                                        title="Delete preset"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  {preset.description && (
                                    <span className="text-xs text-sidebar-foreground/70 line-clamp-1 w-full">
                                      {preset.description}
                                    </span>
                                  )}
                                  <span className="text-xs text-sidebar-foreground/50 mt-0.5">
                                    {new Date(preset.updatedAt).toLocaleDateString()}
                                  </span>
                                </SidebarMenuSubButton>
                              </div>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Import/Export Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Configuration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton onClick={onExportToFile}>
                            <FileText className="h-4 w-4" />
                            <span>Export to File</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton onClick={onExportToClipboard}>
                            <Clipboard className="h-4 w-4" />
                            <span>Export to Clipboard</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                <Collapsible className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Upload className="h-4 w-4" />
                        <span>Import</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton onClick={onImportFromFile}>
                            <FileText className="h-4 w-4" />
                            <span>Import from File</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton onClick={onImportFromClipboard}>
                            <Clipboard className="h-4 w-4" />
                            <span>Import from Clipboard</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-2 text-xs text-sidebar-foreground/70">
            <Settings2 className="h-3 w-3" />
            <span>{displayVersion}</span>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Create Preset Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Preset</DialogTitle>
            <DialogDescription>
              Save your current settings as a preset to quickly switch between different configurations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name *</Label>
              <Input
                id="preset-name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g., MySQL with Attributes"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreatePreset();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-description">Description (optional)</Label>
              <Textarea
                id="preset-description"
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
                placeholder="Brief description of this preset..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePreset}>
              Create Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Update Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Overwrite</DialogTitle>
            <DialogDescription>
              Are you sure you want to overwrite this preset with your current settings? 
              This action can be undone using the undo button in the notification.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsConfirmDialogOpen(false);
              setPresetToUpdate(null);
            }}>
              Cancel
            </Button>
            <Button onClick={confirmUpdatePreset}>
              Overwrite Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

