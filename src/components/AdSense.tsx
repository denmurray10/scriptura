
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
    interface Window {
        adsbygoogle: any;
    }
}

const AdSense = ({ adSlot }: { adSlot: string }) => {
    const pathname = usePathname();

    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error(err);
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        <div style={{ textAlign: "center", margin: "20px 0" }}>
            <ins
                key={`${pathname}-${adSlot}`} // Keep key to help React differentiate on navigation
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
                data-ad-slot={adSlot}
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        </div>
    );
};

export default AdSense;
