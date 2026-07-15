import React from "react";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onCheckedChange, id }) => {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
    />
  );
};
