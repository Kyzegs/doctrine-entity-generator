'use client';

import { Relationship, GenerationOptions } from '@/lib/types';
import { CollapsibleSection } from './ui/collapsible-section';
import { Trash2 } from 'lucide-react';

interface RelationshipManagementProps {
  options: GenerationOptions;
  onOptionsChange: (options: GenerationOptions) => void;
}

export function RelationshipManagement({ 
  options, 
  onOptionsChange
}: RelationshipManagementProps) {
  const handleAddRelationship = () => {
    const newRelationship: Relationship = {
      id: `relationship-${Date.now()}`,
      field: '',
      type: 'many-to-one',
      targetEntity: '',
      joinColumn: '',
      fetch: 'LAZY',
      cascade: [],
      mappedBy: '',
      inversedBy: '',
      orphanRemoval: false
    };
    const newRelationships = [...(options.relationships || []), newRelationship];
    onOptionsChange({ ...options, relationships: newRelationships });
  };

  const handleRemoveRelationship = (relationshipIndex: number) => {
    const newRelationships = (options.relationships || []).filter((_, i) => i !== relationshipIndex);
    onOptionsChange({ ...options, relationships: newRelationships });
  };

  const handleRelationshipChange = (relationshipIndex: number, field: keyof Relationship, value: any) => {
    const newRelationships = [...(options.relationships || [])];
    newRelationships[relationshipIndex] = { ...newRelationships[relationshipIndex], [field]: value };
    onOptionsChange({ ...options, relationships: newRelationships });
  };

  const handleCascadeChange = (relationshipIndex: number, cascadeType: 'persist' | 'remove' | 'merge' | 'detach' | 'refresh', checked: boolean) => {
    const newRelationships = [...(options.relationships || [])];
    const relationship = newRelationships[relationshipIndex];
    
    if (checked) {
      if (!relationship.cascade) relationship.cascade = [];
      relationship.cascade.push(cascadeType);
    } else {
      relationship.cascade = relationship.cascade?.filter(c => c !== cascadeType) || [];
    }
    
    onOptionsChange({ ...options, relationships: newRelationships });
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      <h4 className="font-medium text-gray-900 mb-3">Relationships Management</h4>
      <p className="text-sm text-gray-600 mb-3">
        Define relationships between entities. Configure join columns, cascade operations, and fetch strategies.
      </p>
      
      {/* Add New Relationship Button */}
      <button
        type="button"
        onClick={handleAddRelationship}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
      >
        Add New Relationship
      </button>
      
      {/* Relationships List */}
      <div className="space-y-4">
        {(options.relationships || []).map((relationship, relationshipIndex) => (
          <CollapsibleSection
              key={relationship.id}
              id={relationship.id}
              title={relationship.field || `Relationship ${relationshipIndex + 1}`}
              subtitle={`${relationship.type} → ${relationship.targetEntity}`}
              onRemove={() => handleRemoveRelationship(relationshipIndex)}
              showDragHandle={false}
              showOrderNumber={true}
              orderNumber={relationshipIndex + 1}

            >
            {/* Relationship Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                value={relationship.field}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'field', e.target.value)}
                placeholder="Field name (e.g., company)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
              />
              <select
                value={relationship.type}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'type', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
              >
                <option value="one-to-one">One-to-One</option>
                <option value="one-to-many">One-to-Many</option>
                <option value="many-to-one">Many-to-One</option>
                <option value="many-to-many">Many-to-Many</option>
              </select>
              <input
                type="text"
                value={relationship.targetEntity}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'targetEntity', e.target.value)}
                placeholder="Target entity (e.g., Company)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
              />
              <input
                type="text"
                value={relationship.joinColumn}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'joinColumn', e.target.value)}
                placeholder="Join column (e.g., company_id)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
              />
            </div>
            
            {/* Advanced Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
              <select
                value={relationship.fetch}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'fetch', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
              >
                <option value="LAZY">Lazy Loading</option>
                <option value="EAGER">Eager Loading</option>
                <option value="EXTRA_LAZY">Extra Lazy Loading</option>
              </select>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`orphan-removal-${relationship.id}`}
                  checked={relationship.orphanRemoval}
                  onChange={(e) => handleRelationshipChange(relationshipIndex, 'orphanRemoval', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`orphan-removal-${relationship.id}`} className="ml-2 text-sm text-gray-700">
                  Orphan Removal
                </label>
              </div>
            </div>
            
            {/* Mapped By / Inversed By */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                value={relationship.mappedBy}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'mappedBy', e.target.value)}
                placeholder="Mapped by field (optional)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
              />
              <input
                type="text"
                value={relationship.inversedBy}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'inversedBy', e.target.value)}
                placeholder="Inversed by field (optional)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black min-w-0"
              />
            </div>
            
            {/* Cascade Operations */}
            <div className="mb-4">
              <h6 className="font-medium text-gray-700 mb-2">Cascade Operations</h6>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {(['persist', 'remove', 'merge', 'detach', 'refresh'] as const).map((cascadeType) => (
                  <div key={`${relationship.id}-${cascadeType}`} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`cascade-${cascadeType}-${relationship.id}`}
                      checked={relationship.cascade?.includes(cascadeType) || false}
                      onChange={(e) => handleCascadeChange(relationshipIndex, cascadeType, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`cascade-${cascadeType}-${relationship.id}`} className="ml-2 text-sm text-gray-700">
                      {cascadeType.charAt(0).toUpperCase() + cascadeType.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        ))}
      </div>
    </div>
  );
}
