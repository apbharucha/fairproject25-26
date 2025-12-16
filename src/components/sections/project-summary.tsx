
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

const originalTitle = `Predicting the Emergence of Antibiotic Resistance in MRSA Using Evolutionary Modeling`;
const originalQuestion = `Can computational modeling of mutation trajectories in MRSA resistance genes, specifically mecA and PBP2a, under selective pressure from vancomycin and ceftaroline, accurately predict the emergence of phenotypic antibiotic resistance before it becomes clinically observable?`;


export function ProjectSummary() {
  return (
    <section id="summary" className="scroll-mt-20">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline text-3xl">
              <LayoutDashboard className="size-8" />
               {originalTitle}
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid gap-6">
            <Card className="flex flex-col justify-center">
              <CardHeader>
                <CardDescription>Core Research Question</CardDescription>
                <CardTitle className="text-xl font-medium">
                  {originalQuestion}
                </CardTitle>
              </CardHeader>
            </Card>
        </div>
      </div>
    </section>
  );
}
