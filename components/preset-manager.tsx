'use client';

import { useState } from 'react';
import { Preset, GenerationOptions } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Save, FolderOpen, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface PresetManagerProps {
  currentOptions: GenerationOptions;
  onLoadPreset: (options: GenerationOptions) => void;
}

export function PresetManager({ currentOptions, onLoadPreset }: PresetManagerProps) {
  const [presets, setPresets] = useState<Preset[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('entityGeneratorPresets');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');

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
    const presetIndex = presets.findIndex(p => p.id === presetId);
    if (presetIndex === -1) return;

    const updatedPresets = [...presets];
    updatedPresets[presetIndex] = {
      ...updatedPresets[presetIndex],
      options: { ...currentOptions },
      updatedAt: new Date().toISOString()
    };

    savePresetsToStorage(updatedPresets);
    toast.success(`Preset "${updatedPresets[presetIndex].name}" updated`);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Load Preset Dropdown */}
      {presets.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              Load Preset
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {presets.map((preset, index) => (
              <div key={preset.id}>
                <DropdownMenuItem
                  className="flex items-start justify-between cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex-1" onClick={() => handleLoadPreset(preset)}>
                    <div className="font-medium">{preset.name}</div>
                    {preset.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {preset.description}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Updated: {new Date(preset.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdatePreset(preset.id);
                      }}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      title="Update with current settings"
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
                      className="h-6 w-6 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      title="Delete preset"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
                {index < presets.length - 1 && <DropdownMenuSeparator />}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Create Preset Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save as Preset
          </Button>
        </DialogTrigger>
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
    </div>
  );
}

