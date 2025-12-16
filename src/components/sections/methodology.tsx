
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskConical } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const originalMethodologySteps = [
  {
    value: "acquisition",
    title: "Data Acquisition",
    content: "Genomic sequences of MRSA isolates and corresponding antibiotic susceptibility metadata were collected from several public databases: NCBI Pathogen Detection, the Comprehensive Antibiotic Resistance Database (CARD), the Bacterial and Viral Bioinformatics Resource Center (BV-BRC), and PubMLST. This provided a diverse dataset encompassing various MRSA lineages and resistance profiles."
  },
  {
    value: "detection",
    title: "Mutation Detection",
    content: "A bioinformatics pipeline was developed to align the collected sequences to a reference S. aureus genome. Single Nucleotide Polymorphisms (SNPs) and other genetic variations were identified, with a primary focus on the mecA gene, the PBP2a gene it encodes, and known accessory resistance loci. This step generated a comprehensive list of mutations for each isolate."
  },
  {
    value: "engineering",
    title: "Feature Engineering",
    content: "The raw mutation data was transformed into a structured feature set for machine learning. Features included the presence/absence of specific mutations, mutation frequencies across the dataset, and co-occurrence patterns between mutations. This process converted biological sequence data into a format suitable for computational modeling."
  },
  {
    value: "modeling",
    title: "Predictive Modeling",
    content: "Two primary modeling techniques were used: 1) Hidden Markov Models (HMMs) to map the evolutionary trajectories of resistance genes, identifying common pathways of mutation accumulation under simulated antibiotic pressure. 2) Bayesian Networks to model the probabilistic relationships between the identified mutations (genotype) and the observed antibiotic resistance (phenotype) for vancomycin and ceftaroline. The combination of these models allows for a probabilistic forecast of resistance."
  }
];

const originalDataSourcesContent = `This project exclusively utilized anonymized, publicly available data from established scientific repositories. All data sources are compliant with international standards for open scientific data sharing. The primary databases used were:`;
const originalDataSourcesList = [
    "NCBI Pathogen Detection: For S. aureus genomic sequences and isolate metadata.",
    "CARD (Comprehensive Antibiotic Resistance Database): For reference resistance gene sequences and annotations.",
    "BV-BRC (Bacterial and Viral Bioinformatics Resource Center): For curated datasets and comparative genomics tools.",
    "PubMLST (Public databases for molecular typing and microbial genome diversity): For S. aureus strain typing and population structure analysis."
];
const originalDataSourcesCompliance = `As no human subjects, animal subjects, or personally identifiable information were involved, and all data was pre-existing and public, this research did not require Institutional Review Board (IRB) or Scientific Review Committee (SRC) pre-approval beyond standard safety checks for computational projects.`;


export function Methodology() {
  return (
    <section id="methodology" className="mt-8 scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline text-2xl">
            <FlaskConical />
            Methodology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="acquisition" className="w-full">
            <ScrollArea>
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                {originalMethodologySteps.map(step => (
                  <TabsTrigger key={step.value} value={step.value}>{step.title}</TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            {originalMethodologySteps.map(step => (
              <TabsContent key={step.value} value={step.value}>
                <Card className="mt-2">
                  <CardContent className="p-6 text-base">
                    {step.content}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <section id="data-sources" className="mt-8 scroll-mt-20">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Data Sources and Ethical Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base">
            <p>{originalDataSourcesContent}</p>
            <ul className="list-disc space-y-2 pl-6">
              {originalDataSourcesList.map((item, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              ))}
            </ul>
            <p>{originalDataSourcesCompliance}</p>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
