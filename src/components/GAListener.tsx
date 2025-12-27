"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { pageview } from "@/lib/ga";

export default function GAListener() {
    const pathname = usePathname();

    useEffect(() => {
        pageview(pathname);
    }, [pathname]);

    return null;
}
