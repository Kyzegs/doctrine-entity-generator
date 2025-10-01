'use client';

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout bypasses the sidebar by simply rendering children
  // The SidebarProvider in root layout will wrap this, but since we don't
  // use any Sidebar components here, it won't affect the layout
  return <div className="w-full min-h-screen">{children}</div>;
}

