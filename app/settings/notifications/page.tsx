"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, Phone } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage how you receive notifications and updates
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose when and how you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                </div>
              </div>
              <Switch id="push-notifications" />
            </div>

            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
              </div>
              <Switch id="email-notifications" />
            </div>

            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="sms-notifications" className="font-medium">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get text message alerts</p>
                </div>
              </div>
              <Switch id="sms-notifications" />
            </div>

            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="phone-notifications" className="font-medium">Phone Calls</Label>
                  <p className="text-sm text-muted-foreground">Receive important calls</p>
                </div>
              </div>
              <Switch id="phone-notifications" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}