---
name: add-component
description: Add a new React component to the Next.js frontend following existing patterns with TypeScript, Tailwind CSS v4, and Radix UI primitives.
argument-hint: "<ComponentName> <description>"
disable-model-invocation: true
---

# Add Frontend Component Skill

Create a new component: `$ARGUMENTS`

## File Location

- **Feature components**: `frontend/src/components/<ComponentName>.tsx`
- **UI primitives**: `frontend/src/components/ui/<ComponentName>.tsx`
- **Page-specific**: Co-locate in the page directory (e.g., `frontend/src/app/analysis/[symbol]/`)

## Component Pattern

Follow existing component style (TypeScript + Tailwind v4):

```tsx
'use client'; // Only if using hooks, state, or browser APIs

import { useState } from 'react';
// UI imports from local ui/ directory
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
// Icons from lucide-react
import { IconName } from 'lucide-react';
// Animations (if needed)
import { motion } from 'framer-motion';

interface ComponentNameProps {
  // Define props with TypeScript types
  title: string;
  data: SomeType;
  onAction?: () => void;
}

export default function ComponentName({ title, data, onAction }: ComponentNameProps) {
  const [state, setState] = useState<string>('');

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
}
```

## Available UI Primitives (`frontend/src/components/ui/`)

- `Card` (Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter)
- `Badge` (variant: default, secondary, destructive, outline)
- `Button`
- `Tabs` (Tabs, TabsList, TabsTrigger, TabsContent) - Radix UI based
- `Select` (Select, SelectTrigger, SelectValue, SelectContent, SelectItem)
- `Input`
- `Modal` (Dialog-based)
- `Alert` (Alert, AlertTitle, AlertDescription)
- `Tooltip` (Tooltip, TooltipTrigger, TooltipContent, TooltipProvider)
- `Skeleton` (for loading states)

## Styling Conventions

- **Dark theme**: Background `bg-gray-900/50`, borders `border-gray-800`, text `text-white`
- **Accent colors**: Green for positive (`text-green-400`), Red for negative (`text-red-400`), Blue for info (`text-blue-400`)
- **Responsive**: Use Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- **Animations**: Use Framer Motion for enter/exit animations
- **Spacing**: Follow existing patterns (p-4, p-6 for cards, gap-4 for grids)

## API Integration Pattern

```tsx
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

// Fetch data
const response = await axios.get(`${API_BASE}/api/endpoint/${param}`);
```

## Notification Pattern

```tsx
import toast from 'react-hot-toast';

toast.success('Operation completed');
toast.error('Something went wrong');
```

## Steps

1. Read existing similar components for reference
2. Create the component file with TypeScript types
3. Use existing UI primitives where possible
4. Add loading states with Skeleton components
5. Import and use the component in the target page
