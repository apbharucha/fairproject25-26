
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  BrainCircuit,
  Database,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Shield,
  FlaskConical,
  History,
} from "lucide-react";

const menuItems = [
  { href: "#summary", label: "Project Summary", icon: LayoutDashboard },
  { href: "#introduction", label: "Introduction", icon: FileText },
  { href: "#methodology", label: "Methodology", icon: FlaskConical },
  { href: "#data-sources", label: "Data Sources", icon: Database },
  { href: "#ai-tools", label: "AI Prediction Tools", icon: BrainCircuit },
  { href: "#prediction-history", label: "Prediction History", icon: History },
  { href: "#visualizations", label: "Visualizations", icon: BarChart3 },
  { href: "#impact", label: "Impact & Limitations", icon: HeartPulse },
  { href: "#safety", label: "Safety & Ethics", icon: Shield },
];

export function SidebarNav() {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          onClick={() => setOpenMobile(false)}
          tooltip={item.label}
        >
            <Link href={pathname + item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
