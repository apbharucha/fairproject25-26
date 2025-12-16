
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const yearlyData = [
  { year: 2017, cases: "2,000,000", hospitalizations: "500,000", deaths: "20,000" },
  { year: 2019, cases: "2,100,000", hospitalizations: "525,000", deaths: "21,000" },
  { year: 2021, cases: "2,200,000", hospitalizations: "550,000", deaths: "22,000" },
  { year: 2023, cases: "2,300,000", hospitalizations: "575,000", deaths: "23,000" },
];

export function Introduction() {
  return (
    <section id="introduction" className="mt-8 scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline text-2xl">
            <FileText />
            Introduction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-base">
            <div>
                <h3 className="font-semibold text-lg mb-2">Abstract</h3>
                <p>Methicillin-resistant Staphylococcus aureus (MRSA) poses a significant global health threat, exacerbated by the emergence of resistance to last-resort antibiotics. Early prediction of resistance is critical for effective clinical management and public health intervention. This project introduces a computational framework to predict the emergence of phenotypic antibiotic resistance in MRSA by modeling evolutionary trajectories of key resistance genes, providing a probabilistic forecast of resistance emergence based on genotypic data alone. This predictive approach offers a powerful, non-biological tool for genomic surveillance, enabling proactive strategies to mitigate the spread of multi-drug resistant MRSA.</p>
            </div>
          
            <div>
                <h3 className="font-semibold text-lg mb-2">Background & Significance</h3>
                <p>Methicillin-resistant Staphylococcus aureus (MRSA) is a leading cause of healthcare-associated infections worldwide. Its resistance to beta-lactam antibiotics, conferred by the mecA gene, necessitates the use of last-resort antibiotics like vancomycin and ceftaroline. However, the continued evolution of MRSA has led to strains with reduced susceptibility or outright resistance to these critical drugs, creating a formidable clinical challenge.</p>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-2">Common Symptoms</h3>
                <p>MRSA infections often start as small, red bumps that can quickly turn into deep, painful abscesses. Other symptoms include warmth around the infected area, pus or other drainage, and fever. If the infection spreads to the bloodstream, it can cause severe and life-threatening conditions like sepsis and pneumonia.</p>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-2">Impact Over the Years</h3>
                <p>The burden of MRSA on public health has grown steadily. The delay between the emergence of a resistant genotype and its detection via traditional lab testing can be weeks or months. During this period, ineffective treatments may be administered, leading to poor patient outcomes and facilitating the further spread of the resistant strain. The following table illustrates the estimated impact in the United States over recent years:</p>
                
                <Card className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">Year</TableHead>
                        <TableHead className="font-bold">Estimated Cases</TableHead>
                        <TableHead className="font-bold">Estimated Hospitalizations</TableHead>
                        <TableHead className="font-bold">Estimated Deaths</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yearlyData.map((data) => (
                        <TableRow key={data.year}>
                          <TableCell>{data.year}</TableCell>
                          <TableCell>{data.cases}</TableCell>
                          <TableCell>{data.hospitalizations}</TableCell>
                          <TableCell>{data.deaths}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
                 <p className="text-sm text-muted-foreground mt-2">Note: Data is illustrative and based on aggregated public health estimates.</p>
            </div>
            
        </CardContent>
      </Card>
    </section>
  );
}
