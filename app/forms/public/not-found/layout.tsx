import type { Metadata } from "next";
import LayoutPublic from "@/layouts/public/public";

export const metadata: Metadata =
{
    robots:
    {
        index: false,
        follow: false,
    },
};

export default async function LayoutBase({ children }: { children: React.ReactNode })
{
    return <LayoutPublic>{children}</LayoutPublic>;
}
