'use client';

import { GenerationOptions, ColumnFieldMapping, CustomDataType, Relationship, CustomTrait } from '@/lib/types';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
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
    <div className="space-y-6 p-4 border border-gray-200 rounded-lg bg-white">
      {/* Basic Settings */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Basic Settings</h4>
        <div className="space-y-3">
          <div>
            <label htmlFor="entityName" className="block text-sm font-medium text-gray-700 mb-1">
              Entity Name Override
            </label>
            <input
              type="text"
              id="entityName"
              value={options.entityName}
              onChange={(e) => handleInputChange('entityName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Leave empty to auto-generate from table name"
            />
          </div>
          <div>
            <label htmlFor="namespace" className="block text-sm font-medium text-gray-700 mb-1">
              PHP Namespace
            </label>
            <input
              type="text"
              id="namespace"
              value={options.namespace}
              onChange={(e) => handleInputChange('namespace', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="e.g. App\Entity"
            />
          </div>
          
          <div>
            <label htmlFor="databaseDialect" className="block text-sm font-medium text-gray-700 mb-1">
              Database Dialect
            </label>
            <select
              id="databaseDialect"
              value={options.databaseDialect}
              onChange={(e) => handleInputChange('databaseDialect', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="sqlite">SQLite</option>
              <option value="mariadb">MariaDB</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="entityPrefix" className="block text-sm font-medium text-gray-700 mb-1">
              Entity Prefix
            </label>
            <input
              type="text"
              id="entityPrefix"
              value={options.entityPrefix}
              onChange={(e) => handleInputChange('entityPrefix', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder=""
            />
          </div>
          
          <div>
            <label htmlFor="entitySuffix" className="block text-sm font-medium text-gray-700 mb-1">
              Entity Suffix
            </label>
            <input
              type="text"
              id="entitySuffix"
              value={options.entitySuffix}
              onChange={(e) => handleInputChange('entitySuffix', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder=""
            />
          </div>
        </div>
      </div>

      {/* ORM Mapping Settings */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">ORM Mapping Settings</h4>
        <div className="space-y-3">
          <div>
            <label htmlFor="explicitlyDefineColumns" className="flex items-center">
              <input
                type="checkbox"
                id="explicitlyDefineColumns"
                checked={options.explicitlyDefineColumns}
                onChange={(e) => handleInputChange('explicitlyDefineColumns', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Explicitly define column mappings</span>
            </label>
          </div>
          
          <div>
            <label htmlFor="useAttributeMapping" className="flex items-center">
              <input
                type="checkbox"
                id="useAttributeMapping"
                checked={options.useAttributeMapping}
                onChange={(e) => handleInputChange('useAttributeMapping', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Use Doctrine attributes (PHP 8+) instead of XML mapping</span>
            </label>
          </div>
          
          {/* Column-Field Mappings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Column-Field Mappings</label>
            <div className="space-y-2">
              {options.columnFieldMappings.map((mapping, index) => (
                <div key={`mapping-${index}`} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                  <input
                    type="text"
                    value={mapping.field}
                    onChange={(e) => {
                      const newMappings = [...options.columnFieldMappings];
                      newMappings[index].field = e.target.value;
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    placeholder="Field name (e.g., uniqueKey)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
                  />
                  <input
                    type="text"
                    value={mapping.column || ''}
                    onChange={(e) => {
                      const newMappings = [...options.columnFieldMappings];
                      newMappings[index].column = e.target.value || undefined;
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    placeholder="Column name (optional)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
                  />
                  <select
                    value={mapping.selectedType}
                    onChange={(e) => {
                      const newMappings = [...options.columnFieldMappings];
                      newMappings[index].selectedType = e.target.value;
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
                  >
                    <option value="">Default</option>
                    <option value="string">string</option>
                    <option value="integer">integer</option>
                    <option value="boolean">boolean</option>
                    <option value="datetime">datetime</option>
                    <option value="date">date</option>
                    <option value="time">time</option>
                    <option value="decimal">decimal</option>
                    <option value="float">float</option>
                    <option value="json">json</option>
                    <option value="text">text</option>
                    {options.customDataTypes.map((dataType) => (
                      <option key={dataType.name} value={dataType.name}>
                        {dataType.name} ({dataType.phpType})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={mapping.enumClass || ''}
                    onChange={(e) => {
                      const newMappings = [...options.columnFieldMappings];
                      newMappings[index].enumClass = e.target.value || undefined;
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    placeholder="Enum class (optional)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newMappings = options.columnFieldMappings.filter((_, i) => i !== index);
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                    title="Remove mapping"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newMapping: ColumnFieldMapping = {
                    field: '',
                    selectedType: ''
                  };
                  const newMappings = [...options.columnFieldMappings, newMapping];
                  handleInputChange('columnFieldMappings', newMappings);
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Add Mapping
              </button>
            </div>
          </div>
          
          {/* Custom Data Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Data Types</label>
            <div className="space-y-2">
              {options.customDataTypes.map((dataType, index) => (
                <div key={`datatype-${index}`} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input
                    type="text"
                    value={dataType.name}
                    onChange={(e) => {
                      const newDataTypes = [...options.customDataTypes];
                      newDataTypes[index].name = e.target.value;
                      handleInputChange('customDataTypes', newDataTypes);
                    }}
                    placeholder="Type name (e.g., money)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
                  />
                  <input
                    type="text"
                    value={dataType.phpType}
                    onChange={(e) => {
                      const newDataTypes = [...options.customDataTypes];
                      newDataTypes[index].phpType = e.target.value;
                      handleInputChange('customDataTypes', newDataTypes);
                    }}
                    placeholder="PHP type (e.g., int)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newDataTypes = options.customDataTypes.filter((_, i) => i !== index);
                      handleInputChange('customDataTypes', newDataTypes);
                    }}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                    title="Remove data type"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newDataType: CustomDataType = {
                    name: '',
                    phpType: ''
                  };
                  const newDataTypes = [...options.customDataTypes, newDataType];
                  handleInputChange('customDataTypes', newDataTypes);
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Add Custom Data Type
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PHP Entity Class Settings */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">PHP Entity Class Settings</h4>
        <div className="space-y-3">
          <div>
            <label htmlFor="publicProperties" className="flex items-center">
              <input
                type="checkbox"
                id="publicProperties"
                checked={options.publicProperties}
                onChange={(e) => handleInputChange('publicProperties', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Public properties</span>
            </label>
          </div>
          
          <div>
            <label htmlFor="generateGetters" className="flex items-center">
              <input
                type="checkbox"
                id="generateGetters"
                checked={options.generateGetters}
                onChange={(e) => handleInputChange('generateGetters', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Generate getters</span>
            </label>
          </div>
          
          <div>
            <label htmlFor="generateSetters" className="flex items-center">
              <input
                type="checkbox"
                id="generateSetters"
                checked={options.generateSetters}
                onChange={(e) => handleInputChange('generateSetters', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Generate setters</span>
            </label>
          </div>
          
          <div>
            <label htmlFor="generateFluentSetters" className="flex items-center">
              <input
                type="checkbox"
                id="generateFluentSetters"
                checked={options.generateFluentSetters}
                onChange={(e) => handleInputChange('generateFluentSetters', e.target.checked)}
                disabled={!options.generateSetters}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Fluent setters (return $this)</span>
            </label>
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
