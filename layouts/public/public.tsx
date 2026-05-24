import type { ReactNode } from 'react'
import Header from '@/components/header/header'
import Footer from '@/components/footer/footer'

export default async function LayoutPublic({ children }: { children: ReactNode })
{
    return (
      <>
        <Header />
        {children}
        <Footer />
      </>
    )
}
