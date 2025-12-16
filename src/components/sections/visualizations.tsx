"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const mutationFrequencyData = [
  { mutation: 'mecA(G246E)', frequency: 45 },
  { mutation: 'PBP2a(E447K)', frequency: 32 },
  { mutation: 'pvl(positive)', frequency: 28 },
  { mutation: 'agr(type-II)', frequency: 22 },
  { mutation: 'PBP2a(V311A)', frequency: 18 },
  { mutation: 'mecA(I112V)', frequency: 15 },
];

const trajectoryData = [
  { step: 0, probability: 0.05 },
  { step: 1, probability: 0.12 },
  { step: 2, probability: 0.25 },
  { step: 3, probability: 0.45 },
  { step: 4, probability: 0.68 },
  { step: 5, probability: 0.82 },
];

export function Visualizations() {
  return (
    <section id="visualizations" className="mt-8 scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline text-2xl">
            <BarChart3 />
            Interactive Data Visualization
          </CardTitle>
          <CardDescription>
            Explore visualizations of mutation patterns, evolutionary trajectories, and predicted resistance probabilities. (Note: Data shown is illustrative.)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mutation Frequencies</CardTitle>
              <CardDescription>Frequency of key mutations observed in the dataset.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-64 w-full">
                <ResponsiveContainer>
                    <BarChart data={mutationFrequencyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="mutation" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="frequency" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Evolutionary Trajectories</CardTitle>
              <CardDescription>Probabilistic path of mutation accumulation over time.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-64 w-full">
                <ResponsiveContainer>
                    <LineChart data={trajectoryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="step" label={{ value: 'Evolutionary Step', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Probability', angle: -90, position: 'insideLeft' }} />
                        <Tooltip content={<ChartTooltipContent />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="probability" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  );
}
