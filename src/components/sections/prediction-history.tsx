
'use client';

import { useEffect, useState } from 'react';
import { History, Bot, Lightbulb, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '../ui/chart';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';

export function PredictionHistory() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/predictions');
        const json = await res.json();
        if (!cancelled) {
          setPredictions(json.predictions || []);
        }
      } catch (e) {
        if (!cancelled) setPredictions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const renderInputs = (input: any) => {
    // Handle both string and array inputs for mutations
    const formatValue = (value: any) => {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return String(value);
    }
    
    return (
      <div className="text-sm space-y-1 ml-4 rounded-md bg-muted/50 p-3">
        {Object.entries(input)
          .filter(([key, value]) => value && key !== 'createdAt' && key !== 'output' && key !== 'type' && key !== 'id')
          .map(([key, value]) => (
          <div key={key} className="flex">
            <strong className="capitalize w-48 shrink-0">{key.replace(/([A-Z])/g, ' $1')}:</strong> 
            <span className="font-mono text-xs">{formatValue(value)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <section id="prediction-history" className="mt-8 scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline text-2xl">
            <History />
            Prediction History
          </CardTitle>
          <CardDescription>
            Review the 10 most recent predictions made by the AI models.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading prediction history...</p>}
          {!loading && (!predictions || predictions.length === 0) && (
            <p className="text-muted-foreground text-center py-4">No predictions have been made yet.</p>
          )}
          <Accordion type="single" collapsible className="w-full">
            {predictions?.map((prediction: any) => (
              <AccordionItem key={prediction.id} value={String(prediction.id)}>
                <AccordionTrigger>
                  <div className="flex w-full items-center justify-between pr-4 gap-4">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">
                        {prediction.type === 'bayesian' ? 'Bayesian Network Model' : 'Evolutionary Resistance Predictor'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {prediction.createdAt ? format(new Date(prediction.createdAt), 'PPP p') : 'Date unknown'}
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-sm font-mono">
                        {prediction.type === 'bayesian' && prediction.output.ceftarolineResistanceProbability ? (
                            <>
                                <span>Ceftaroline: <span className="font-bold">{(prediction.output.ceftarolineResistanceProbability * 100).toFixed(1)}%</span></span>
                                <span>Vancomycin: <span className="font-bold">{(prediction.output.vancomycinResistanceProbability * 100).toFixed(1)}%</span></span>
                                {typeof prediction.output.confidenceLevel === 'number' ? (
                                  <span>Confidence: <span className="font-bold">{(prediction.output.confidenceLevel * 100).toFixed(1)}%</span></span>
                                ) : null}
                            </>
                        ) : (
                             <span>{(prediction.output.confidenceLevel * 100).toFixed(0)}% Confidence</span>
                        )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 p-2">
                     <h4 className="font-semibold">Inputs:</h4>
                      {renderInputs(prediction.input)}

                    <h4 className="font-semibold mt-4">AI Model Outputs:</h4>
                    <div className="ml-4 space-y-4 rounded-md bg-secondary p-4">
                        {prediction.type === 'bayesian' && prediction.output.ceftarolineResistanceProbability ? (
                            <div className="space-y-4">
                                <div>
                                    <Label>Vancomycin Resistance Probability</Label>
                                    <div className="flex items-center gap-2">
                                        <Progress value={prediction.output.vancomycinResistanceProbability * 100} className="w-full [&>div]:bg-chart-1" />
                                        <span className="font-mono text-sm font-semibold">{(prediction.output.vancomycinResistanceProbability * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div>
                                    <Label>Ceftaroline Resistance Probability</Label>
                                    <div className="flex items-center gap-2">
                                        <Progress value={prediction.output.ceftarolineResistanceProbability * 100} className="w-full [&>div]:bg-chart-2" />
                                        <span className="font-mono text-sm font-semibold">{(prediction.output.ceftarolineResistanceProbability * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                                {typeof prediction.output.confidenceLevel === 'number' ? (
                                  <div>
                                    <Label>Confidence Level</Label>
                                    <div className="flex items-center gap-2">
                                        <Progress value={prediction.output.confidenceLevel * 100} className="w-full [&>div]:bg-chart-3" />
                                        <span className="font-mono text-sm font-semibold">{(prediction.output.confidenceLevel * 100).toFixed(1)}%</span>
                                    </div>
                                  </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p><strong>Prediction:</strong> {prediction.output.resistancePrediction}</p>
                                <p><strong>Confidence:</strong> {(prediction.output.confidenceLevel * 100).toFixed(0)}%</p>
                            </div>
                        )}
                        
                        <div className="grid gap-6 md:grid-cols-2 pt-4">
                            {prediction.output.charts?.map((chart: any, chartIndex: number) => (
                            <div key={chartIndex} className="relative">
                                <h4 className="font-semibold text-center mb-2 text-sm">{chart.title}</h4>
                                <div className="absolute right-2 top-2 z-10 text-[11px] text-muted-foreground bg-background/80 px-1 rounded">
                                  Graph ID: {chart.id ?? 'N/A'}
                                </div>
                                <ChartContainer config={{}} className="h-60 w-full">
                                <ResponsiveContainer>
                                    {chart.title.includes('Contribution') ? (
                                      <PieChart>
                                        <Pie
                                          data={chart.data}
                                          dataKey="value"
                                          nameKey="name"
                                          cx="50%"
                                          cy="50%"
                                          outerRadius={80}
                                          label={({ name }) => (name.length > 12 ? name.slice(0, 11) + '…' : name)}
                                          labelLine={false}
                                        >
                                          {chart.data.map((_: any, i: number) => (
                                            <Cell key={`c-${i}`} fill={`hsl(var(--chart-${(i % 4) + 1}))`} />
                                          ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Legend verticalAlign="bottom" align="center" />
                                      </PieChart>
                                    ) : chart.title.includes('Co-occurrence') ? (
                                      <AreaChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tickMargin={8} height={60} label={{ value: 'Mutation / Feature', position: 'insideBottom', offset: -5 }} tickFormatter={(v: string) => (v.length > 12 ? v.slice(0, 11) + '…' : v)} />
                                        <YAxis domain={[0,1]} label={{ value: 'Co-occurrence Frequency Across Isolates', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip content={<ChartTooltipContent />} cursor={{ stroke: 'hsl(var(--muted))' }} />
                                        <Area type="monotone" dataKey="value" stroke={`hsl(var(--chart-${chartIndex + 1}))`} fill={`hsl(var(--chart-${chartIndex + 1}))`} />
                                      </AreaChart>
                                    ) : (
                                      <BarChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tickMargin={8} height={60} label={{ value: 'Mutation / Feature', position: 'insideBottom', offset: -5 }} tickFormatter={(v: string) => (v.length > 12 ? v.slice(0, 11) + '…' : v)} />
                                        <YAxis domain={[0,1]} label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                                        <Bar dataKey="value" fill={`hsl(var(--chart-${chartIndex + 1}))`} radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    )}
                                </ResponsiveContainer>
                                </ChartContainer>
                            </div>
                            ))}
                        </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
