export interface ParsedRecommendation {
    id: string;
    title: string;
    description: string;
    principle: string;
    research: string;
    beforeMockupUrl: string;
    afterMockupUrl: string;
    impact: 'high' | 'medium' | 'low';
    category: 'accessibility' | 'usability' | 'visual' | 'interaction';
}

export function parseRecommendationString(recString: string, id: number): ParsedRecommendation {
    // Assume the first sentence is the title, the rest is the description
    const [title, ...descArr] = recString.split('.');
    return {
        id: id.toString(),
        title: title.trim(),
        description: descArr.join('.').trim(),
        principle: '', // To be filled by LLM or further parsing
        research: '',  // To be filled by LLM or further parsing
        beforeMockupUrl: '',
        afterMockupUrl: '',
        impact: 'medium', // Placeholder
        category: 'usability' // Placeholder
    };
} 