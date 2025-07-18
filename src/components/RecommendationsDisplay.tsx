import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useContext } from 'react';
import { UITestModeContext } from '../App';

interface Paper {
  title: string;
  authors?: string[];
  year?: number;
  url: string;
  relevance?: string;
}

interface RecommendationsDisplayProps {
  recommendations: string[];
  papers: Paper[];
}

export function RecommendationsDisplay({
  recommendations,
  papers,
}: RecommendationsDisplayProps) {
  const uiTest = useContext(UITestModeContext).uiTest;

  return (
    <div style={{ border: undefined, padding: 16, borderRadius: 8 }}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Research Papers</CardTitle>
            <CardDescription>
              Scientific papers supporting these recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {papers.map((paper, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">{paper.title}</h4>
                    {paper.authors && paper.year && (
                    <p className="text-sm text-muted-foreground">
                        {paper.authors.join(', ')} ({paper.year})
                      </p>
                    )}
                  {paper.relevance && (
                    <p className="text-sm">{paper.relevance}</p>
                    )}
                  <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      Read Paper
                    </a>
                    {index < papers.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 