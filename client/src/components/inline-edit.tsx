import React, { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";

interface InlineEditProps {
  value: string;
  onSave?: (newValue: string) => void;
  label?: string; // For accessibility
  type?: "text" | "textarea" | "select" | "date";
  options?: string[]; // For select type
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  type = "text",
  options = [],
  className = "",
  placeholder = "Click to edit...",
  multiline = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (tempValue !== value) {
      onSave!(tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type !== "textarea") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Render Display Mode
  if (!isEditing) {
    return (
      <div className={`group flex items-center min-h-6 ${className}`}>
        <div
          onClick={() => setIsEditing(true)}
          className={`
            cursor-pointer px-2 py-1 rounded border border-transparent 
            hover:border-slate-200 hover:bg-slate-50 transition-all duration-200
            empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:italic
            ${multiline ? "whitespace-pre-wrap wrap-break-word" : "max-w-full"}
            ${!value ? "text-slate-400 italic" : ""}
          `}
          title="Click to edit"
          data-placeholder={placeholder}
        >
          {value || placeholder}
        </div>
      </div>
    );
  }

  // Render Edit Mode
  return (
    <div className="flex items-start gap-1 animate-in fade-in duration-100">
      <div className="flex-1 relative">
        {type === "text" && (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full text-sm px-2 py-1 border border-blue-500 rounded shadow-sm focus:ring-2 focus:ring-blue-100 outline-none"
          />
        )}
        {type === "textarea" && (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full text-sm px-2 py-1 border border-blue-500 rounded shadow-sm focus:ring-2 focus:ring-blue-100 outline-none resize-y"
          />
        )}
        {type === "select" && (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            className="w-full text-sm px-2 py-1 border border-blue-500 rounded shadow-sm focus:ring-2 focus:ring-blue-100 outline-none bg-white"
          >
            <option value="" disabled>
              Select...
            </option>
            {options.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}
        {type === "date" && (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full text-sm px-2 py-1 border border-blue-500 rounded shadow-sm focus:ring-2 focus:ring-blue-100 outline-none"
          />
        )}
      </div>
      <div className="flex gap-1">
        <button
          onClick={handleSave}
          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
          title="Save (Enter)"
        >
          <Check size={14} />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 bg-white text-slate-500 border border-slate-200 rounded hover:bg-slate-50 transition-colors shadow-sm"
          title="Cancel (Esc)"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
