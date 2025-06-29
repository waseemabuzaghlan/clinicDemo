'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { login } from '@/lib/auth';

interface ValidationErrors {
  UserName?: string[];
  Password?: string[];
}

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ userName: '', password: '' });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors({});

    try {
      const data = await login(credentials.userName, credentials.password);

      toast({
        title: "Success",
        description: "Successfully signed in",
      });

      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.response?.status === 400 && error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        toast({
          title: "Validation Error",
          description: "Please check your input",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to sign in",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-xl p-8">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-full">
              <Stethoscope className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Welcome to BioClinic</h1>
              <p className="text-muted-foreground">Sign in to your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Username</Label>
              <Input
                id="userName"
                type="text"
                placeholder="Enter your username"
                value={credentials.userName}
                onChange={(e) => setCredentials({ ...credentials, userName: e.target.value })}
                required
                disabled={isLoading}
                className={`bg-background focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300 ${validationErrors.UserName ? 'border-red-500' : ''}`}
              />
              {validationErrors.UserName && (
                <p className="text-sm text-red-500">{validationErrors.UserName[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                disabled={isLoading}
                className={`bg-background focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300 ${validationErrors.Password ? 'border-red-500' : ''}`}
              />
              {validationErrors.Password && (
                <p className="text-sm text-red-500">{validationErrors.Password[0]}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
