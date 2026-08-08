"use client";

import { useState } from 'react';
import { Plus, X, Filter } from 'lucide-react';

export interface FilterRule {
  field: string;
  operator: string;
  value: string;
}

export interface FilterGroup {
  logic: 'AND' | 'OR';
  rules: FilterRule[];
}

interface FilterBuilderProps {
  fields: { label: string; value: string; type: 'text' | 'date' | 'select'; options?: { label: string; value: string }[] }[];
  onApply: (group: FilterGroup) => void;
  onClear: () => void;
}

export function FilterBuilder({ fields, onApply, onClear }: FilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [group, setGroup] = useState<FilterGroup>({ logic: 'AND', rules: [] });

  const addRule = () => {
    setGroup({
      ...group,
      rules: [...group.rules, { field: fields[0]?.value || '', operator: 'equals', value: '' }]
    });
  };

  const removeRule = (index: number) => {
    const newRules = [...group.rules];
    newRules.splice(index, 1);
    setGroup({ ...group, rules: newRules });
  };

  const updateRule = (index: number, key: keyof FilterRule, val: string) => {
    const newRules = [...group.rules];
    if (newRules[index]) {
      newRules[index][key] = val;
      setGroup({ ...group, rules: newRules });
    }
  };

  const handleApply = () => {
    onApply(group);
    setIsOpen(false);
  };

  const handleClear = () => {
    setGroup({ logic: 'AND', rules: [] });
    onClear();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filters
        {group.rules.length > 0 && (
          <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {group.rules.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Advanced Filters</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 mb-2 block">Match Logic</label>
            <select 
              value={group.logic} 
              onChange={e => setGroup({...group, logic: e.target.value as 'AND' | 'OR'})}
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="AND">All rules must match (AND)</option>
              <option value="OR">Any rule can match (OR)</option>
            </select>
          </div>

          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
            {group.rules.map((rule, idx) => {
              const fieldConfig = fields.find(f => f.value === rule.field);
              return (
                <div key={idx} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 relative group">
                  <button onClick={() => removeRule(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                  <select 
                    value={rule.field} 
                    onChange={e => updateRule(idx, 'field', e.target.value)}
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-6"
                  >
                    {fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  
                  <div className="flex gap-2">
                    <select 
                      value={rule.operator} 
                      onChange={e => updateRule(idx, 'operator', e.target.value)}
                      className="w-1/3 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      {fieldConfig?.type === 'date' && <option value="after">After</option>}
                      {fieldConfig?.type === 'date' && <option value="before">Before</option>}
                    </select>
                    
                    {fieldConfig?.type === 'select' ? (
                      <select 
                        value={rule.value} 
                        onChange={e => updateRule(idx, 'value', e.target.value)}
                        className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        {fieldConfig.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : fieldConfig?.type === 'date' ? (
                      <input 
                        type="date"
                        value={rule.value} 
                        onChange={e => updateRule(idx, 'value', e.target.value)}
                        className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <input 
                        type="text"
                        placeholder="Value..."
                        value={rule.value} 
                        onChange={e => updateRule(idx, 'value', e.target.value)}
                        className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={addRule}
            className="w-full flex justify-center items-center py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 mb-4 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Rule
          </button>

          <div className="flex gap-2">
            <button onClick={handleClear} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors">Clear</button>
            <button onClick={handleApply} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors">Apply Filters</button>
          </div>
        </div>
      )}
    </div>
  );
}
