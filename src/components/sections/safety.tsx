
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const originalContent = `This project is entirely computational (in silico) and involves no biological materials, hazardous chemicals, or regulated substances. All research was conducted on a standard personal computer using publicly available, anonymized genomic data.`;
const originalRiskAssessment = `### Risk Assessment:
- **Biological Risk:** None. No live organisms (including MRSA) were cultured or handled. The project is 100% computational.
- **Data Risk:** Minimal. The project uses public, non-identifiable data. There is no risk to human privacy.
- **Misuse Risk:** Low. The project predicts existing resistance pathways; it does not generate instructions for creating resistant organisms. The "Limitations and Responsible Use" statement clearly outlines its intended purpose as a predictive, observational tool.`;
const originalStatement = `### SRC/IRB Pre-Approval Statement:
**No SRC/IRB pre-approval was required for this project.**

This research qualifies as having no more than minimal risk. It does not involve human participants, vertebrate animals, potentially hazardous biological agents, or hazardous chemicals, activities, or devices. The work is confined to the analysis of pre-existing, publicly available, and de-identified data, which is exempt from IRB review. All procedures align with the safety guidelines for computational biology projects suitable for a pre-college science competition setting.`;


export function Safety() {
  const renderMarkdown = (text: string) => {
    const parts = text.split(/(\n- |\n### |\n\*\*)/);
    let isList = false;
    const elements = [];
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === '\n- ') {
            isList = true;
            continue;
        }
        if(parts[i] === '\n### ') {
            elements.push(<h3 className="font-semibold mt-4" key={`h3-${i}`}>{parts[++i].replace(/:\*\*/, '')}</h3>);
            isList = false;
            continue;
        }
        if(parts[i] === '\n**') {
             elements.push(<p className="font-medium text-primary" key={`p-${i}`}>{parts[++i].replace(/\*\*/, '')}</p>);
             isList = false;
             continue;
        }
        if (isList) {
            elements.push(<li key={`li-${i}`}>{parts[i]}</li>);
        } else if (parts[i].trim()) {
            elements.push(<p key={`p-${i}`}>{parts[i]}</p>);
        }
    }
    return isList ? <ul className="list-disc space-y-2 pl-6">{elements}</ul> : elements;
  };


  return (
    <section id="safety" className="mt-8 scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline text-2xl">
            <Shield />
            Risk Assessment and Safety Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base">
          {renderMarkdown(originalContent)}
          {renderMarkdown(originalRiskAssessment)}
          {renderMarkdown(originalStatement)}
        </CardContent>
      </Card>
    </section>
  );
}
