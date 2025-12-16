
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit } from "lucide-react";
import { ResistancePredictionTool } from "@/components/ai-tools/resistance-prediction-tool";
import { BayesianNetworkTool } from "@/components/ai-tools/bayesian-network-tool";

export function AITools() {
  return (
    <section id="ai-tools" className="mt-8 scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline text-2xl">
            <BrainCircuit />
            AI Prediction Tools
          </CardTitle>
          <CardDescription>
            Interact with the predictive models developed in this project. These tools use AI to forecast resistance based on genotypic data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="resistance-tool" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="resistance-tool">Evolutionary Resistance Predictor</TabsTrigger>
              <TabsTrigger value="bayesian-tool">Bayesian Network Modeler</TabsTrigger>
            </TabsList>
            <TabsContent value="resistance-tool">
              <ResistancePredictionTool />
            </TabsContent>
            <TabsContent value="bayesian-tool">
              <BayesianNetworkTool />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
