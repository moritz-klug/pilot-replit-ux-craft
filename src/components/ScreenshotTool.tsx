import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Loader2, Download, Trash2, Eye, ServerCrash, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useInterval } from '../hooks/use-interval';

interface ScreenshotRequest {
  url: string;
  width: number;
  height: number;
  wait_time: number;
  full_page: boolean;
  element_selector?: string;
}

interface ScreenshotResponse {
  screenshot_id: string;
  filename: string;
  url: string;
  timestamp: string;
  file_path: string;
}

interface ScreenshotDisplay {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'error';
  url: string;
}

const ScreenshotTool: React.FC = () => {
  const [formData, setFormData] = useState<ScreenshotRequest>({
    url: 'https://www.apple.com',
    width: 1920,
    height: 1080,
    wait_time: 3,
    full_page: true,
    element_selector: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotDisplay[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('online');
  const { toast } = useToast();

  const SCREENSHOT_API_BASE = 'http://localhost:8001';

  useEffect(() => {
    const checkStatusAndLoad = async () => {
      try {
        const response = await fetch(`${SCREENSHOT_API_BASE}/health`);
        if (response.ok) {
          setServerStatus('online');
          loadScreenshots();
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        setServerStatus('offline');
      }
    };
    checkStatusAndLoad();
  }, []);

  const loadScreenshots = async () => {
    if (serverStatus === 'offline') return;
    try {
      const response = await fetch(`${SCREENSHOT_API_BASE}/screenshots`);
      if (response.ok) {
        const data = await response.json();
        const formattedScreenshots = data.screenshots.map((filename: string) => ({
          id: filename.split('_').pop()?.replace('.png', '') || '',
          filename: filename,
          status: 'completed',
          url: '',
        }));
        setScreenshots(formattedScreenshots.reverse());
      }
    } catch (error) {
      console.error('Failed to load screenshots:', error);
    }
  };

  useInterval(() => {
    if (pendingIds.length > 0 && serverStatus === 'online') {
      const poll = async () => {
        const response = await fetch(`${SCREENSHOT_API_BASE}/screenshots`);
        const data = await response.json();
        const completedFilenames: string[] = data.screenshots;

        const stillPending: string[] = [];
        let madeUpdate = false;

        for (const id of pendingIds) {
          const matchingFile = completedFilenames.find(name => name.includes(id));
          if (matchingFile) {
            setScreenshots(prev => prev.map(s => s.id === id ? { ...s, status: 'completed', filename: matchingFile } : s));
            madeUpdate = true;
          } else {
            stillPending.push(id);
          }
        }
        
        if (madeUpdate) {
            toast({
                title: "Screenshot Ready!",
                description: "A new screenshot has been successfully generated.",
            })
        }

        setPendingIds(stillPending);
      };
      poll();
    }
  }, 2000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (serverStatus === 'offline') {
      toast({ title: "Server Offline", description: "Cannot take screenshot.", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch(`${SCREENSHOT_API_BASE}/screenshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        const newScreenshot: ScreenshotDisplay = {
          id: result.screenshot_id,
          filename: 'Processing...',
          status: 'processing',
          url: formData.url,
        };

        setScreenshots(prev => [newScreenshot, ...prev]);
        setPendingIds(prev => [...prev, result.screenshot_id]);
        
        toast({
          title: "Request sent!",
          description: `Now generating a screenshot for ${formData.url}`,
        });
      } else {
        throw new Error('Failed to request screenshot');
      }
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Could not send request to the server.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteScreenshot = async (screenshot: ScreenshotDisplay) => {
    if (screenshot.status !== 'completed') return;
    try {
      await fetch(`${SCREENSHOT_API_BASE}/screenshot/${screenshot.id}`, { method: 'DELETE' });
      setScreenshots(prev => prev.filter(s => s.id !== screenshot.id));
      toast({ title: "Screenshot deleted" });
    } catch (error) {
      toast({ title: "Error deleting screenshot", variant: "destructive" });
    }
  };

  const handleInputChange = (field: keyof ScreenshotRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Screenshot Tool</h1>
          <p className="text-muted-foreground">
            Take screenshots of webpages with customizable settings
          </p>
        </div>
        <Badge variant={serverStatus === 'online' ? 'default' : 'destructive'}>
            {serverStatus === 'online' ? <CheckCircle className="h-4 w-4 mr-1"/> : <ServerCrash className="h-4 w-4 mr-1"/>}
            {serverStatus.charAt(0).toUpperCase() + serverStatus.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Take Screenshot</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input id="url" type="url" placeholder="https://example.com" value={formData.url} onChange={(e) => handleInputChange('url', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="width">Width (px)</Label><Input id="width" type="number" value={formData.width} onChange={(e) => handleInputChange('width', parseInt(e.target.value))} /></div>
                  <div className="space-y-2"><Label htmlFor="height">Height (px)</Label><Input id="height" type="number" value={formData.height} onChange={(e) => handleInputChange('height', parseInt(e.target.value))} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="wait_time">Wait Time (s)</Label><Input id="wait_time" type="number" value={formData.wait_time} onChange={(e) => handleInputChange('wait_time', parseInt(e.target.value))} /></div>
              <div className="space-y-2"><Label htmlFor="element_selector">Element Selector</Label><Input id="element_selector" placeholder="e.g. #my-id" value={formData.element_selector} onChange={(e) => handleInputChange('element_selector', e.target.value)} /></div>
              <div className="flex items-center space-x-2"><Switch id="full_page" checked={formData.full_page} onCheckedChange={(checked) => handleInputChange('full_page', checked)} /><Label htmlFor="full_page">Full page screenshot</Label></div>
              <Button type="submit" disabled={isSubmitting || serverStatus === 'offline'} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Take Screenshot
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Screenshots</CardTitle>
            <CardDescription>Your recent screenshots</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {screenshots.length > 0 ? (
              screenshots.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="truncate">
                    <p className="font-medium truncate" title={s.status === 'processing' ? s.url : s.filename}>
                      {s.status === 'processing' ? `Processing: ${s.url}` : s.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">ID: {s.id}</p>
                  </div>
                  {s.status === 'completed' ? (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => window.open(`${SCREENSHOT_API_BASE}/screenshot/${s.id}`, '_blank')}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteScreenshot(s)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No screenshots yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScreenshotTool; 