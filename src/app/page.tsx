
'use client';

import { useRef } from 'react';
import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";
import { MainContent } from "@/components/layout/main-content";
import { ProjectSummary } from "@/components/sections/project-summary";
import { Introduction } from "@/components/sections/introduction";
import { Methodology } from "@/components/sections/methodology";
import { AITools } from "@/components/sections/ai-tools";
import { Visualizations } from "@/components/sections/visualizations";
import { Impact } from "@/components/sections/impact";
import { Safety } from "@/components/sections/safety";
import { Logo } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { PredictionHistory } from '@/components/sections/prediction-history';

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);

  return (
      <SidebarProvider>
        <Sidebar
          className="border-sidebar-border"
          variant="sidebar"
          collapsible="icon"
        >
          <Card className="m-2 rounded-lg border-0 bg-sidebar-primary text-sidebar-primary-foreground shadow-none">
            <CardContent className="flex items-center gap-3 p-3">
              <Logo className="size-8 shrink-0" />
              <div className="flex flex-col">
                <span className="font-headline text-base font-semibold">
                  MRSA Forecaster
                </span>
              </div>
            </CardContent>
          </Card>
          <SidebarNav />
        </Sidebar>
        <SidebarInset>
          <Header />
          <MainContent ref={mainRef}>
            <div>
              <ProjectSummary />
              <Introduction />
              <Methodology />
              <AITools />
              <PredictionHistory />
              <Visualizations />
              <Impact />
              <Safety />
            </div>
          </MainContent>
        </SidebarInset>
      </SidebarProvider>
  );
}
