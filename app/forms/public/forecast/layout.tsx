import LayoutPublic from "@/layouts/public/public"

export default function LayoutBase({ children }: { children: React.ReactNode })
{
    return <LayoutPublic>{children}</LayoutPublic>
}
