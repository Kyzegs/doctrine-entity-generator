'use client';

import { GenerationOptions, ColumnFieldMapping, CustomDataType, Relationship, CustomTrait } from '@/lib/types';

interface OptionsFormProps {
  options: GenerationOptions;
  onChange: (options: GenerationOptions) => void;
}

export function OptionsForm({ options, onChange }: OptionsFormProps) {
  const handleInputChange = (field: keyof GenerationOptions, value: string | boolean | ColumnFieldMapping[] | CustomDataType[] | Relationship[] | string[] | CustomTrait[]) => {
    onChange({
      ...options,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6 p-4 border border-gray-200 rounded-lg bg-white">
      {/* Basic Settings */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Basic Settings</h4>
        <div className="space-y-3">
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
              placeholder="AntiCorruptionLayer\Tinpay\Entity"
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
      </div>



      {/* ORM Mapping Settings */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">ORM Mapping Settings</h4>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="explicitlyDefineColumns"
              checked={options.explicitlyDefineColumns}
              onChange={(e) => handleInputChange('explicitlyDefineColumns', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="explicitlyDefineColumns" className="ml-2 text-sm text-gray-700">
              Explicitly define column mappings (always include column attribute)
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Data Types
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Define reusable custom data types with their PHP equivalents.
            </p>
            <div className="space-y-2">
              {options.customDataTypes.map((dataType, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={dataType.name}
                    onChange={(e) => {
                      const newDataTypes = [...options.customDataTypes];
                      newDataTypes[index].name = e.target.value;
                      handleInputChange('customDataTypes', newDataTypes);
                    }}
                    placeholder="Type name (e.g., timestamp)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  />
                  <input
                    type="text"
                    value={dataType.phpType}
                    onChange={(e) => {
                      const newDataTypes = [...options.customDataTypes];
                      newDataTypes[index].phpType = e.target.value;
                      handleInputChange('customDataTypes', newDataTypes);
                    }}
                    placeholder="PHP type (e.g., \\DateTimeImmutable)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newDataTypes = options.customDataTypes.filter((_, i) => i !== index);
                      handleInputChange('customDataTypes', newDataTypes);
                    }}
                    className="px-3 py-2 text-red-600 hover:text-red-800 text-sm whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newDataTypes = [...options.customDataTypes, { name: '', phpType: '' }];
                  handleInputChange('customDataTypes', newDataTypes);
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Add Custom Type
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Column to Field Mappings
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Map database columns to custom field names and select their data types. Leave column empty to create a field-only mapping. Add enum class name for enum fields.
            </p>
            <div className="space-y-2">
              {options.columnFieldMappings.map((mapping, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={mapping.field}
                    onChange={(e) => {
                      const newMappings = [...options.columnFieldMappings];
                      newMappings[index].field = e.target.value;
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    placeholder="Field name"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
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
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  />
                  <select
                    value={mapping.selectedType}
                    onChange={(e) => {
                      const newMappings = [...options.columnFieldMappings];
                      newMappings[index].selectedType = e.target.value;
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  >
                    <option value="">Auto-detect</option>
                    <optgroup label="Custom Types">
                      {options.customDataTypes.map(dt => (
                        <option key={dt.name} value={dt.name}>{dt.name} ({dt.phpType})</option>
                      ))}
                    </optgroup>
                    <optgroup label="Doctrine Types">
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
                    </optgroup>
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
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newMappings = options.columnFieldMappings.filter((_, i) => i !== index);
                      handleInputChange('columnFieldMappings', newMappings);
                    }}
                    className="px-3 py-2 text-red-600 hover:text-red-800 text-sm whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newMappings = [...options.columnFieldMappings, { field: '', column: undefined, selectedType: '', enumClass: undefined }];
                  handleInputChange('columnFieldMappings', newMappings);
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Add Mapping
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* PHP Entity Class Settings */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">PHP Entity Class Settings</h4>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="publicProperties"
              checked={options.publicProperties}
              onChange={(e) => handleInputChange('publicProperties', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="publicProperties" className="ml-2 text-sm text-gray-700">
              Public properties (instead of private with getters/setters)
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="generateGetters"
              checked={options.generateGetters}
              onChange={(e) => handleInputChange('generateGetters', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={options.publicProperties}
            />
            <label htmlFor="generateGetters" className="ml-2 text-sm text-gray-700">
              Generate getter methods
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="generateSetters"
              checked={options.generateSetters}
              onChange={(e) => handleInputChange('generateSetters', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={options.publicProperties}
            />
            <label htmlFor="generateSetters" className="ml-2 text-sm text-gray-700">
              Generate setter methods
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="generateFluentSetters"
              checked={options.generateFluentSetters}
              onChange={(e) => handleInputChange('generateFluentSetters', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={!options.generateSetters}
            />
            <label htmlFor="generateFluentSetters" className="ml-2 text-sm text-gray-700">
              Generate fluent setters (return $this)
            </label>
          </div>
        </div>
      </div>

      {/* Relationship Settings */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Relationship Settings</h4>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">
            Define entity relationships with full control over type, target entity, and options like cascading and fetch mode.
          </p>
          
          <div className="space-y-4">
            {(options.relationships || []).map((relationship, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={relationship.field}
                    onChange={(e) => {
                      const newRelationships = [...(options.relationships || [])];
                      newRelationships[index].field = e.target.value;
                      handleInputChange('relationships', newRelationships);
                    }}
                    placeholder="Field name"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  />
                  <select
                    value={relationship.type}
                    onChange={(e) => {
                      const newRelationships = [...(options.relationships || [])];
                      newRelationships[index].type = e.target.value as Relationship['type'];
                      handleInputChange('relationships', newRelationships);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  >
                    <option value="many-to-one">Many-to-One</option>
                    <option value="one-to-many">One-to-Many</option>
                    <option value="one-to-one">One-to-One</option>
                    <option value="many-to-many">Many-to-Many</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={relationship.targetEntity}
                    onChange={(e) => {
                      const newRelationships = [...(options.relationships || [])];
                      newRelationships[index].targetEntity = e.target.value;
                      handleInputChange('relationships', newRelationships);
                    }}
                    placeholder="Target entity class name"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  />
                  <input
                    type="text"
                    value={relationship.targetEntityNamespace || ''}
                    onChange={(e) => {
                      const newRelationships = [...(options.relationships || [])];
                      newRelationships[index].targetEntityNamespace = e.target.value || undefined;
                      handleInputChange('relationships', newRelationships);
                    }}
                    placeholder="Target namespace (optional)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={relationship.joinColumn || ''}
                    onChange={(e) => {
                      const newRelationships = [...(options.relationships || [])];
                      newRelationships[index].joinColumn = e.target.value || undefined;
                      handleInputChange('relationships', newRelationships);
                    }}
                    placeholder="Join column (for many-to-one, one-to-one)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  />
                  <input
                    type="text"
                    value={relationship.mappedBy || ''}
                    onChange={(e) => {
                      const newRelationships = [...(options.relationships || [])];
                      newRelationships[index].mappedBy = e.target.value || undefined;
                      handleInputChange('relationships', newRelationships);
                    }}
                    placeholder="Mapped by (for one-to-many, many-to-many inverse)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={relationship.inversedBy || ''}
                    onChange={(e) => {
                      const newRelationships = [...(options.relationships || [])];
                      newRelationships[index].inversedBy = e.target.value || undefined;
                      handleInputChange('relationships', newRelationships);
                    }}
                    placeholder="Inversed by (for one-to-many, many-to-many owning)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  />
                  <select
                    value={relationship.fetch || 'LAZY'}
                    onChange={(e) => {
                      const newRelationships = [...(options.relationships || [])];
                      newRelationships[index].fetch = e.target.value as Relationship['fetch'];
                      handleInputChange('relationships', newRelationships);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  >
                    <option value="LAZY">Lazy Loading</option>
                    <option value="EAGER">Eager Loading</option>
                    <option value="EXTRA_LAZY">Extra Lazy Loading</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Cascade Options</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {(['persist', 'remove', 'merge', 'detach', 'refresh'] as const).map((cascadeType) => (
                      <label key={cascadeType} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={relationship.cascade?.includes(cascadeType) || false}
                          onChange={(e) => {
                            const newRelationships = [...(options.relationships || [])];
                            const currentCascade = newRelationships[index].cascade || [];
                            if (e.target.checked) {
                              newRelationships[index].cascade = [...currentCascade, cascadeType];
                            } else {
                              newRelationships[index].cascade = currentCascade.filter(c => c !== cascadeType);
                            }
                            handleInputChange('relationships', newRelationships);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{cascadeType}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`orphanRemoval-${index}`}
                    checked={relationship.orphanRemoval || false}
                    onChange={(e) => {
                      const newRelationships = [...(options.relationships || [])];
                      newRelationships[index].orphanRemoval = e.target.checked;
                      handleInputChange('relationships', newRelationships);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`orphanRemoval-${index}`} className="ml-2 text-sm text-gray-700">
                    Orphan removal (for one-to-many, many-to-many)
                  </label>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const newRelationships = (options.relationships || []).filter((_, i) => i !== index);
                    handleInputChange('relationships', newRelationships);
                  }}
                  className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove Relationship
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => {
                const newRelationship: Relationship = {
                  field: '',
                  type: 'many-to-one',
                  targetEntity: '',
                  fetch: 'LAZY',
                  cascade: []
                };
                const newRelationships = [...(options.relationships || []), newRelationship];
                handleInputChange('relationships', newRelationships);
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Add Relationship
            </button>
          </div>
        </div>
      </div>

      {/* Custom Traits Management */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Custom Traits Management</h4>
        <p className="text-sm text-gray-600 mb-3">
          Create and manage custom traits for your entities. Each trait can have properties, methods, and required interfaces.
        </p>
        
        {/* Add New Trait Button */}
        <button
          type="button"
          onClick={() => {
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
            handleInputChange('customTraits', newTraits);
          }}
          className="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
        >
          Add New Trait
        </button>
        
        {/* Custom Traits List */}
        <div className="space-y-4">
          {(options.customTraits || []).map((trait, traitIndex) => (
            <div key={trait.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">Trait {traitIndex + 1}</h5>
                <button
                  type="button"
                  onClick={() => {
                    const newTraits = (options.customTraits || []).filter((_, i) => i !== traitIndex);
                    handleInputChange('customTraits', newTraits);
                  }}
                  className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
              
              {/* Trait Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <input
                  type="text"
                  value={trait.name}
                  onChange={(e) => {
                    const newTraits = [...(options.customTraits || [])];
                    newTraits[traitIndex].name = e.target.value;
                    handleInputChange('customTraits', newTraits);
                  }}
                  placeholder="Trait name (e.g., TimestampableTrait)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                />
                <input
                  type="text"
                  value={trait.displayName}
                  onChange={(e) => {
                    const newTraits = [...(options.customTraits || [])];
                    newTraits[traitIndex].displayName = e.target.value;
                    handleInputChange('customTraits', newTraits);
                  }}
                  placeholder="Display name (e.g., Timestampable)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                />
                <input
                  type="text"
                  value={trait.namespace}
                  onChange={(e) => {
                    const newTraits = [...(options.customTraits || [])];
                    newTraits[traitIndex].namespace = e.target.value;
                    handleInputChange('customTraits', newTraits);
                  }}
                  placeholder="Namespace (e.g., App\\Traits)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                />
                <input
                  type="text"
                  value={trait.description}
                  onChange={(e) => {
                    const newTraits = [...(options.customTraits || [])];
                    newTraits[traitIndex].description = e.target.value;
                    handleInputChange('customTraits', newTraits);
                  }}
                  placeholder="Description"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                />
              </div>
              
              {/* Trait Selection */}
              <div className="flex items-center mb-4">
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
                    
                    handleInputChange('selectedTraits', newTraits);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={!trait.name}
                />
                <label htmlFor={`use-trait-${trait.id}`} className="ml-2 text-sm text-gray-700">
                  Use this trait in the entity
                </label>
              </div>
              
              {/* Properties Management */}
              <div className="mb-4">
                <h6 className="font-medium text-gray-700 mb-2">Properties</h6>
                <button
                  type="button"
                  onClick={() => {
                    const newTraits = [...(options.customTraits || [])];
                    newTraits[traitIndex].properties.push({
                      name: '',
                      type: 'string',
                      visibility: 'private',
                      nullable: false,
                      description: ''
                    });
                    handleInputChange('customTraits', newTraits);
                  }}
                  className="mb-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Add Property
                </button>
                
                <div className="space-y-2">
                  {trait.properties.map((property, propIndex) => (
                    <div key={propIndex} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-2 border border-gray-200 rounded">
                      <input
                        type="text"
                        value={property.name}
                        onChange={(e) => {
                          const newTraits = [...(options.customTraits || [])];
                          newTraits[traitIndex].properties[propIndex].name = e.target.value;
                          handleInputChange('customTraits', newTraits);
                        }}
                        placeholder="Property name"
                        className="px-2 py-1 border border-gray-300 rounded text-xs text-black"
                      />
                      <input
                        type="text"
                        value={property.type}
                        onChange={(e) => {
                          const newTraits = [...(options.customTraits || [])];
                          newTraits[traitIndex].properties[propIndex].type = e.target.value;
                          handleInputChange('customTraits', newTraits);
                        }}
                        placeholder="Type"
                        className="px-2 py-1 border border-gray-300 rounded text-xs text-black"
                      />
                      <select
                        value={property.visibility}
                        onChange={(e) => {
                          const newTraits = [...(options.customTraits || [])];
                          newTraits[traitIndex].properties[propIndex].visibility = e.target.value as any;
                          handleInputChange('customTraits', newTraits);
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-xs text-black"
                      >
                        <option value="private">private</option>
                        <option value="protected">protected</option>
                        <option value="public">public</option>
                      </select>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={property.nullable}
                          onChange={(e) => {
                            const newTraits = [...(options.customTraits || [])];
                            newTraits[traitIndex].properties[propIndex].nullable = e.target.checked;
                            handleInputChange('customTraits', newTraits);
                          }}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-1 text-xs text-gray-600">nullable</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newTraits = [...(options.customTraits || [])];
                          newTraits[traitIndex].properties.splice(propIndex, 1);
                          handleInputChange('customTraits', newTraits);
                        }}
                        className="px-2 py-1 text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
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
                  onClick={() => {
                    const newTraits = [...(options.customTraits || [])];
                    newTraits[traitIndex].methods.push({
                      name: '',
                      returnType: 'void',
                      parameters: [],
                      visibility: 'public',
                      description: ''
                    });
                    handleInputChange('customTraits', newTraits);
                  }}
                  className="mb-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Add Method
                </button>
                
                <div className="space-y-2">
                  {trait.methods.map((method, methodIndex) => (
                    <div key={methodIndex} className="border border-gray-200 rounded p-2">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                        <input
                          type="text"
                          value={method.name}
                          onChange={(e) => {
                            const newTraits = [...(options.customTraits || [])];
                            newTraits[traitIndex].methods[methodIndex].name = e.target.value;
                            handleInputChange('customTraits', newTraits);
                          }}
                          placeholder="Method name"
                          className="px-2 py-1 border border-gray-300 rounded text-xs text-black"
                        />
                        <input
                          type="text"
                          value={method.returnType}
                          onChange={(e) => {
                            const newTraits = [...(options.customTraits || [])];
                            newTraits[traitIndex].methods[methodIndex].returnType = e.target.value;
                            handleInputChange('customTraits', newTraits);
                          }}
                          placeholder="Return type"
                          className="px-2 py-1 border border-gray-300 rounded text-xs text-black"
                        />
                        <select
                          value={method.visibility}
                          onChange={(e) => {
                            const newTraits = [...(options.customTraits || [])];
                            newTraits[traitIndex].methods[methodIndex].visibility = e.target.value as any;
                            handleInputChange('customTraits', newTraits);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-xs text-black"
                        >
                          <option value="private">private</option>
                          <option value="protected">protected</option>
                          <option value="public">public</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const newTraits = [...(options.customTraits || [])];
                            newTraits[traitIndex].methods.splice(methodIndex, 1);
                            handleInputChange('customTraits', newTraits);
                          }}
                          className="px-2 py-1 text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      
                      {/* Method Parameters */}
                      <div className="ml-4">
                        <button
                          type="button"
                          onClick={() => {
                            const newTraits = [...(options.customTraits || [])];
                            newTraits[traitIndex].methods[methodIndex].parameters.push({
                              name: '',
                              type: 'string',
                              nullable: false
                            });
                            handleInputChange('customTraits', newTraits);
                          }}
                          className="mb-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                        >
                          Add Parameter
                        </button>
                        
                        <div className="space-y-1">
                          {method.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                              <input
                                type="text"
                                value={param.name}
                                onChange={(e) => {
                                  const newTraits = [...(options.customTraits || [])];
                                  newTraits[traitIndex].methods[methodIndex].parameters[paramIndex].name = e.target.value;
                                  handleInputChange('customTraits', newTraits);
                                }}
                                placeholder="Parameter name"
                                className="px-2 py-1 border border-gray-300 rounded text-xs text-black"
                              />
                              <input
                                type="text"
                                value={param.type}
                                onChange={(e) => {
                                  const newTraits = [...(options.customTraits || [])];
                                  newTraits[traitIndex].methods[methodIndex].parameters[paramIndex].type = e.target.value;
                                  handleInputChange('customTraits', newTraits);
                                }}
                                placeholder="Parameter type"
                                className="px-2 py-1 border border-gray-300 rounded text-xs text-black"
                              />
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={param.nullable}
                                  onChange={(e) => {
                                    const newTraits = [...(options.customTraits || [])];
                                    newTraits[traitIndex].methods[methodIndex].parameters[paramIndex].nullable = e.target.checked;
                                    handleInputChange('customTraits', newTraits);
                                  }}
                                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-1 text-xs text-gray-600">nullable</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newTraits = [...(options.customTraits || [])];
                                  newTraits[traitIndex].methods[methodIndex].parameters.splice(paramIndex, 1);
                                  handleInputChange('customTraits', newTraits);
                                }}
                                className="px-2 py-1 text-red-600 hover:text-red-800 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Required Interfaces */}
              <div>
                <h6 className="font-medium text-gray-700 mb-2">Required Interfaces</h6>
                <button
                  type="button"
                  onClick={() => {
                    const newTraits = [...(options.customTraits || [])];
                    newTraits[traitIndex].requiredInterfaces.push('');
                    handleInputChange('customTraits', newTraits);
                  }}
                  className="mb-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Add Interface
                </button>
                
                <div className="space-y-2">
                  {trait.requiredInterfaces.map((iface, ifaceIndex) => (
                    <div key={ifaceIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={iface}
                        onChange={(e) => {
                          const newTraits = [...(options.customTraits || [])];
                          newTraits[traitIndex].requiredInterfaces[ifaceIndex] = e.target.value;
                          handleInputChange('customTraits', newTraits);
                        }}
                        placeholder="Interface name (e.g., App\\Contracts\\TimestampableInterface)"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs text-black"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newTraits = [...(options.customTraits || [])];
                          newTraits[traitIndex].requiredInterfaces.splice(ifaceIndex, 1);
                          handleInputChange('customTraits', newTraits);
                        }}
                        className="px-2 py-1 text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
