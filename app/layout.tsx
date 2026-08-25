import type { Metadata } from "next";
import "./global.css";
import "./global-responsive.css";

export const metadata: Metadata = {
  title: "Weather",
  description: "",
  icons: {
    icon: { url: "/favicon.png", type: "image/png" },
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
