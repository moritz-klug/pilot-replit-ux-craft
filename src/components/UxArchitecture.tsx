import React from 'react';
export function UxArchitecture({ architecture }) {
  if (!architecture) return null;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">UX Architecture</h2>
      <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(architecture, null, 2)}</pre>
    </div>
  );
} 