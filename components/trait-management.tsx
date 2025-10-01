'use client';

import { CustomTrait, GenerationOptions } from '@/lib/types';
import { CollapsibleSection } from './ui/collapsible-section';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TraitManagementProps {
  options: GenerationOptions;
  onOptionsChange: (options: GenerationOptions) => void;
  draggedTraitId: string | null;
  onDragStart: (e: React.DragEvent, traitId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetTraitId: string) => void;
  onDragEnd: () => void;
}

export function TraitManagement({ 
  options, 
  onOptionsChange,
  draggedTraitId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: TraitManagementProps) {

  const handleAddTrait = () => {
    const newTrait: CustomTrait = {
      id: `trait-${Date.now()}`,
      name: '',
      displayName: '',
      description: '',
      namespace: '',
      properties: [],
      requiredInterfaces: []
    };
    const newTraits = [...(options.customTraits || []), newTrait];
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  const handleRemoveTrait = (traitIndex: number) => {
    const newTraits = (options.customTraits || []).filter((_, i) => i !== traitIndex);
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  const handleTraitChange = (traitIndex: number, field: keyof CustomTrait, value: any) => {
    const newTraits = [...(options.customTraits || [])];
    newTraits[traitIndex] = { ...newTraits[traitIndex], [field]: value };
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  const handlePropertyChange = (traitIndex: number, propIndex: number, field: string, value: any) => {
    const newTraits = [...(options.customTraits || [])];
    newTraits[traitIndex].properties[propIndex] = { 
      ...newTraits[traitIndex].properties[propIndex], 
      [field]: value 
    };
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  const handleAddProperty = (traitIndex: number) => {
    const newTraits = [...(options.customTraits || [])];
    newTraits[traitIndex].properties.push({
      name: '',
      type: 'string',
      visibility: 'private',
      nullable: false,
      description: '',
      hasGetter: true,
      hasSetter: true
    });
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  const handleRemoveProperty = (traitIndex: number, propIndex: number) => {
    const newTraits = [...(options.customTraits || [])];
    newTraits[traitIndex].properties.splice(propIndex, 1);
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  const handleAddInterface = (traitIndex: number) => {
    const newTraits = [...(options.customTraits || [])];
    newTraits[traitIndex].requiredInterfaces.push('');
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  const handleInterfaceChange = (traitIndex: number, interfaceIndex: number, value: string) => {
    const newTraits = [...(options.customTraits || [])];
    newTraits[traitIndex].requiredInterfaces[interfaceIndex] = value;
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  const handleRemoveInterface = (traitIndex: number, interfaceIndex: number) => {
    const newTraits = [...(options.customTraits || [])];
    newTraits[traitIndex].requiredInterfaces.splice(interfaceIndex, 1);
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  return (
    <div className="border-t border-border pt-6">
      <div className="mb-6">
        <h4 className="font-medium text-foreground mb-2">Custom Traits Management</h4>
        <p className="text-sm text-muted-foreground">
          Create and manage custom traits for your entities. Each trait can have properties with getter/setter toggles and required interfaces.
        </p>
      </div>
      
      {/* Add New Trait Button */}
      <Button
        type="button"
        onClick={handleAddTrait}
        className="mb-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
      >
        Add New Trait
      </Button>
      
      {/* Traits List */}
      <div className="space-y-6">
        {(options.customTraits || []).map((trait, traitIndex) => (
          <div key={trait.id}>
            {/* Drop zone before each trait */}
            <div
              className={`min-h-2 transition-all duration-200 ${
                draggedTraitId && draggedTraitId !== trait.id 
                  ? 'bg-accent border-2 border-dashed border-accent-foreground/20 rounded mb-2' 
                  : ''
              }`}
              onDragOver={onDragOver}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedTraitId) {
                  const traits = [...(options.customTraits || [])];
                  const draggedIndex = traits.findIndex(t => t.id === draggedTraitId);
                  if (draggedIndex !== -1) {
                    const [draggedTrait] = traits.splice(draggedIndex, 1);
                    traits.splice(traitIndex, 0, draggedTrait);
                    onOptionsChange({ ...options, customTraits: traits });
                  }
                  onDragEnd();
                }
              }}
            />
            
            {/* Trait item */}
            <CollapsibleSection
              key={trait.id}
              id={trait.id}
              title={trait.name || `Trait ${traitIndex + 1}`}
              subtitle={trait.description}
              onRemove={() => handleRemoveTrait(traitIndex)}
              showDragHandle={true}
              showOrderNumber={false}
              onDragStart={(e) => onDragStart(e, trait.id)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, trait.id)}
              onDragEnd={onDragEnd}
              isDragged={draggedTraitId === trait.id}
              headerToggle={
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`use-trait-${trait.id}`}
                    checked={options.selectedTraits?.includes(trait.id) || false}
                    onCheckedChange={(checked) => {
                      const currentTraits = options.selectedTraits || [];
                      let newTraits: string[];
                      
                      if (checked) {
                        newTraits = [...currentTraits, trait.id];
                      } else {
                        newTraits = currentTraits.filter(t => t !== trait.id);
                      }
                      
                      onOptionsChange({ ...options, selectedTraits: newTraits });
                    }}
                  />
                  <Label htmlFor={`use-trait-${trait.id}`} className="text-sm">
                    Use trait
                  </Label>
                </div>
              }
            >
              {/* Trait Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                <Input
                  type="text"
                  value={trait.name}
                  onChange={(e) => handleTraitChange(traitIndex, 'name', e.target.value)}
                  placeholder="Trait name (e.g., TimestampableTrait)"
                  className="text-sm"
                />
                <Input
                  type="text"
                  value={trait.displayName}
                  onChange={(e) => handleTraitChange(traitIndex, 'displayName', e.target.value)}
                  placeholder="Display name (e.g., Timestampable)"
                  className="text-sm"
                />
                <Input
                  type="text"
                  value={trait.namespace}
                  onChange={(e) => handleTraitChange(traitIndex, 'namespace', e.target.value)}
                  placeholder="Namespace (e.g., App\\Traits)"
                  className="text-sm"
                />
                <Input
                  type="text"
                  value={trait.description}
                  onChange={(e) => handleTraitChange(traitIndex, 'description', e.target.value)}
                  placeholder="Description"
                  className="text-sm"
                />
              </div>
              

              
              {/* Properties Management */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h6 className="font-medium text-foreground">Properties</h6>
                  <Button
                    type="button"
                    onClick={() => handleAddProperty(traitIndex)}
                    variant="outline"
                    size="sm"
                  >
                    Add Property
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {trait.properties.map((property, propIndex) => (
                    <div key={`property-${trait.id}-${propIndex}`} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto_auto_auto_auto_auto] gap-3 p-3 border border-border rounded-lg bg-card items-center">
                      <Input
                        type="text"
                        value={property.name}
                        onChange={(e) => handlePropertyChange(traitIndex, propIndex, 'name', e.target.value)}
                        placeholder="Property name"
                        className="text-xs min-w-0"
                      />
                      <Input
                        type="text"
                        value={property.type}
                        onChange={(e) => handlePropertyChange(traitIndex, propIndex, 'type', e.target.value)}
                        placeholder="Type"
                        className="text-xs min-w-0"
                      />
                      <Select
                        value={property.visibility}
                        onValueChange={(value) => handlePropertyChange(traitIndex, propIndex, 'visibility', value)}
                      >
                        <SelectTrigger className="text-xs w-full min-w-[120px]">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">private</SelectItem>
                          <SelectItem value="protected">protected</SelectItem>
                          <SelectItem value="public">public</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center">
                        <Checkbox
                          checked={property.nullable}
                          onCheckedChange={(checked) => handlePropertyChange(traitIndex, propIndex, 'nullable', checked)}
                        />
                        <span className="ml-1 text-xs text-muted-foreground">nullable</span>
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          checked={property.hasGetter ?? true}
                          onCheckedChange={(checked) => handlePropertyChange(traitIndex, propIndex, 'hasGetter', checked)}
                        />
                        <span className="ml-1 text-xs text-muted-foreground">getter</span>
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          checked={property.hasSetter ?? true}
                          onCheckedChange={(checked) => handlePropertyChange(traitIndex, propIndex, 'hasSetter', checked)}
                        />
                        <span className="ml-1 text-xs text-muted-foreground">setter</span>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleRemoveProperty(traitIndex, propIndex)}
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Remove property"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Required Interfaces Management */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h6 className="font-medium text-foreground">Required Interfaces</h6>
                  <Button
                    type="button"
                    onClick={() => handleAddInterface(traitIndex)}
                    variant="outline"
                    size="sm"
                  >
                    Add Interface
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {trait.requiredInterfaces.map((interfaceName, interfaceIndex) => (
                    <div key={`interface-${trait.id}-${interfaceIndex}`} className="flex items-center space-x-3 p-3 border border-border rounded-lg bg-card">
                      <Input
                        type="text"
                        value={interfaceName}
                        onChange={(e) => handleInterfaceChange(traitIndex, interfaceIndex, e.target.value)}
                        placeholder="Interface name (e.g., TimestampableInterface)"
                        className="flex-1 text-xs"
                      />
                      <Button
                        type="button"
                        onClick={() => handleRemoveInterface(traitIndex, interfaceIndex)}
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Remove interface"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
          </div>
        ))}
        
        {/* Final drop zone at the end */}
        <div
          className={`min-h-2 transition-all duration-200 ${
            draggedTraitId ? 'bg-accent border-2 border-dashed border-accent-foreground/20 rounded' : ''
          }`}
          onDragOver={onDragOver}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedTraitId) {
              const traits = [...(options.customTraits || [])];
              const draggedIndex = traits.findIndex(t => t.id === draggedTraitId);
              if (draggedIndex !== -1) {
                const [draggedTrait] = traits.splice(draggedIndex, 1);
                traits.push(draggedTrait);
                onOptionsChange({ ...options, customTraits: traits });
              }
              onDragEnd();
            }
          }}
        />
      </div>
    </div>
  );
}
