
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { bayesianPredictionAction, BayesianPredictionState } from "@/app/actions";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, ChevronDown, Lightbulb, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

const initialState: BayesianPredictionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Modeling..." : <> <Zap className="mr-2" /> Model Probabilities</>}
    </Button>
  );
}

export function BayesianNetworkTool() {
  const [state, formAction] = useActionState(bayesianPredictionAction, initialState);
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
        title: "Modeling Error",
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
          <CardTitle>Bayesian Network Modeler</CardTitle>
          <CardDescription>
            Enter comma-separated mutation names for mecA and PBP2a to predict resistance probabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="mecAMutations">mecA Mutations</Label>
            <Input
              id="mecAMutations"
              name="mecAMutations"
              placeholder="e.g., G246E, I112V"
              required
              defaultValue={Array.isArray(state?.input?.mecAMutations) ? state.input.mecAMutations.join(', ') : ''}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="pbp2aMutations">PBP2a Mutations</Label>
            <Input
              id="pbp2aMutations"
              name="pbp2aMutations"
              placeholder="e.g., E447K, V311A"
              required
              defaultValue={Array.isArray(state?.input?.pbp2aMutations) ? state.input.pbp2aMutations.join(', ') : ''}
            />
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
                <Bot /> AI Model Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Vancomycin Resistance Probability</Label>
                <div className="flex items-center gap-2">
                    <Progress value={state.result.vancomycinResistanceProbability * 100} className="w-full [&>div]:bg-chart-1" />
                    <span className="font-mono text-sm">{(state.result.vancomycinResistanceProbability * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div>
                <Label>Ceftaroline Resistance Probability</Label>
                <div className="flex items-center gap-2">
                    <Progress value={state.result.ceftarolineResistanceProbability * 100} className="w-full [&>div]:bg-chart-2" />
                    <span className="font-mono text-sm">{(state.result.ceftarolineResistanceProbability * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div>
                <Label>Confidence Level</Label>
                <div className="flex items-center gap-2">
                    <Progress value={Math.max(0, Math.min(100, ((state.result.vancomycinResistanceProbability + state.result.ceftarolineResistanceProbability) / 2) * 100))} className="w-full [&>div]:bg-chart-3" />
                    <span className="font-mono text-sm">{Math.max(0, Math.min(100, ((state.result.vancomycinResistanceProbability + state.result.ceftarolineResistanceProbability) / 2) * 100)).toFixed(1)}%</span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                {state.result.charts?.map((chart, index) => (
                  <div key={index}>
                    <h4 className="font-semibold text-center mb-2">{chart.title}</h4>
                    <ChartContainer config={{}} className="h-64 w-full">
                      <ResponsiveContainer>
                        {chart.data.length <= 3 ? (
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
                        ) : (
                          <BarChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tickFormatter={truncateLabel} tickMargin={8} height={60} label={{ value: 'Antibiotic', position: 'insideBottom', offset: -5 }}/>
                            <YAxis domain={[0,1]} label={{ value: 'Probability (0–1)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                            <Bar dataKey="value" fill={`hsl(var(--chart-${index + 1}))`} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-lg">In-Depth Rationale</Label>
                <div className="text-sm font-medium mt-2 space-y-4">
                  {state.result.rationale.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
              
              <Collapsible open={isSolutionOpen} onOpenChange={setIsSolutionOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Lightbulb className="mr-2" />
                    {isSolutionOpen ? 'Hide' : 'Show'} Possible Solution
                    <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isSolutionOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-4 space-y-4 rounded-md border border-dashed border-accent p-4">
                    <h4 className="font-semibold">Actionable Plan & Solution</h4>
                    {state.result.solution.split('\n').filter(line => line.trim().length > 0).map((line, index) => {
                      const isHeader = /^\d+\./.test(line);
                      return <p key={index} className={isHeader ? "font-semibold mt-2" : "text-sm ml-4"}>{line.replace(/^\d+\.\s*/, '')}</p>
                    })}
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
