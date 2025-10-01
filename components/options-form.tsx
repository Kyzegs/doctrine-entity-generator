'use client';

import { GenerationOptions, ColumnFieldMapping, CustomDataType, Relationship, CustomTrait } from '@/lib/types';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TraitManagement } from './trait-management';
import { RelationshipManagement } from './relationship-management';

interface OptionsFormProps {
  options: GenerationOptions;
  onChange: (options: GenerationOptions) => void;
}

export function OptionsForm({ options, onChange }: OptionsFormProps) {
  // Initialize all traits as collapsed by default

  
  const [draggedTraitId, setDraggedTraitId] = useState<string | null>(null);
  
  const handleInputChange = (field: keyof GenerationOptions, value: string | boolean | ColumnFieldMapping[] | CustomDataType[] | Relationship[] | string[] | CustomTrait[]) => {
    onChange({
      ...options,
      [field]: value,
    });
    

  };
  

  
  const handleDragStart = (e: React.DragEvent, traitId: string) => {
    setDraggedTraitId(traitId);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, targetTraitId: string) => {
    e.preventDefault();
    
    if (!draggedTraitId || draggedTraitId === targetTraitId) {
      return;
    }
    
    const traits = [...(options.customTraits || [])];
    const draggedIndex = traits.findIndex(t => t.id === draggedTraitId);
    const targetIndex = traits.findIndex(t => t.id === targetTraitId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedTrait] = traits.splice(draggedIndex, 1);
      traits.splice(targetIndex, 0, draggedTrait);
      
      handleInputChange('customTraits', traits);
    }
    
    setDraggedTraitId(null);
  };
  
  const handleDragEnd = () => {
    setDraggedTraitId(null);
  };

  return (
    <div className="space-y-6 p-4 border border-border rounded-lg bg-card">
      {/* Basic Settings */}
      <div>
        <h4 className="font-medium text-card-foreground mb-3">Basic Settings</h4>
        <div className="space-y-3">
          <div>
            <Label htmlFor="entityName" className="block text-sm font-medium mb-1">
              Entity Name Override
            </Label>
            <Input
              type="text"
              id="entityName"
              value={options.entityName}
              onChange={(e) => handleInputChange('entityName', e.target.value)}
              placeholder="Leave empty to auto-generate from table name"
            />
          </div>
          <div>
            <Label htmlFor="namespace" className="block text-sm font-medium mb-1">
              PHP Namespace
            </Label>
            <Input
              type="text"
              id="namespace"
              value={options.namespace}
              onChange={(e) => handleInputChange('namespace', e.target.value)}
              placeholder="e.g. App\Entity"
            />
          </div>
          
          <div>
            <Label htmlFor="databaseDialect" className="block text-sm font-medium mb-1">
              Database Dialect
            </Label>
            <Select
              value={options.databaseDialect}
              onValueChange={(value) => handleInputChange('databaseDialect', value as any)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select database dialect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
                <SelectItem value="mariadb">MariaDB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="entityPrefix" className="block text-sm font-medium mb-1">
              Entity Prefix
            </Label>
            <Input
              type="text"
              id="entityPrefix"
              value={options.entityPrefix}
              onChange={(e) => handleInputChange('entityPrefix', e.target.value)}
              className="w-full"
              placeholder=""
            />
          </div>
          
          <div>
            <Label htmlFor="entitySuffix" className="block text-sm font-medium mb-1">
              Entity Suffix
            </Label>
            <Input
              type="text"
              id="entitySuffix"
              value={options.entitySuffix}
              onChange={(e) => handleInputChange('entitySuffix', e.target.value)}
              className="w-full"
              placeholder=""
            />
          </div>
        </div>
      </div>

      {/* ORM Mapping Settings */}
      <div className="border-t border-border pt-4">
        <h4 className="font-medium text-card-foreground mb-3">ORM Mapping Settings</h4>
        <div className="space-y-3">
          <div>
            <div className="flex items-center">
              <Checkbox
                id="explicitlyDefineColumns"
                checked={options.explicitlyDefineColumns}
                onCheckedChange={(checked) => handleInputChange('explicitlyDefineColumns', checked)}
              />
              <Label htmlFor="explicitlyDefineColumns" className="ml-2 text-sm">
                Explicitly define column mappings
              </Label>
            </div>
          </div>
          
          <div>
            <div className="flex items-center">
              <Checkbox
                id="useAttributeMapping"
                checked={options.useAttributeMapping}
                onCheckedChange={(checked) => handleInputChange('useAttributeMapping', checked)}
              />
              <Label htmlFor="useAttributeMapping" className="ml-2 text-sm">
                Use Doctrine attributes (PHP 8+) instead of XML mapping
              </Label>
            </div>
          </div>
          
          {/* Column-Field Mappings */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Column-Field Mappings</label>
            <div className="space-y-2">
              {options.columnFieldMappings.map((mapping, index) => (
                <div key={`mapping-${index}`} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                  <Input
                    type="text"
                    value={mapping.field}
                    onChange={(e) => {
                      const newMappings = [...options.columnFieldMappings];
                      newMappings[index].field = e.target.value;
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    placeholder="Field name (e.g., uniqueKey)"
                    className="text-sm min-w-0"
                  />
                  <Input
                    type="text"
                    value={mapping.column || ''}
                    onChange={(e) => {
                      const newMappings = [...options.columnFieldMappings];
                      newMappings[index].column = e.target.value || undefined;
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    placeholder="Column name (optional)"
                    className="text-sm min-w-0"
                  />
                  <Select
                    value={mapping.selectedType || "default"}
                    onValueChange={(value) => {
                      const newMappings = [...options.columnFieldMappings];
                      newMappings[index].selectedType = value === "default" ? "" : value;
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                  >
                    <SelectTrigger className="text-sm w-full min-w-[200px]">
                      <SelectValue placeholder="string" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="integer">integer</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                      <SelectItem value="datetime">datetime</SelectItem>
                      <SelectItem value="date">date</SelectItem>
                      <SelectItem value="time">time</SelectItem>
                      <SelectItem value="decimal">decimal</SelectItem>
                      <SelectItem value="float">float</SelectItem>
                      <SelectItem value="json">json</SelectItem>
                      <SelectItem value="text">text</SelectItem>
                      {options.customDataTypes
                        .filter((dataType) => dataType.name.trim() !== '')
                        .map((dataType) => (
                          <SelectItem key={dataType.name} value={dataType.name}>
                            {dataType.name} ({dataType.phpType})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    value={mapping.enumClass || ''}
                    onChange={(e) => {
                      const newMappings = [...options.columnFieldMappings];
                      newMappings[index].enumClass = e.target.value || undefined;
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    placeholder="Enum class (optional)"
                    className="text-sm min-w-0"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const newMappings = options.columnFieldMappings.filter((_, i) => i !== index);
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-md transition-colors flex-shrink-0"
                    title="Remove mapping"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={() => {
                  const newMapping: ColumnFieldMapping = {
                    field: '',
                    column: '',
                    selectedType: ''
                  };
                  const newMappings = [...options.columnFieldMappings, newMapping];
                  handleInputChange('columnFieldMappings', newMappings);
                }}
                size="sm"
              >
                Add Mapping
              </Button>
            </div>
          </div>
          
          {/* Custom Data Types */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Custom Data Types</label>
            <div className="space-y-2">
              {options.customDataTypes.map((dataType, index) => (
                <div key={`datatype-${index}`} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <Input
                    type="text"
                    value={dataType.name}
                    onChange={(e) => {
                      const newDataTypes = [...options.customDataTypes];
                      newDataTypes[index].name = e.target.value;
                      handleInputChange('customDataTypes', newDataTypes);
                    }}
                    placeholder="Type name (e.g., money)"
                    className="text-sm min-w-0"
                  />
                  <Input
                    type="text"
                    value={dataType.phpType}
                    onChange={(e) => {
                      const newDataTypes = [...options.customDataTypes];
                      newDataTypes[index].phpType = e.target.value;
                      handleInputChange('customDataTypes', newDataTypes);
                    }}
                    placeholder="PHP type (e.g., int)"
                    className="text-sm min-w-0"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const newDataTypes = options.customDataTypes.filter((_, i) => i !== index);
                      handleInputChange('customDataTypes', newDataTypes);
                    }}
                    className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-md transition-colors flex-shrink-0"
                    title="Remove data type"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={() => {
                  const newDataType: CustomDataType = {
                    name: '',
                    phpType: ''
                  };
                  const newDataTypes = [...options.customDataTypes, newDataType];
                  handleInputChange('customDataTypes', newDataTypes);
                }}
                size="sm"
              >
                Add Custom Data Type
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PHP Entity Class Settings */}
      <div className="border-t border-border pt-4">
        <h4 className="font-medium text-card-foreground mb-3">PHP Entity Class Settings</h4>
        <div className="space-y-3">
          <div>
            <div className="flex items-center">
              <Checkbox
                id="publicProperties"
                checked={options.publicProperties}
                onCheckedChange={(checked) => handleInputChange('publicProperties', checked)}
              />
              <Label htmlFor="publicProperties" className="ml-2 text-sm">
                Public properties
              </Label>
            </div>
          </div>
          
          <div>
            <div className="flex items-center">
              <Checkbox
                id="generateGetters"
                checked={options.generateGetters}
                onCheckedChange={(checked) => handleInputChange('generateGetters', checked)}
              />
              <Label htmlFor="generateGetters" className="ml-2 text-sm">
                Generate getters
              </Label>
            </div>
          </div>
          
          <div>
            <div className="flex items-center">
              <Checkbox
                id="generateSetters"
                checked={options.generateSetters}
                onCheckedChange={(checked) => handleInputChange('generateSetters', checked)}
              />
              <Label htmlFor="generateSetters" className="ml-2 text-sm">
                Generate setters
              </Label>
            </div>
          </div>
          
          <div>
            <div className="flex items-center">
              <Checkbox
                id="generateFluentSetters"
                checked={options.generateFluentSetters}
                onCheckedChange={(checked) => handleInputChange('generateFluentSetters', checked)}
                disabled={!options.generateSetters}
              />
              <Label htmlFor="generateFluentSetters" className="ml-2 text-sm">
                Fluent setters (return $this)
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Relationships Management */}
      <RelationshipManagement
        options={options}
        onOptionsChange={(newOptions) => onChange(newOptions)}
      />

      {/* Custom Traits Management */}
      <TraitManagement
        options={options}
        onOptionsChange={(newOptions) => onChange(newOptions)}
        draggedTraitId={draggedTraitId}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
}
