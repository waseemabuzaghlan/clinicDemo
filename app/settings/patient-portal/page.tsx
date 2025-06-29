'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

export default function PatientPortalSettings() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [settings, setSettings] = React.useState({
    allowOnlineBooking: false,
    allowCancelAppointments: false,
    allowRescheduleAppointments: false,
    allowViewMedicalRecords: false,
    requireEmailVerification: true,
    allowGuestBooking: false
  });
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Patient portal settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patient Portal Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure patient portal access and features
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="gap-2"
        >
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

      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
          <CardDescription>
            Manage patient portal access and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="allow-online-booking" className="flex flex-col space-y-1">
              <span>Allow Online Booking</span>
              <span className="font-normal text-sm text-muted-foreground">
                Enable patients to book appointments online
              </span>
            </Label>
            <Switch
              id="allow-online-booking"
              checked={settings.allowOnlineBooking}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, allowOnlineBooking: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="allow-cancel" className="flex flex-col space-y-1">
              <span>Allow Appointment Cancellation</span>
              <span className="font-normal text-sm text-muted-foreground">
                Enable patients to cancel their appointments
              </span>
            </Label>
            <Switch
              id="allow-cancel"
              checked={settings.allowCancelAppointments}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, allowCancelAppointments: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="allow-reschedule" className="flex flex-col space-y-1">
              <span>Allow Appointment Rescheduling</span>
              <span className="font-normal text-sm text-muted-foreground">
                Enable patients to reschedule their appointments
              </span>
            </Label>
            <Switch
              id="allow-reschedule"
              checked={settings.allowRescheduleAppointments}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, allowRescheduleAppointments: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="allow-medical-records" className="flex flex-col space-y-1">
              <span>Allow Medical Records Access</span>
              <span className="font-normal text-sm text-muted-foreground">
                Enable patients to view their medical records
              </span>
            </Label>
            <Switch
              id="allow-medical-records"
              checked={settings.allowViewMedicalRecords}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, allowViewMedicalRecords: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="require-email-verification" className="flex flex-col space-y-1">
              <span>Require Email Verification</span>
              <span className="font-normal text-sm text-muted-foreground">
                Require email verification before account activation
              </span>
            </Label>
            <Switch
              id="require-email-verification"
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, requireEmailVerification: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="allow-guest-booking" className="flex flex-col space-y-1">
              <span>Allow Guest Booking</span>
              <span className="font-normal text-sm text-muted-foreground">
                Enable appointment booking without registration
              </span>
            </Label>
            <Switch
              id="allow-guest-booking"
              checked={settings.allowGuestBooking}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, allowGuestBooking: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}