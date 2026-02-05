'use client';

import { Relationship, GenerationOptions } from '@/lib/types';
import { CollapsibleSection } from './ui/collapsible-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RelationshipManagementProps {
  options: GenerationOptions;
  onOptionsChange: (options: GenerationOptions) => void;
}

export function RelationshipManagement({ options, onOptionsChange }: RelationshipManagementProps) {
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
      orphanRemoval: false,
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
    newRelationships[relationshipIndex] = {
      ...newRelationships[relationshipIndex],
      [field]: value,
    };
    onOptionsChange({ ...options, relationships: newRelationships });
  };

  const handleCascadeChange = (
    relationshipIndex: number,
    cascadeType: 'persist' | 'remove' | 'merge' | 'detach' | 'refresh',
    checked: boolean
  ) => {
    const newRelationships = [...(options.relationships || [])];
    const relationship = newRelationships[relationshipIndex];

    if (checked) {
      if (!relationship.cascade) relationship.cascade = [];
      relationship.cascade.push(cascadeType);
    } else {
      relationship.cascade = relationship.cascade?.filter((c) => c !== cascadeType) || [];
    }

    onOptionsChange({ ...options, relationships: newRelationships });
  };

  return (
    <div className="border-t border-border pt-4">
      <h4 className="font-medium text-foreground mb-3">Relationships Management</h4>
      <p className="text-sm text-muted-foreground mb-3">
        Define relationships between entities. Configure join columns, cascade operations, and fetch strategies.
      </p>

      {/* Add New Relationship Button */}
      <Button
        type="button"
        onClick={handleAddRelationship}
        className="mb-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
      >
        Add New Relationship
      </Button>

      {/* Relationships List */}
      <div className="space-y-4">
        {(options.relationships || []).map((relationship, relationshipIndex) => (
          <CollapsibleSection
            key={relationship.id}
            title={relationship.field || `Relationship ${relationshipIndex + 1}`}
            subtitle={`${relationship.type} → ${relationship.targetEntity}`}
            onRemove={() => handleRemoveRelationship(relationshipIndex)}
            showDragHandle={false}
            showOrderNumber={false}
          >
            {/* Relationship Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
              <Input
                type="text"
                value={relationship.field}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'field', e.target.value)}
                placeholder="Field name (e.g., company)"
                className="text-sm min-w-0"
              />
              <Select
                value={relationship.type}
                onValueChange={(value) => handleRelationshipChange(relationshipIndex, 'type', value)}
              >
                <SelectTrigger className="text-sm w-full min-w-[180px]">
                  <SelectValue placeholder="Select relationship type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-to-one">One-to-One</SelectItem>
                  <SelectItem value="one-to-many">One-to-Many</SelectItem>
                  <SelectItem value="many-to-one">Many-to-One</SelectItem>
                  <SelectItem value="many-to-many">Many-to-Many</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                value={relationship.targetEntity}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'targetEntity', e.target.value)}
                placeholder="Target entity (e.g., Company)"
                className="text-sm min-w-0"
              />
              <Input
                type="text"
                value={relationship.joinColumn}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'joinColumn', e.target.value)}
                placeholder="Join column (e.g., company_id)"
                className="text-sm min-w-0"
              />
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
              <Select
                value={relationship.fetch}
                onValueChange={(value) => handleRelationshipChange(relationshipIndex, 'fetch', value)}
              >
                <SelectTrigger className="text-sm w-full min-w-[160px]">
                  <SelectValue placeholder="Select fetch type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAZY">Lazy Loading</SelectItem>
                  <SelectItem value="EAGER">Eager Loading</SelectItem>
                  <SelectItem value="EXTRA_LAZY">Extra Lazy Loading</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center">
                <Checkbox
                  id={`orphan-removal-${relationship.id}`}
                  checked={relationship.orphanRemoval}
                  onCheckedChange={(checked) => handleRelationshipChange(relationshipIndex, 'orphanRemoval', checked)}
                />
                <Label htmlFor={`orphan-removal-${relationship.id}`} className="ml-2 text-sm">
                  Orphan Removal
                </Label>
              </div>
            </div>

            {/* Mapped By / Inversed By */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
              <Input
                type="text"
                value={relationship.mappedBy}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'mappedBy', e.target.value)}
                placeholder="Mapped by field (optional)"
                className="text-sm min-w-0"
              />
              <Input
                type="text"
                value={relationship.inversedBy}
                onChange={(e) => handleRelationshipChange(relationshipIndex, 'inversedBy', e.target.value)}
                placeholder="Inversed by field (optional)"
                className="text-sm min-w-0"
              />
            </div>

            {/* Cascade Operations */}
            <div className="mb-4">
              <h6 className="font-medium text-foreground mb-2">Cascade Operations</h6>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {(['persist', 'remove', 'merge', 'detach', 'refresh'] as const).map((cascadeType) => (
                  <div key={`${relationship.id}-${cascadeType}`} className="flex items-center">
                    <Checkbox
                      id={`cascade-${cascadeType}-${relationship.id}`}
                      checked={relationship.cascade?.includes(cascadeType) || false}
                      onCheckedChange={(checked) => handleCascadeChange(relationshipIndex, cascadeType, !!checked)}
                    />
                    <Label htmlFor={`cascade-${cascadeType}-${relationship.id}`} className="ml-2 text-sm">
                      {cascadeType.charAt(0).toUpperCase() + cascadeType.slice(1)}
                    </Label>
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
