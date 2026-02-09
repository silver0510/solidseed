'use client';

import * as React from 'react';
import { Camera } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
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
  const { user, isLoading: authLoading, refreshUser, updateUserProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [currentImage, setCurrentImage] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select an image file (JPEG, PNG, WebP, or GIF)');
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
    setSelectedFile(file);

    // Upload immediately
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Profile photo uploaded successfully');
        // Add cache buster to force browser to reload the image
        const cacheBustedUrl = `${result.url}?t=${Date.now()}`;
        setCurrentImage(cacheBustedUrl);
        setAvatarPreview(null);
        setSelectedFile(null);
        // Immediately update the auth context with new image (with cache buster)
        updateUserProfile({ image: cacheBustedUrl });
      } else {
        toast.error(result.error || 'Failed to upload photo');
        setAvatarPreview(null);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
      setAvatarPreview(null);
      setSelectedFile(null);
    } finally {
      setIsUploadingAvatar(false);
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
        // Avatar is uploaded separately via /api/upload/avatar
      });

      if (response.success) {
        toast.success('Profile updated successfully');
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
      <div className="flex items-center justify-center min-h-loading">
        <Spinner className="size-8 text-primary" />
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
                    <AvatarImage key={displayImage} src={displayImage} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Spinner className="size-6 text-white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Profile Photo</p>
                <p className="text-sm text-muted-foreground">
                  {isUploadingAvatar ? 'Uploading...' : 'Click the camera icon to upload a new photo (max 5MB)'}
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
            {isSubmitting && <Spinner className="mr-2 size-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
