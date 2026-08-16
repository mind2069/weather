import LayoutPublic from "@/layouts/public/public";
import NotFoundPage from "./forms/public/not-found/page";

export default async function NotFound()
{
    return (
        <LayoutPublic>
            <NotFoundPage />
        </LayoutPublic>
    );
}
