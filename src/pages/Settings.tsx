import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Mail, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Settings() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    mobile_number: profile?.mobile_number || ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    order_updates: true,
    marketing_emails: false
  });

  const [systemSettings, setSystemSettings] = useState({
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    language: 'en',
    date_format: 'DD/MM/YYYY',
    items_per_page: '20',
    dark_mode: false,
    auto_refresh: true
  });

  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        mobile_number: profile.mobile_number || ''
      });
    }
  }, [profile]);

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setSettingsId(data.id);
        setNotificationSettings({
          email_notifications: data.notification_email,
          sms_notifications: data.notification_sms,
          push_notifications: data.notification_push,
          order_updates: data.notification_order_updates,
          marketing_emails: data.notification_marketing
        });
        setSystemSettings({
          timezone: data.timezone,
          currency: data.currency,
          language: data.language,
          date_format: data.date_format,
          items_per_page: String(data.items_per_page),
          dark_mode: data.dark_mode,
          auto_refresh: data.auto_refresh
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const settingsData = {
        user_id: user.id,
        notification_email: notificationSettings.email_notifications,
        notification_sms: notificationSettings.sms_notifications,
        notification_push: notificationSettings.push_notifications,
        notification_order_updates: notificationSettings.order_updates,
        notification_marketing: notificationSettings.marketing_emails
      };

      if (settingsId) {
        const { error } = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('id', settingsId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('user_settings')
          .insert([settingsData])
          .select()
          .single();

        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      toast.success('Notification preferences saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const saveSystemSettings = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const settingsData = {
        user_id: user.id,
        timezone: systemSettings.timezone,
        currency: systemSettings.currency,
        language: systemSettings.language,
        date_format: systemSettings.date_format,
        items_per_page: parseInt(systemSettings.items_per_page),
        dark_mode: systemSettings.dark_mode,
        auto_refresh: systemSettings.auto_refresh
      };

      if (settingsId) {
        const { error } = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('id', settingsId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('user_settings')
          .insert([settingsData])
          .select()
          .single();

        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      toast.success('System settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name,
          mobile_number: profileData.mobile_number
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database }
  ];

  const timezoneOptions = [
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' }
  ];

  const currencyOptions = [
    { value: 'INR', label: 'Indian Rupee (₹)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'te', label: 'Telugu' },
    { value: 'ta', label: 'Tamil' }
  ];

  const itemsPerPageOptions = [
    { value: '10', label: '10 items' },
    { value: '20', label: '20 items' },
    { value: '50', label: '50 items' },
    { value: '100', label: '100 items' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-none first:rounded-t-lg last:rounded-b-lg ${
                        activeTab === tab.id
                          ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="h-20 w-20 rounded-full bg-indigo-500 flex items-center justify-center">
                      <User className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{profile?.full_name || 'Admin User'}</h3>
                      <p className="text-gray-500">{profile?.email}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Change Avatar
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={profileData.full_name}
                      onChange={(value) => setProfileData({...profileData, full_name: value})}
                    />
                    
                    <Input
                      label="Email Address"
                      type="email"
                      value={profileData.email}
                      onChange={(value) => setProfileData({...profileData, email: value})}
                    />
                    
                    <Input
                      label="Mobile Number"
                      type="tel"
                      value={profileData.mobile_number}
                      onChange={(value) => setProfileData({...profileData, mobile_number: value})}
                    />
                    
                    <div className="flex items-end">
                      <Button onClick={updateProfile} disabled={saving}>
                        {saving ? 'Updating...' : 'Update Profile'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Password</h3>
                    <div className="space-y-4">
                      <Input
                        label="Current Password"
                        type="password"
                        value=""
                        onChange={() => {}}
                      />
                      <Input
                        label="New Password"
                        type="password"
                        value=""
                        onChange={() => {}}
                      />
                      <Input
                        label="Confirm New Password"
                        type="password"
                        value=""
                        onChange={() => {}}
                      />
                      <Button>Change Password</Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">SMS Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-gray-500">Chrome on Windows • Active now</p>
                        </div>
                        <Badge variant="success">Current</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle>System Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Timezone"
                      value={systemSettings.timezone}
                      onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
                      options={timezoneOptions}
                    />
                    
                    <Select
                      label="Currency"
                      value={systemSettings.currency}
                      onChange={(e) => setSystemSettings({...systemSettings, currency: e.target.value})}
                      options={currencyOptions}
                    />
                    
                    <Select
                      label="Language"
                      value={systemSettings.language}
                      onChange={(e) => setSystemSettings({...systemSettings, language: e.target.value})}
                      options={languageOptions}
                    />
                    
                    <Input
                      label="Date Format"
                      value={systemSettings.date_format}
                      onChange={(value) => setSystemSettings({...systemSettings, date_format: value})}
                    />
                    
                    <Select
                      label="Items Per Page"
                      value={systemSettings.items_per_page}
                      onChange={(e) => setSystemSettings({...systemSettings, items_per_page: e.target.value})}
                      options={itemsPerPageOptions}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Application Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Dark Mode</p>
                          <p className="text-sm text-gray-500">Switch to dark theme</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.dark_mode}
                            onChange={(e) => setSystemSettings({...systemSettings, dark_mode: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Auto-refresh Data</p>
                          <p className="text-sm text-gray-500">Automatically refresh dashboard data</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.auto_refresh}
                            onChange={(e) => setSystemSettings({...systemSettings, auto_refresh: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <Button onClick={saveSystemSettings} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}