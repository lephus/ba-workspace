import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'vi';
    const validLocales = ['vi', 'en'];
    const safeLocale = validLocales.includes(locale) ? locale : 'vi';

    return {
        locale: safeLocale,
        messages: (await import(`../messages/${safeLocale}.json`)).default,
    };
});
