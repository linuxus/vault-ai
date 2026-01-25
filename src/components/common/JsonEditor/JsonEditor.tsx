import { useState, useImperativeHandle, forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2 } from 'lucide-react';

export interface JsonEditorRef {
  /** Flush any pending entry and return the updated data */
  flushPendingEntry: () => Record<string, string>;
}

interface JsonEditorProps {
  data: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
  className?: string;
  readOnly?: boolean;
}

export const JsonEditor = forwardRef<JsonEditorRef, JsonEditorProps>(
  function JsonEditor({ data, onChange, className, readOnly = false }, ref) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const entries = Object.entries(data);

  const handleKeyChange = (oldKey: string, newKeyValue: string) => {
    const newData = { ...data };
    const value = newData[oldKey];
    delete newData[oldKey];
    newData[newKeyValue] = value;
    onChange(newData);
  };

  const handleValueChange = (key: string, value: string) => {
    onChange({ ...data, [key]: value });
  };

  const handleDelete = (key: string) => {
    const newData = { ...data };
    delete newData[key];
    onChange(newData);
  };

  const handleAdd = () => {
    if (!newKey.trim()) return;
    onChange({ ...data, [newKey.trim()]: newValue });
    setNewKey('');
    setNewValue('');
  };

  // Expose method to flush any pending entry before form submit
  useImperativeHandle(ref, () => ({
    flushPendingEntry: () => {
      if (newKey.trim()) {
        const updatedData = { ...data, [newKey.trim()]: newValue };
        onChange(updatedData);
        setNewKey('');
        setNewValue('');
        return updatedData;
      }
      return data;
    },
  }), [data, newKey, newValue, onChange]);

  return (
    <div className={cn('space-y-3', className)}>
      {entries.map(([key, value], index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              value={key}
              onChange={(e) => handleKeyChange(key, e.target.value)}
              placeholder="Key"
              disabled={readOnly}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex-1">
            <Input
              type="password"
              value={value}
              onChange={(e) => handleValueChange(key, e.target.value)}
              placeholder="Value"
              disabled={readOnly}
              className="font-mono text-sm"
            />
          </div>
          {!readOnly && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(key)}
              className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {!readOnly && (
        <div className="flex items-start gap-2 border-t pt-3">
          <div className="flex-1">
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="New key"
              className="font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newKey.trim()) {
                  handleAdd();
                }
              }}
            />
          </div>
          <div className="flex-1">
            <Input
              type="password"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="New value"
              className="font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newKey.trim()) {
                  handleAdd();
                }
              }}
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleAdd}
            disabled={!newKey.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {entries.length === 0 && readOnly && (
        <div className="py-4 text-center text-gray-500">No data</div>
      )}
    </div>
  );
});
