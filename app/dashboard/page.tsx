"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Link2, Users } from "lucide-react";
import Link from "next/link";
import { UpcomingMeetings } from "@/components/upcoming-meetings";
import { DashboardCalendar } from "@/components/dashboard-calendar";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type DashboardStats = {
  totalMeetings: number;
  activeLinks: number;
  connectedCalendars: number;
  schedulingWindows: number;
}

type HubspotStatus = {
  isConnected: boolean;
  account: {
    createdAt: string;
    updatedAt: string;
  } | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hubspotStatus, setHubspotStatus] = useState<HubspotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, hubspotResponse] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/integrations/hubspot/status')
        ]);
        
        const statsData = await statsResponse.json();
        const hubspotData = await hubspotResponse.json();
        
        setStats(statsData);
        setHubspotStatus(hubspotData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your meetings and scheduling links
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Meetings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalMeetings || 0}</div>
                <p className="text-xs text-muted-foreground">Total scheduled meetings</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeLinks || 0}</div>
                <p className="text-xs text-muted-foreground">Active scheduling links</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Connected Calendars
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.connectedCalendars || 0}</div>
                <p className="text-xs text-muted-foreground">Connected calendar accounts</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Scheduling Windows
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.schedulingWindows || 0}</div>
                <p className="text-xs text-muted-foreground">Active scheduling windows</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your calendar for today</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardCalendar />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>
              Your scheduled meetings for the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingMeetings />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/links/create">
                <Button className="w-full" variant="outline">
                  <Link2 className="mr-2 h-4 w-4" />
                  Create Link
                </Button>
              </Link>
              <Link href="/dashboard/windows">
                <Button className="w-full" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Set Availability
                </Button>
              </Link>
              <Link href="/dashboard/calendars">
                <Button className="w-full" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Connect Calendar
                </Button>
              </Link>
              <Link href="/dashboard/integrations">
                <Button className="w-full" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : hubspotStatus?.isConnected ? (
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                      Hubspot
                    </div>
                  ) : (
                    "Connect Hubspot"
                  )}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
