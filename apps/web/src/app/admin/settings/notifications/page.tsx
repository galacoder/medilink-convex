"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import {
  notificationLabels,
  NotificationPreferences,
} from "~/features/notifications";

/**
 * Admin portal notification preferences page.
 *
 * WHY: Platform admins need to control which notification types they receive
 * (e.g., system announcements, dispute updates, equipment alerts).
 *
 * vi: "Trang cài đặt thông báo quản trị" / en: "Admin notification settings page"
 */
export default function AdminNotificationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {notificationLabels.preferences.vi}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {notificationLabels.preferencesDesc.vi}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {notificationLabels.preferences.vi}
          </CardTitle>
          <CardDescription>
            {notificationLabels.preferencesDesc.vi}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferences />
        </CardContent>
      </Card>
    </div>
  );
}
