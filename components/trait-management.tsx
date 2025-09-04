'use client';

import { CustomTrait, GenerationOptions } from '@/lib/types';
import { CollapsibleSection } from './ui/collapsible-section';
import { Trash2 } from 'lucide-react';

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
      methods: [],
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

  const handleMethodChange = (traitIndex: number, methodIndex: number, field: string, value: any) => {
    const newTraits = [...(options.customTraits || [])];
    newTraits[traitIndex].methods[methodIndex] = { 
      ...newTraits[traitIndex].methods[methodIndex], 
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
      description: ''
    });
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  const handleAddMethod = (traitIndex: number) => {
    const newTraits = [...(options.customTraits || [])];
    newTraits[traitIndex].methods.push({
      name: '',
      returnType: 'void',
      parameters: [],
      visibility: 'public',
      description: ''
    });
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  const handleRemoveProperty = (traitIndex: number, propIndex: number) => {
    const newTraits = [...(options.customTraits || [])];
    newTraits[traitIndex].properties.splice(propIndex, 1);
    onOptionsChange({ ...options, customTraits: newTraits });
  };

  const handleRemoveMethod = (traitIndex: number, methodIndex: number) => {
    const newTraits = [...(options.customTraits || [])];
    newTraits[traitIndex].methods.splice(methodIndex, 1);
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
    <div className="border-t border-gray-200 pt-4">
      <h4 className="font-medium text-gray-900 mb-3">Custom Traits Management</h4>
      <p className="text-sm text-gray-600 mb-3">
        Create and manage custom traits for your entities. Each trait can have properties, methods, and required interfaces.
      </p>
      
      {/* Add New Trait Button */}
      <button
        type="button"
        onClick={handleAddTrait}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
      >
        Add New Trait
      </button>
      
      {/* Traits List */}
      <div className="space-y-4">
        {/* Drop zones between traits */}
        {(options.customTraits || []).map((trait, traitIndex) => (
          <div
            key={`drop-zone-${traitIndex}`}
            className={`min-h-2 transition-all duration-200 ${
              draggedTraitId && draggedTraitId !== trait.id 
                ? 'bg-blue-100 border-2 border-dashed border-blue-300 rounded' 
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
        ))}
        
        {(options.customTraits || []).map((trait, traitIndex) => (
          <div 
            key={trait.id} 
            className={`border border-gray-200 rounded-lg ${
              draggedTraitId === trait.id ? 'opacity-50' : ''
            }`}
            draggable
            onDragStart={(e) => onDragStart(e, trait.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, trait.id)}
            onDragEnd={onDragEnd}
          >
            <CollapsibleSection
              key={trait.id}
              id={trait.id}
              title={trait.name || `Trait ${traitIndex + 1}`}
              subtitle={trait.description}
              onRemove={() => handleRemoveTrait(traitIndex)}
              showDragHandle={true}
              showOrderNumber={true}
              orderNumber={traitIndex + 1}
              headerToggle={
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`use-trait-${trait.id}`}
                    checked={options.selectedTraits?.includes(trait.name) || false}
                    onChange={(e) => {
                      const currentTraits = options.selectedTraits || [];
                      let newTraits: string[];
                      
                      if (e.target.checked) {
                        newTraits = [...currentTraits, trait.name];
                      } else {
                        newTraits = currentTraits.filter(t => t !== trait.name);
                      }
                      
                      onOptionsChange({ ...options, selectedTraits: newTraits });
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={!trait.name}
                  />
                  <label htmlFor={`use-trait-${trait.id}`} className="text-sm text-gray-700">
                    Use trait
                  </label>
                </div>
              }
            >
              {/* Trait Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                <input
                  type="text"
                  value={trait.name}
                  onChange={(e) => handleTraitChange(traitIndex, 'name', e.target.value)}
                  placeholder="Trait name (e.g., TimestampableTrait)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
                />
                <input
                  type="text"
                  value={trait.displayName}
                  onChange={(e) => handleTraitChange(traitIndex, 'displayName', e.target.value)}
                  placeholder="Display name (e.g., Timestampable)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
                />
                <input
                  type="text"
                  value={trait.namespace}
                  onChange={(e) => handleTraitChange(traitIndex, 'namespace', e.target.value)}
                  placeholder="Namespace (e.g., App\\Traits)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
                />
                <input
                  type="text"
                  value={trait.description}
                  onChange={(e) => handleTraitChange(traitIndex, 'description', e.target.value)}
                  placeholder="Description"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
                />
              </div>
              

              
              {/* Properties Management */}
              <div className="mb-4">
                <h6 className="font-medium text-gray-700 mb-2">Properties</h6>
                <button
                  type="button"
                  onClick={() => handleAddProperty(traitIndex)}
                  className="mb-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Add Property
                </button>
                
                <div className="space-y-2">
                  {trait.properties.map((property, propIndex) => (
                    <div key={propIndex} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 p-2 border border-gray-200 rounded items-center">
                      <input
                        type="text"
                        value={property.name}
                        onChange={(e) => handlePropertyChange(traitIndex, propIndex, 'name', e.target.value)}
                        placeholder="Property name"
                        className="px-2 py-1 border border-gray-300 rounded text-xs text-black min-w-0"
                      />
                      <input
                        type="text"
                        value={property.type}
                        onChange={(e) => handlePropertyChange(traitIndex, propIndex, 'type', e.target.value)}
                        placeholder="Type"
                        className="px-2 py-1 border border-gray-300 rounded text-xs text-black min-w-0"
                      />
                      <select
                        value={property.visibility}
                        onChange={(e) => handlePropertyChange(traitIndex, propIndex, 'visibility', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs text-black min-w-0"
                      >
                        <option value="private">private</option>
                        <option value="protected">protected</option>
                        <option value="public">public</option>
                      </select>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={property.nullable}
                          onChange={(e) => handlePropertyChange(traitIndex, propIndex, 'nullable', e.target.checked)}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-1 text-xs text-gray-600">nullable</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProperty(traitIndex, propIndex)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        title="Remove property"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Methods Management */}
              <div className="mb-4">
                <h6 className="font-medium text-gray-700 mb-2">Methods</h6>
                <button
                  type="button"
                  onClick={() => handleAddMethod(traitIndex)}
                  className="mb-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Add Method
                </button>
                
                <div className="space-y-2">
                  {trait.methods.map((method, methodIndex) => (
                    <div key={methodIndex} className="border border-gray-200 rounded p-2">
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto_auto] gap-2 mb-2 items-center">
                        <input
                          type="text"
                          value={method.name}
                          onChange={(e) => handleMethodChange(traitIndex, methodIndex, 'name', e.target.value)}
                          placeholder="Method name"
                          className="px-2 py-1 border border-gray-300 rounded text-xs text-black min-w-0"
                        />
                        <input
                          type="text"
                          value={method.returnType}
                          onChange={(e) => handleMethodChange(traitIndex, methodIndex, 'returnType', e.target.value)}
                          placeholder="Return type"
                          className="px-2 py-1 border border-gray-300 rounded text-xs text-black min-w-0"
                        />
                        <select
                          value={method.visibility}
                          onChange={(e) => handleMethodChange(traitIndex, methodIndex, 'visibility', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs text-black min-w-0"
                        >
                          <option value="private">private</option>
                          <option value="protected">protected</option>
                          <option value="public">public</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveMethod(traitIndex, methodIndex)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                          title="Remove method"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Required Interfaces Management */}
              <div className="mb-4">
                <h6 className="font-medium text-gray-700 mb-2">Required Interfaces</h6>
                <button
                  type="button"
                  onClick={() => handleAddInterface(traitIndex)}
                  className="mb-2 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  Add Interface
                </button>
                
                <div className="space-y-2">
                  {trait.requiredInterfaces.map((interfaceName, interfaceIndex) => (
                    <div key={interfaceIndex} className="flex items-center space-x-2 p-2 border border-gray-200 rounded">
                      <input
                        type="text"
                        value={interfaceName}
                        onChange={(e) => handleInterfaceChange(traitIndex, interfaceIndex, e.target.value)}
                        placeholder="Interface name (e.g., TimestampableInterface)"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs text-black min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveInterface(traitIndex, interfaceIndex)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        title="Remove interface"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
          </div>
        ))}
        
        {/* Drop zone at the end */}
        <div
          className={`min-h-2 transition-all duration-200 ${
            draggedTraitId ? 'bg-blue-100 border-2 border-dashed border-blue-300 rounded' : ''
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
