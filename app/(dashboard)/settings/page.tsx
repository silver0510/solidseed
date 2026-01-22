'use client';

import * as React from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth/useAuth';
import { getProfile, updateProfile } from '@/lib/auth/api';
import { toast } from 'sonner';

function getInitials(name: string | undefined | null, email: string | undefined | null): string {
  if (name) {
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'U';
}

export default function SettingsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [currentImage, setCurrentImage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = React.useState({
    fullName: '',
    phone: '',
  });

  // Load full profile data on mount
  React.useEffect(() => {
    async function loadProfile() {
      try {
        const response = await getProfile();
        if (response.success && response.user) {
          setFormData({
            fullName: response.user.full_name || '',
            phone: response.user.phone || '',
          });
          setCurrentImage(response.user.image);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    if (!authLoading) {
      loadProfile();
    }
  }, [authLoading]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await updateProfile({
        full_name: formData.fullName,
        phone: formData.phone,
        // Note: Avatar upload would need a separate file upload endpoint
        // For now, we'll store the base64 image (not recommended for production)
        image: avatarPreview || undefined,
      });

      if (response.success) {
        toast.success('Profile updated successfully');
        // Update the current image if we uploaded a new one
        if (avatarPreview) {
          setCurrentImage(avatarPreview);
          setAvatarPreview(null);
        }
        // Refresh the user data in auth context
        refreshUser?.();
      } else {
        toast.error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayImage = avatarPreview || currentImage;
  const initials = getInitials(formData.fullName || user?.full_name, user?.email);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and profile</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {displayImage ? (
                    <AvatarImage src={displayImage} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Profile Photo</p>
                <p className="text-sm text-muted-foreground">
                  Click the camera icon to upload a new photo
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
