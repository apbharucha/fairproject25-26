
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resistancePredictionAction, ResistancePredictionState } from "@/app/actions";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, ChevronDown, Lightbulb, Zap } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";

const initialState: ResistancePredictionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Predicting..." : <> <Zap className="mr-2" /> Predict Resistance Emergence</>}
    </Button>
  );
}

export function ResistancePredictionTool() {
  const [state, formAction] = useActionState(resistancePredictionAction, initialState);
  const { toast } = useToast();
  const [isSolutionOpen, setIsSolutionOpen] = useState(false);

  function truncateLabel(s: string) {
    const max = 12;
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Prediction Error",
        description: state.error,
      });
    }
    if (state?.result) {
      setIsSolutionOpen(false);
    }
  }, [state, toast]);

  return (
    <Card className="mt-2">
      <form action={formAction}>
        <CardHeader>
          <CardTitle>Evolutionary Resistance Predictor</CardTitle>
          <CardDescription>
            Input observed mutation patterns and evolutionary data to predict the likelihood of resistance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="mutationPatterns">Mutation Patterns</Label>
            <Textarea
              id="mutationPatterns"
              name="mutationPatterns"
              placeholder="e.g., Co-occurrence of mecA(G246E) and PBP2a(V311A)..."
              required
              defaultValue={state?.input?.mutationPatterns}
            />
            <p className="text-sm text-muted-foreground">Describe observed mutation patterns in MRSA isolates.</p>
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="evolutionaryTrajectories">Evolutionary Trajectories</Label>
            <Textarea
              id="evolutionaryTrajectories"
              name="evolutionaryTrajectories"
              placeholder="e.g., Sequential acquisition: mecA -> PBP2a(T123C) -> pvl..."
              required
              defaultValue={state?.input?.evolutionaryTrajectories}
            />
            <p className="text-sm text-muted-foreground">Represent evolutionary paths as a sequence of mutations.</p>
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="existingKnowledge">Existing Knowledge (Optional)</Label>
            <Textarea
              id="existingKnowledge"
              name="existingKnowledge"
              placeholder="e.g., Known resistance mutations for vancomycin..."
              defaultValue={state?.input?.existingKnowledge}
            />
            <p className="text-sm text-muted-foreground">Add any known mutation-drug resistance links.</p>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>

      {state?.result && (
        <CardContent>
          <Card className="bg-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Bot /> AI Prediction Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Resistance Prediction Summary</Label>
                <p className="font-medium">{state.result.resistancePrediction}</p>
              </div>
              <div>
                <Label>Confidence Level</Label>
                <div className="flex items-center gap-2">
                    <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-accent h-2.5 rounded-full" style={{ width: `${state.result.confidenceLevel * 100}%` }}></div>
                    </div>
                    <span className="font-mono text-sm">{(state.result.confidenceLevel * 100).toFixed(0)}%</span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                {state.result.charts?.map((chart, index) => (
                  <div key={index}>
                    <h4 className="font-semibold text-center mb-2">{chart.title}</h4>
                    <ChartContainer config={{}} className="h-64 w-full">
                      <ResponsiveContainer>
                        {chart.title.includes('Contribution') ? (
                          <PieChart>
                            <Pie
                              data={chart.data}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              label={({ name }) => truncateLabel(name)}
                              labelLine={false}
                            >
                              {chart.data.map((_, i) => (
                                <Cell key={`c-${i}`} fill={`hsl(var(--chart-${(i % 4) + 1}))`} />
                              ))}
                            </Pie>
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend verticalAlign="bottom" align="center" />
                          </PieChart>
                        ) : chart.title.includes('Co-occurrence') ? (
                          <AreaChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tickFormatter={truncateLabel} tickMargin={8} height={60} label={{ value: 'Mutation / Feature', position: 'insideBottom', offset: -5 }} />
                            <YAxis domain={[0, 1]} label={{ value: 'Co-occurrence Frequency Across Isolates', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<ChartTooltipContent />} cursor={{ stroke: 'hsl(var(--muted))' }} />
                            <Area type="monotone" dataKey="value" stroke={`hsl(var(--chart-${index + 1}))`} fill={`hsl(var(--chart-${index + 1}))`} />
                          </AreaChart>
                        ) : (
                          <BarChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tickFormatter={truncateLabel} tickMargin={8} height={60} label={{ value: 'Mutation / Feature', position: 'insideBottom', offset: -5 }} />
                            <YAxis domain={[0, 1]} label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                            <Bar dataKey="value" fill={`hsl(var(--chart-${index + 1}))`} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                ))}
              </div>

              <Separator />

              <div>
                <Label className="text-lg">In-Depth Explanation</Label>
                <div className="text-sm font-medium mt-2 space-y-4">
                  {state.result.inDepthExplanation.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <Collapsible open={isSolutionOpen} onOpenChange={setIsSolutionOpen}>
                <CollapsibleTrigger asChild>
                   <Button variant="outline" className="w-full">
                    <Lightbulb className="mr-2" />
                    {isSolutionOpen ? 'Hide' : 'Show'} Suggested Interventions
                    <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isSolutionOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="mt-4 space-y-2 rounded-md border border-dashed border-accent p-4">
                    <h4 className="font-semibold">Actionable Interventions</h4>
                      {state.result.suggestedInterventions.split('\n').filter(line => line.trim().length > 0).map((intervention, index) => (
                        <p key={index} className="text-sm">{intervention}</p>
                      ))}
                    </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </CardContent>
      )}
    </Card>
  );
}
