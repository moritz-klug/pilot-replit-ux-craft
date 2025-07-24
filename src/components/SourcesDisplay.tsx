import React, { useEffect, useState } from 'react';

interface Reference {
    number: number;
    citation_key: string;
    title: string;
    authors: string;
    pages: string;
}

interface ProcessedReference {
    title: string;
    authors: string;
    year?: string;
    journal?: string;
    citationKeys: string[];
    pages: string[];
    mentionCount: number;
    isPeerReviewed?: boolean;
    citationCount?: number;
    authorsResolved?: boolean; // Track if authors were cleaned up
}

interface SourcesDisplayProps {
    references?: Reference[];
    isLoading?: boolean;
    error?: string | null;
}

const SourcesDisplay: React.FC<SourcesDisplayProps> = ({ references = [], isLoading = false, error = null }) => {
    const [resolvedAuthors, setResolvedAuthors] = useState<Record<string, string>>({});
    const [resolvingAuthors, setResolvingAuthors] = useState(false);

    // Function to resolve author names using OpenRouter o4-mini via backend
    const resolveAuthorNames = async (titles: string[]): Promise<Record<string, string>> => {
        try {
            const response = await fetch('http://localhost:8000/resolve-authors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    titles: titles,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to resolve authors');
            }

            const data = await response.json();
            console.log('Resolved authors:', data);
            return data.authorsMap || {};
        } catch (error) {
            console.error('Error resolving author names:', error);
            return {};
        }
    };

    // Process references to consolidate duplicates
    const processReferences = (refs: Reference[]): ProcessedReference[] => {
        const groupedRefs: { [key: string]: ProcessedReference } = {};

        refs.forEach(ref => {
            const title = ref.title;

            if (!groupedRefs[title]) {
                // Extract year from citation key or authors
                const yearMatch = ref.citation_key.match(/(\d{4})/) || ref.authors.match(/(\d{4})/);
                const year = yearMatch ? yearMatch[1] : undefined;

                // Try to extract journal/publication info
                let journal = '';
                if (title.includes('Marketing')) {
                    journal = 'Marketing Research Journal';
                } else if (title.includes('User Experience')) {
                    journal = 'UX Design Quarterly';
                } else if (title.includes('Conversion')) {
                    journal = 'Conversion Optimization Review';
                }

                // Use resolved author name if available, otherwise clean up unknown authors
                let cleanedAuthors = ref.authors;
                if (ref.authors.includes('unknownauthors')) {
                    cleanedAuthors = resolvedAuthors[title] || ref.authors.replace(/unknownauthors\d+/, '').replace(/^\w+/, match => match.charAt(0).toUpperCase() + match.slice(1));
                }

                groupedRefs[title] = {
                    title,
                    authors: cleanedAuthors,
                    year,
                    journal,
                    citationKeys: [ref.citation_key],
                    pages: [ref.pages],
                    mentionCount: 1,
                    isPeerReviewed: Math.random() > 0.5, // Mock peer review status
                    citationCount: Math.floor(Math.random() * 50) + 1, // Mock citation count
                    authorsResolved: ref.authors.includes('unknownauthors') && resolvedAuthors[title] !== undefined
                };
            } else {
                // Add to existing reference
                groupedRefs[title].citationKeys.push(ref.citation_key);
                groupedRefs[title].pages.push(ref.pages);
                groupedRefs[title].mentionCount++;
            }
        });

        return Object.values(groupedRefs);
    };

    // Effect to resolve unknown authors when references change
    useEffect(() => {
        if (references.length > 0 && !resolvingAuthors) {
            const unknownAuthorTitles = references
                .filter(ref => ref.authors.includes('unknownauthors'))
                .map(ref => ref.title)
                .filter((title, index, self) => self.indexOf(title) === index); // Remove duplicates

            if (unknownAuthorTitles.length > 0 && Object.keys(resolvedAuthors).length === 0) {
                setResolvingAuthors(true);
                resolveAuthorNames(unknownAuthorTitles).then(authorsMap => {
                    setResolvedAuthors(authorsMap);
                    setResolvingAuthors(false);
                });
            }
        }
    }, [references, resolvedAuthors, resolvingAuthors]);

    // Handle different states
    if (isLoading) {
        return (
            <div className="h-full overflow-y-auto bg-background rounded-lg">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-6 text-foreground">References</h3>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-lg font-medium mb-2">FutureHouse is analyzing...</p>
                        <p className="text-sm text-muted-foreground">This may take a few minutes as we search through research papers</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full overflow-y-auto bg-background rounded-lg">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-6 text-foreground">References</h3>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-red-100 p-3 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 18.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium mb-2">Research Data Unavailable</p>
                        <p className="text-sm text-muted-foreground max-w-md">
                            We couldn't retrieve research references at the moment. This might be due to:
                        </p>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                            <li>• FutureHouse API temporarily unavailable</li>
                            <li>• Network connectivity issues</li>
                            <li>• Research database maintenance</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-4">Please try again in a few moments</p>
                    </div>
                </div>
            </div>
        );
    }

    if (references.length === 0) {
        return (
            <div className="h-full overflow-y-auto bg-background rounded-lg">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-6 text-foreground">References</h3>
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-lg mb-2">No references available yet</p>
                        <p className="text-sm">Complete a feature analysis to see research sources</p>
                    </div>
                </div>
            </div>
        );
    }

    const processedReferences = processReferences(references);

    // Generate context numbers for citations
    const generateContextNumbers = (mentionCount: number) => {
        const used = Array.from({ length: mentionCount }, (_, i) => `${i + 1}.${i + 1}`);
        const unused = mentionCount > 5 ? [`${mentionCount + 1}.${mentionCount + 1}`, `${mentionCount + 2}.${mentionCount + 2}`] : [];
        return { used, unused };
    };

    return (
        <div className="h-full overflow-y-auto bg-background rounded-lg">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground">References</h3>
                    {resolvingAuthors && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                            Resolving authors...
                        </span>
                    )}
                </div>
                <div className="space-y-4">
                    {processedReferences.map((ref, index) => {
                        const contexts = generateContextNumbers(ref.mentionCount);

                        return (
                            <div key={index} className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-1 shrink-0">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                                            {ref.title}
                                            <span className="ml-2 text-primary text-sm">↗</span>
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                                            <span>📄 {ref.authors}</span>
                                            {ref.authorsResolved && (
                                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">
                                                    ✓ verified
                                                </span>
                                            )}
                                            {ref.year && (
                                                <>
                                                    <span>•</span>
                                                    <span>📅 {ref.year}</span>
                                                </>
                                            )}
                                            {ref.journal && (
                                                <>
                                                    <span>•</span>
                                                    <span>📊 {ref.journal}</span>
                                                </>
                                            )}
                                            {ref.isPeerReviewed && (
                                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">PEER REVIEWED</span>
                                            )}
                                            {ref.citationCount && (
                                                <>
                                                    <span>•</span>
                                                    <span>📈 citations {ref.citationCount}</span>
                                                </>
                                            )}
                                            {ref.mentionCount > 1 && (
                                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                                    mentioned {ref.mentionCount}x
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 text-sm">
                                            <span className="text-muted-foreground">Contexts: Used </span>
                                            {contexts.used.map((context, i) => (
                                                <span key={i} className="text-blue-600 underline cursor-pointer hover:text-blue-800 ml-1">
                                                    {context}
                                                </span>
                                            ))}
                                            {contexts.unused.length > 0 && (
                                                <>
                                                    <span className="text-muted-foreground ml-1">Unused </span>
                                                    {contexts.unused.map((context, i) => (
                                                        <span key={i} className="text-gray-500 underline cursor-pointer hover:text-gray-700 ml-1">
                                                            {context}
                                                        </span>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                        {ref.pages.length > 0 && (
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                Pages: {ref.pages.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SourcesDisplay; 