import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Layout } from '@/components/Layout/Layout';
import { Section } from '@/components/Layout/Section';
import { DualTypeChart } from '@/components/Guides/DualTypeChart';

export default function TypeChartPage() {
    const { t } = useTranslation('common');

    return (
        <>
            <Head>
                <title>{t('guides.typeChart.title', 'Type Effectiveness Calculator')} | Pokemon Champion</title>
                <meta
                    name="description"
                    content={t('guides.typeChart.metaDescription', 'Calculate Pokemon type weaknesses and resistances with our interactive dual-type chart.')}
                />
            </Head>

            <Layout>
                <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-12">
                    <Section ariaLabel={t('guides.typeChart.title')}>
                        <DualTypeChart />
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
