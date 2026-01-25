import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { loginFormSchema, type LoginFormData } from '@/utils/validation';
import { getErrorMessage } from '@/types/errors';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState<LoginFormData>({
    token: '',
    vaultUrl: 'http://127.0.0.1:8200',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

  const handleChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const result = loginFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof LoginFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await login(formData.token, formData.vaultUrl);
      toast.success('Authenticated successfully');
      navigate('/secrets');
    } catch (err) {
      toast.error('Authentication failed', getErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-vault-purple">
            <svg
              className="h-10 w-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L4 6v8l8 8 8-8V6l-8-4z" />
              <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Vault AI</CardTitle>
          <CardDescription>
            Enter your Vault token and server URL to authenticate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Vault URL"
              type="url"
              value={formData.vaultUrl}
              onChange={handleChange('vaultUrl')}
              placeholder="http://127.0.0.1:8200"
              error={errors.vaultUrl}
              disabled={isLoading}
            />
            <Input
              label="Token"
              type="password"
              value={formData.token}
              onChange={handleChange('token')}
              placeholder="hvs.xxxxx"
              error={errors.token}
              disabled={isLoading}
              hint="Your Vault authentication token"
            />

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
            >
              Sign in to Vault
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
