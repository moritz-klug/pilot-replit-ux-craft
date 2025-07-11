import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MoreHorizontal } from 'lucide-react';

export function SectionList({ analysis, handleStatusChange, componentStatuses, filterStatus }) {
  if (!analysis || !analysis.sections) return <div>No sections found.</div>;
  const uiSectionNames = analysis.visual_analysis?.ui_sections || [];
  let uiSections = analysis.sections.filter(
    (section) => uiSectionNames.includes(section.name)
  );
  if (filterStatus) {
    uiSections = uiSections.filter((section, idx) =>
      componentStatuses?.[section.name || idx] === filterStatus
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 mb-8">
      {uiSections.map((section, idx) => (
        <Card key={section.name || idx} className="border rounded-lg bg-white">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              {section.icon ? (
                <img src={section.icon} alt="icon" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-lg">{section.name?.[0]}</div>
              )}
              <div>
                <div className="font-semibold text-lg leading-tight text-gray-900">{section.name}</div>
                {section.subtitle && <div className="text-xs text-muted-foreground">{section.subtitle}</div>}
              </div>
            </div>
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <CardContent className="p-6">
            <div className="text-xl font-normal text-gray-700 mb-4">{section.purpose}</div>
            {/* Feature summary block */}
            <div className="rounded-xl bg-gray-50 px-5 py-4 mb-6 flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="bg-blue-100 text-blue-600 rounded-lg p-2 flex items-center justify-center">
                  {/* Placeholder for feature icon */}
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#e0e7ff"/><path d="M7 12h10M12 7v10" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
              </div>
              <div>
                <div className="font-semibold text-base text-gray-900 mb-1">{section.elements?.[0] || 'Feature Block'}</div>
                <div className="text-xs text-gray-500">
                  {section.style?.fonts && <span>Fonts: {section.style.fonts}</span>}
                  {section.style?.fonts && section.style?.colors && <span> • </span>}
                  {section.style?.colors && <span>Colors: {section.style.colors}</span>}
                </div>
              </div>
            </div>
            <hr className="my-4 border-gray-200" />
            <div className="mb-2">
              <span className="font-bold text-gray-700">Layouts:</span> <span className="text-gray-700">{section.style?.layout}</span>
            </div>
            <div className="mb-2">
              <span className="font-bold text-gray-700">Interactions:</span> <span className="text-gray-700">{section.style?.interactions}</span>
            </div>
            <div className="mb-4">
              <span className="font-bold text-gray-700">Mobile:</span> <span className="text-gray-700">{section.mobile_behavior}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                className="rounded-full px-6 font-semibold"
                variant={componentStatuses?.[section.name || idx] === 'rejected' ? 'default' : 'outline'}
                onClick={() => handleStatusChange(section, 'rejected')}
              >
                Reject
              </Button>
              <Button
                size="sm"
                className="rounded-full px-6 font-semibold"
                variant={componentStatuses?.[section.name || idx] === 'improved' ? 'default' : 'outline'}
                onClick={() => handleStatusChange(section, 'improved')}
              >
                Improve
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 