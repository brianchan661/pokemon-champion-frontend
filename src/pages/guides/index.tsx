import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '@/components/Layout/Layout';
import { Section } from '@/components/Layout/Section';
import { TypeIcon } from '@/components/UI/TypeIcon'; // Using generic icon for now or we can use specific one

export default function GuidesPage() {
    const { t } = useTranslation('common');

    return (
        <>
            <Head>
                <title>{t('nav.guides', 'Guides')} | Pokemon Champion</title>
                <meta
                    name="description"
                    content="Pokemon competitive battle guides and strategy tools."
                />
            </Head>

            <Layout>
                <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-12">
                    <Section ariaLabel="Guides & Tools">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                            {t('nav.guides', 'Guides & Tools')}
                        </h1>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Type Chart Tool Card */}
                            <Link href="/guides/type-chart" className="block group">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform group-hover:scale-[1.02] group-hover:shadow-lg border border-transparent group-hover:border-blue-500">
                                    <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <div className="grid grid-cols-3 gap-2 opacity-90 p-4">
                                            {/* Abstract representation of type chart */}
                                            <div className="w-6 h-6 bg-red-400 rounded-full"></div>
                                            <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                                            <div className="w-6 h-6 bg-green-400 rounded-full"></div>
                                            <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
                                            <div className="w-6 h-6 bg-purple-400 rounded-full"></div>
                                            <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-500">
                                            {t('guides.typeChart.title', 'Type Effectiveness Calculator')}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {t('guides.tools.typeChartDesc', 'Analyze single and dual-type weaknesses and resistances with our comprehensive interactive chart.')}
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* Placeholder for future guides */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-center items-center text-center opacity-75">
                                <div className="mb-4 text-gray-400">
                                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                    {t('guides.moreComing', 'More Guides Coming Soon')}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('guides.stayTuned', 'Stay tuned for team building strategies and meta analysis.')}
                                </p>
                            </div>

                        </div>
                    </Section>
                </div>
            </Layout>
        </>
    );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
    return {
        props: {
            ...(await serverSideTranslations(locale || 'en', ['common'])),
        },
    };
};
