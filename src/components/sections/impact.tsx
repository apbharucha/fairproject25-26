
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartPulse } from "lucide-react";

const originalImpactContent = `The computational framework developed in this project has several potential real-world applications:`;
const originalImpactList = [
  "Genomic Surveillance: Public health labs can use this model to analyze MRSA genomes from surveillance programs, identifying high-risk strains before they become widespread.",
  "Clinical Decision Support: In a clinical setting, the model could provide clinicians with a risk score for resistance, guiding the choice of empiric antibiotic therapy while waiting for traditional culture results.",
  "Drug Development: Pharmaceutical researchers can use the evolutionary trajectories to understand resistance pathways, informing the design of new antibiotics that are less susceptible to existing resistance mechanisms."
];

const originalLimitationsContent = `It is crucial to acknowledge the limitations of this predictive model. As an in silico tool, it provides probabilistic forecasts, not definitive diagnoses. Predictions must be validated with phenotypic testing. The model's accuracy is dependent on the quality and diversity of the public data it was trained on, and it may not generalize perfectly to all MRSA lineages or novel resistance mechanisms.

**Responsible Use:** This tool is intended for research and surveillance purposes. It is not a substitute for clinical judgment or established laboratory diagnostics. Any application in a clinical context should be done under an approved research protocol and with the understanding that it is an assistive tool, not a standalone diagnostic. The model does not provide instructions for creating or inducing resistance and should be used solely for predictive and preventive analysis.`;


export function Impact() {
  return (
    <section id="impact" className="mt-8 scroll-mt-20">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline text-2xl">
              <HeartPulse />
              Applications and Real-World Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base">
            <p>{originalImpactContent}</p>
            <ul className="list-disc space-y-2 pl-6">
              {originalImpactList.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Limitations and Responsible Use Statement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base">
            {originalLimitationsContent.split('\n\n').map((paragraph, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
