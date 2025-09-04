'use client';

import { GenerationOptions } from '@/lib/types';

interface OptionsFormProps {
  options: GenerationOptions;
  onChange: (options: GenerationOptions) => void;
}

export function OptionsForm({ options, onChange }: OptionsFormProps) {
  const handleInputChange = (field: keyof GenerationOptions, value: string | boolean) => {
    onChange({
      ...options,
      [field]: value
    });
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="font-medium text-gray-900">Generation Options</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="namespace" className="block text-sm font-medium text-gray-700 mb-1">
            Namespace
          </label>
          <input
            type="text"
            id="namespace"
            value={options.namespace}
            onChange={(e) => handleInputChange('namespace', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder=""
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="generateFluentSetters"
            checked={options.generateFluentSetters}
            onChange={(e) => handleInputChange('generateFluentSetters', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="generateFluentSetters" className="ml-2 text-sm text-gray-700">
            Generate fluent setters (return $this)
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="generateInterfaces"
            checked={options.generateInterfaces}
            onChange={(e) => handleInputChange('generateInterfaces', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="generateInterfaces" className="ml-2 text-sm text-gray-700">
            Generate interfaces (CreatedAtInterface, etc.)
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="generateTraits"
            checked={options.generateTraits}
            onChange={(e) => handleInputChange('generateTraits', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="generateTraits" className="ml-2 text-sm text-gray-700">
            Generate traits (CreatedAtTrait, etc.)
          </label>
        </div>
      </div>
    </div>
  );
}
