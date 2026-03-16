"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, ChartBar as BarChart3, Mail, Shield, Flag, ArrowRight, Database } from "lucide-react";

const liveFeatures = [
  {
    title: "Flag Queue",
    description: "Review and act on content reports",
    icon: Flag,
    href: "/admin/flags",
  },
  {
    title: "User Management",
    description: "View, search, and moderate all users",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Data Requests",
    description: "Manage data export and account deletion requests",
    icon: Database,
    href: "/admin/data-requests",
  },
];

const comingFeatures = [
  {
    title: "Send Invitations",
    description: "Invite new installers and employers",
    icon: UserPlus,
  },
  {
    title: "Analytics",
    description: "Platform usage and growth metrics",
    icon: BarChart3,
  },
  {
    title: "Email Templates",
    description: "Manage notification templates",
    icon: Mail,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, moderation, and platform settings
        </p>
      </div>

      <Card className="border-brand bg-brand-muted">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand" />
            <CardTitle className="text-brand-muted-foreground">Admin Portal</CardTitle>
          </div>
          <CardDescription className="text-brand-muted-foreground">
            You have administrative access to the Film Installers Network
          </CardDescription>
        </CardHeader>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Moderation</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {liveFeatures.map((feature) => (
            <Link key={feature.title} href={feature.href}>
              <Card className="h-full hover:bg-accent transition-colors cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-muted">
                        <feature.icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{feature.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{feature.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            More admin features are being developed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comingFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-4 rounded-lg border bg-secondary"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <feature.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
