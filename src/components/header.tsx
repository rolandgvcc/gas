import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { IconSeparator, IconVercel } from '@/components/ui/icons'
import { ThemeToggle } from '@/components/theme-toggle'

export async function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-background">  
      <Link href="/" rel="nofollow" className="mr-2 font-bold">
        Grok App Studio
      </Link>
      <ThemeToggle className="mr-2" />
    </header>
  )
}
