"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function LanguageSwitcher() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('common.language');

    const switchLocale = (newLocale: string) => {
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        router.refresh();
    };

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="fixed bottom-4 right-16 z-50 size-9 rounded-full shadow-lg"
                        >
                            <Globe className="size-4" />
                            <span className="sr-only">{t('switch')}</span>
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="left">{t('switch')}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" side="top">
                <DropdownMenuItem onClick={() => switchLocale("vi")}>
                    <span className="mr-2">🇻🇳</span>
                    {t('vi')}
                    {locale === "vi" && (
                        <span className="ml-auto text-xs text-muted-foreground">✓</span>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLocale("en")}>
                    <span className="mr-2">🇬🇧</span>
                    {t('en')}
                    {locale === "en" && (
                        <span className="ml-auto text-xs text-muted-foreground">✓</span>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
