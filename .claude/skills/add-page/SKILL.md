---
name: add-page
description: Add a new page to the Next.js frontend following the App Router pattern with proper metadata, layout integration, and navigation links.
argument-hint: "<page-route> <description>"
disable-model-invocation: true
---

# Add Page Skill

Create a new page: `$ARGUMENTS`

## Next.js App Router Structure

Pages live in `frontend/src/app/<route>/page.tsx`. The directory name becomes the URL path.

```
frontend/src/app/
├── page.tsx              # / (home)
├── layout.tsx            # Root layout (Header + Footer)
├── globals.css           # Global styles
├── about/page.tsx        # /about
├── disclaimer/page.tsx   # /disclaimer
├── how-it-works/page.tsx # /how-it-works
├── markets/page.tsx      # /markets
├── analysis/
│   ├── page.tsx          # /analysis
│   └── [symbol]/
│       ├── page.tsx      # /analysis/RELIANCE (SSR wrapper)
│       └── AnalysisClient.tsx  # Client component
```

## Page Template

### Static Page (no client-side state):
```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title | Trendova Hub',
  description: 'Page description for SEO',
};

export default function PageName() {
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Page Title</h1>
        {/* Page content */}
      </div>
    </div>
  );
}
```

### Dynamic Page (with client-side data fetching):
```tsx
// page.tsx (Server component - handles params)
import type { Metadata } from 'next';
import PageClient from './PageClient';

interface PageProps {
  params: Promise<{ param: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { param } = await params;
  return {
    title: `${param} | Trendova Hub`,
  };
}

export default async function Page({ params }: PageProps) {
  const { param } = await params;
  return <PageClient param={param} />;
}
```

```tsx
// PageClient.tsx (Client component - handles state & API)
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface PageClientProps {
  param: string;
}

export default function PageClient({ param }: PageClientProps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5002/api/endpoint/${param}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [param]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen pt-20">
      {/* Page content using data */}
    </div>
  );
}
```

## Navigation Integration

Add new page links in **`frontend/src/components/Header.tsx`**:

Look for the navigation links array and add the new route.

## Layout

The root layout (`frontend/src/app/layout.tsx`) automatically wraps all pages with:
- `<Header />` - Navigation bar
- `<Footer />` - Site footer
- `<Toaster />` - Toast notifications
- `<AnimatedBackground />` - Background effects

## Steps

1. Create `frontend/src/app/<route>/page.tsx`
2. If dynamic: create a separate client component
3. Add navigation link in `Header.tsx`
4. Set metadata (title, description) for SEO
5. Follow dark theme styling conventions
