import Link from "next/link";

import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

/**
 * MediLink public landing page.
 *
 * WHY: Replaces the T3 Turbo demo template with real SPMET Healthcare School
 * branding and entry points for all user roles. Server Component — no auth
 * or Convex queries needed for this public marketing page.
 *
 * Content is bilingual: Vietnamese (primary) with English in comments.
 */

const hero = {
  title: { vi: "Quản lý Thiết bị Y tế", en: "Medical Equipment Management" },
  subtitle: {
    vi: "Hệ thống quản lý thiết bị y tế dành cho Trường SPMET — theo dõi, mượn trả và bảo trì thiết bị trong thời gian thực.",
    en: "Medical equipment management system for SPMET Healthcare School — track, borrow, return, and maintain equipment in real time.",
  },
  cta_signin: { vi: "Đăng nhập", en: "Sign In" },
  cta_signup: { vi: "Đăng ký", en: "Sign Up" },
};

const features = [
  {
    icon: "🏥",
    title: { vi: "Theo dõi Thiết bị", en: "Equipment Tracking" },
    description: {
      vi: "Quản lý toàn bộ kho thiết bị y tế — trạng thái, vị trí và lịch sử sử dụng theo thời gian thực.",
      en: "Manage the full inventory of medical equipment — status, location, and usage history in real time.",
    },
  },
  {
    icon: "📋",
    title: { vi: "Mượn & Trả thiết bị", en: "Borrow & Return" },
    description: {
      vi: "Quy trình mượn-trả thiết bị được số hóa: sinh viên gửi yêu cầu, nhân viên phê duyệt, theo dõi tình trạng trực tiếp.",
      en: "Digitized borrow-return workflow: students submit requests, staff approve, track status live.",
    },
  },
  {
    icon: "🔧",
    title: { vi: "Lịch Bảo trì", en: "Maintenance Scheduling" },
    description: {
      vi: "Lên lịch bảo trì định kỳ, nhận thông báo trước 7 ngày và 1 ngày, đảm bảo thiết bị luôn sẵn sàng.",
      en: "Schedule routine maintenance, receive alerts 7 days and 1 day before due dates, keep equipment ready.",
    },
  },
  {
    icon: "📊",
    title: { vi: "Báo cáo & Tuân thủ", en: "Reports & Compliance" },
    description: {
      vi: "Báo cáo hàng tháng về sử dụng thiết bị, hoàn thành bảo trì và các mục quá hạn theo chuẩn y tế Việt Nam.",
      en: "Monthly reports on equipment utilisation, maintenance completion, and overdue items per Vietnamese medical device regulations.",
    },
  },
];

const roles = [
  {
    role: { vi: "Sinh viên", en: "Student" },
    description: {
      vi: "Xem tình trạng thiết bị, gửi yêu cầu mượn và nộp báo cáo trả thiết bị.",
      en: "View equipment availability, submit borrow requests, and file return reports.",
    },
  },
  {
    role: { vi: "Nhân viên", en: "Staff" },
    description: {
      vi: "Phê duyệt yêu cầu mượn, quản lý kho thiết bị và lên lịch bảo trì.",
      en: "Approve borrow requests, manage equipment inventory, and schedule maintenance.",
    },
  },
  {
    role: { vi: "Quản trị viên", en: "Admin" },
    description: {
      vi: "Quản lý người dùng, cấu hình hệ thống và xuất báo cáo tuân thủ.",
      en: "Manage users, configure the system, and export compliance reports.",
    },
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">MediLink</span>
            <span className="text-muted-foreground text-sm">· SPMET</span>
          </div>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">{hero.cta_signin.vi}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">{hero.cta_signup.vi}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="from-background to-muted/30 bg-gradient-to-b py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            {hero.title.vi}
          </h1>
          {/* Medical Equipment Management */}
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">
            {hero.subtitle.vi}
          </p>
          {/* Bilingual subtitle: Medical equipment management system for SPMET Healthcare School */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-in">{hero.cta_signin.vi}</Link>
              {/* Sign In */}
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-up">{hero.cta_signup.vi}</Link>
              {/* Sign Up */}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Tính năng chính {/* Key Features */}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title.en}>
                <CardHeader>
                  <div className="mb-2 text-3xl">{f.icon}</div>
                  <CardTitle>{f.title.vi}</CardTitle>
                  {/* {f.title.en} */}
                </CardHeader>
                <CardContent>
                  <CardDescription>{f.description.vi}</CardDescription>
                  {/* {f.description.en} */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Dành cho ai? {/* Who is it for? */}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {roles.map((r) => (
              <Card key={r.role.en}>
                <CardHeader>
                  <CardTitle>{r.role.vi}</CardTitle>
                  {/* {r.role.en} */}
                </CardHeader>
                <CardContent>
                  <CardDescription>{r.description.vi}</CardDescription>
                  {/* {r.description.en} */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Bắt đầu ngay hôm nay {/* Get started today */}
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Đăng ký tài khoản để truy cập hệ thống quản lý thiết bị của trường
            SPMET.{" "}
            {/* Sign up to access SPMET school equipment management system. */}
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-up">{hero.cta_signup.vi}</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} MediLink · Trường SPMET ·{" "}
            {/* SPMET Healthcare School */}
            Thành phố Hồ Chí Minh {/* Ho Chi Minh City */}
          </p>
        </div>
      </footer>
    </main>
  );
}
