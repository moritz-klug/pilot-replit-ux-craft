import React from 'react';
export function GlobalDesignSummary({ summary }) {
  if (!summary) return null;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Global Design Summary</h2>
      <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(summary, null, 2)}</pre>
    </div>
  );
} 