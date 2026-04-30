import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "童影订单台",
  description: "儿童毕业摄影业务的订单、账务与拍摄提醒后台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
