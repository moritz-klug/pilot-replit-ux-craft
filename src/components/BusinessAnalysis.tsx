import React from 'react';
export function BusinessAnalysis({ analysis }) {
  if (!analysis) return null;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Business Analysis</h2>
      <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(analysis, null, 2)}</pre>
    </div>
  );
} 