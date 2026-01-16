import React from 'react';
import Head from 'next/head';
import { AdSense } from '@/components/Ads';
import { ADSENSE_CONFIG } from '@/config/adsense';

export default function AdsTestPage() {
    const clientId = ADSENSE_CONFIG.CLIENT_ID;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <Head>
                <title>AdSense Test Page | Pokemon Champion</title>
            </Head>

            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">AdSense Integration Test</h1>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Debug Info</h2>
                    <div className="space-y-2 text-sm font-mono bg-gray-100 p-4 rounded">
                        <p><strong>Config Client ID:</strong> &quot;{clientId}&quot;</p>
                        <p><strong>Length:</strong> {clientId?.length}</p>
                        <p><strong>Is Valid Format:</strong> {/^ca-pub-\d{16}$/.test(clientId) ? 'Yes' : 'No'}</p>
                        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Test Unit 1: Responsive (Auto)</h2>
                    <div className="border-2 border-dashed border-gray-300 p-4 min-h-[100px] flex items-center justify-center bg-gray-50">
                        {/* Using a verified slot ID */}
                        <AdSense
                            adSlot="8010124940"
                            adFormat="auto"
                            fullWidthResponsive={true}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Test Unit 2: Fixed Rectangle (300x250)</h2>
                    <div className="flex justify-center">
                        <div className="w-[300px] h-[250px] border-2 border-dashed border-gray-300 bg-gray-50 relative">
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                                300x250 Container
                            </div>
                            <AdSense
                                adSlot="8010124940"
                                adFormat="rectangle"
                                fullWidthResponsive={false}
                                style={{ display: 'block', width: '300px', height: '250px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
