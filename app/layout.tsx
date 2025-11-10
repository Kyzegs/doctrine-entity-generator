import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Doctrine Entity Generator",
    template: "%s | Doctrine Entity Generator",
  },
  description: "Generate Doctrine XML mappings and PHP entities from SQL CREATE TABLE statements. Free online tool for converting database schemas to Doctrine ORM entities with customizable options.",
  keywords: [
    "doctrine",
    "doctrine orm",
    "php entity generator",
    "sql to doctrine",
    "create table to entity",
    "doctrine xml mapping",
    "php entity class",
    "database schema converter",
    "orm entity generator",
    "doctrine generator",
    "php doctrine",
    "symfony doctrine",
  ],
  authors: [{ name: 'Sebastiaan "Kyzegs" Zegers' }],
  creator: 'Sebastiaan "Kyzegs" Zegers',
  publisher: 'Sebastiaan "Kyzegs" Zegers',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://entity-generator.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Doctrine Entity Generator - Convert SQL to Doctrine Entities",
    description: "Generate Doctrine XML mappings and PHP entities from SQL CREATE TABLE statements. Free online tool for converting database schemas to Doctrine ORM entities.",
    siteName: "Doctrine Entity Generator",
  },
  twitter: {
    card: "summary",
    title: "Doctrine Entity Generator - Convert SQL to Doctrine Entities",
    description: "Generate Doctrine XML mappings and PHP entities from SQL CREATE TABLE statements. Free online tool for converting database schemas to Doctrine ORM entities.",
    creator: "@doctrine",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "developer tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://entity-generator.vercel.app";
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Doctrine Entity Generator",
    "description": "Generate Doctrine XML mappings and PHP entities from SQL CREATE TABLE statements. Free online tool for converting database schemas to Doctrine ORM entities.",
    "url": siteUrl,
    "author": {
      "@type": "Person",
      "name": 'Sebastiaan "Kyzegs" Zegers',
      "email": "kyzegs@gmail.com"
    },
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Convert SQL CREATE TABLE to Doctrine XML mappings",
      "Generate PHP entity classes",
      "Support for multiple database dialects",
      "Customizable entity options",
      "Relationship management",
      "Trait support"
    ],
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            {children}
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
