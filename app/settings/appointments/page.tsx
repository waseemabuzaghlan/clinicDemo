"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Settings, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AppointmentsSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    allowOnlineBooking: true,
    defaultSlotDuration: "30",
    maxAdvanceBookingDays: "30",
    minCancellationHours: "24",
    autoConfirmBookings: false,
    sendReminders: true,
    reminderHours: "24",
    allowWaitlist: true,
    bufferBetweenAppointments: "15",
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings saved",
        description: "Your appointment settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointment Settings</h1>
          <p className="text-muted-foreground">
            Configure how appointments are handled in your clinic
          </p>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Booking Settings</CardTitle>
                <CardDescription>Configure appointment booking rules</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Online Booking</Label>
                <p className="text-sm text-muted-foreground">
                  Allow patients to book appointments online
                </p>
              </div>
              <Switch
                checked={settings.allowOnlineBooking}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowOnlineBooking: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Default Appointment Duration</Label>
              <Select
                value={settings.defaultSlotDuration}
                onValueChange={(value) =>
                  setSettings({ ...settings, defaultSlotDuration: value })
                }
              >
                <SelectTrigger className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Maximum Advance Booking Days</Label>
              <Input
                type="number"
                value={settings.maxAdvanceBookingDays}
                onChange={(e) =>
                  setSettings({ ...settings, maxAdvanceBookingDays: e.target.value })
                }
                className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-green-500/15 focus:border-green-300/70 focus:shadow-lg focus:shadow-green-500/8 backdrop-blur-sm transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Cancellation Notice (Hours)</Label>
              <Input
                type="number"
                value={settings.minCancellationHours}
                onChange={(e) =>
                  setSettings({ ...settings, minCancellationHours: e.target.value })
                }
                className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/15 focus:border-purple-300/70 focus:shadow-lg focus:shadow-purple-500/8 backdrop-blur-sm transition-all duration-300"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Additional Settings</CardTitle>
                <CardDescription>Configure other appointment features</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-confirm Bookings</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically confirm new appointments
                </p>
              </div>
              <Switch
                checked={settings.autoConfirmBookings}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoConfirmBookings: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send appointment reminders to patients
                </p>
              </div>
              <Switch
                checked={settings.sendReminders}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, sendReminders: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Reminder Hours Before Appointment</Label>
              <Input
                type="number"
                value={settings.reminderHours}
                onChange={(e) =>
                  setSettings({ ...settings, reminderHours: e.target.value })
                }
                disabled={!settings.sendReminders}
                className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/15 focus:border-orange-300/70 focus:shadow-lg focus:shadow-orange-500/8 backdrop-blur-sm transition-all duration-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Waitlist</Label>
                <p className="text-sm text-muted-foreground">
                  Enable waitlist for fully booked slots
                </p>
              </div>
              <Switch
                checked={settings.allowWaitlist}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowWaitlist: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Buffer Between Appointments (Minutes)</Label>
              <Input
                type="number"
                value={settings.bufferBetweenAppointments}
                onChange={(e) =>
                  setSettings({ ...settings, bufferBetweenAppointments: e.target.value })
                }
                className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-red-500/15 focus:border-red-300/70 focus:shadow-lg focus:shadow-red-500/8 backdrop-blur-sm transition-all duration-300"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}