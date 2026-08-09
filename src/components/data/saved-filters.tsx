"use client";

import { useState, useEffect } from 'react';
import { Bookmark, Save, Trash2 } from 'lucide-react';
import { FilterGroup } from './filter-builder';

interface SavedFilter {
  id: string;
  name: string;
  group: FilterGroup;
  type: 'personal' | 'shared';
}

interface SavedFiltersProps {
  currentGroup: FilterGroup;
  onLoad: (group: FilterGroup) => void;
}

export function SavedFilters({ currentGroup, onLoad }: SavedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  // Mock loading from localStorage for MVP
  useEffect(() => {
    const stored = localStorage.getItem('senyx_saved_filters');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        Promise.resolve().then(() => setSavedFilters(parsed));
      } catch (e) {}
    } else {
      // Load some defaults
      const defaults: SavedFilter[] = [
        { id: '1', name: 'Open High Value Deals', type: 'shared', group: { logic: 'AND', rules: [{ field: 'status', operator: 'equals', value: 'open' }, { field: 'amount', operator: 'after', value: '10000' }] } }
      ];
      Promise.resolve().then(() => setSavedFilters(defaults));
      localStorage.setItem('senyx_saved_filters', JSON.stringify(defaults));
    }
  }, []);

  const saveFilter = () => {
    if (!newFilterName.trim()) return;
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: newFilterName,
      group: currentGroup,
      type: 'personal'
    };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('senyx_saved_filters', JSON.stringify(updated));
    setNewFilterName('');
    setIsSaving(false);
  };

  const deleteFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('senyx_saved_filters', JSON.stringify(updated));
  };

  const personal = savedFilters.filter(f => f.type === 'personal');
  const shared = savedFilters.filter(f => f.type === 'shared');

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700"
      >
        <Bookmark className="w-4 h-4 mr-2" />
        Saved Views
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            {isSaving ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newFilterName} 
                  onChange={e => setNewFilterName(e.target.value)}
                  placeholder="View name..."
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm"
                  autoFocus
                />
                <button onClick={saveFilter} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm">Save</button>
                <button onClick={() => setIsSaving(false)} className="text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSaving(true)}
                disabled={currentGroup.rules.length === 0}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save Current View
              </button>
            )}
          </div>

          <div className="p-2 max-h-60 overflow-y-auto">
            {personal.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">My Views</div>
                {personal.map(f => (
                  <div key={f.id} className="flex justify-between items-center group px-3 py-2 hover:bg-gray-50 rounded-md">
                    <button onClick={() => { onLoad(f.group); setIsOpen(false); }} className="text-sm text-gray-700 text-left flex-1">{f.name}</button>
                    <button onClick={() => deleteFilter(f.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                ))}
              </div>
            )}
            
            {shared.length > 0 && (
              <div>
                <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Shared Views</div>
                {shared.map(f => (
                  <div key={f.id} className="flex justify-between items-center group px-3 py-2 hover:bg-gray-50 rounded-md">
                    <button onClick={() => { onLoad(f.group); setIsOpen(false); }} className="text-sm text-gray-700 text-left flex-1">{f.name}</button>
                  </div>
                ))}
              </div>
            )}
            
            {savedFilters.length === 0 && !isSaving && (
              <div className="p-4 text-center text-sm text-gray-500">
                No saved views yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
