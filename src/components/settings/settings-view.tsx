'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/page-header';
import { useSession } from '@/hooks/use-session';
import { useUrlState } from '@/hooks/use-url-state';
import { ProfileForm } from './profile-form';
import { DeleteAccountCard, EmailForm, PasswordForm } from './account-forms';
import { SessionsCard, TokensCard } from './sessions-card';
import { PreferencesCard } from './preferences-card';

const TABS = ['profile', 'account', 'security', 'preferences'] as const;

export function SettingsView() {
  const t = useTranslations('settings');
  const { user } = useSession();
  const { values, set } = useUrlState();
  const tab = TABS.includes(values.tab as (typeof TABS)[number]) ? values.tab : 'profile';
  if (!user) return null;

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />
      <Tabs value={tab} onValueChange={(v) => set({ tab: v === 'profile' ? null : v })}>
        <TabsList className="mb-4">
          {TABS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(`tabs.${key}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="profile" className="grid gap-6">
          <ProfileForm user={user} />
        </TabsContent>
        <TabsContent value="account" className="grid gap-6">
          <EmailForm user={user} />
          <DeleteAccountCard />
        </TabsContent>
        <TabsContent value="security" className="grid gap-6">
          <PasswordForm />
          <SessionsCard />
          <TokensCard />
        </TabsContent>
        <TabsContent value="preferences" className="grid gap-6">
          <PreferencesCard user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
