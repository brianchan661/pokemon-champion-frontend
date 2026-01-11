import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { Layout } from '@/components/Layout/Layout';
import { Section } from '@/components/Layout/Section';

export default function AboutPage() {
    const { t } = useTranslation('common');

    return (
        <>
            <Head>
                <title>{t('about.title', 'About Us')} | Pokemon Champion</title>
                <meta name="description" content={t('about.description', 'Learn more about Pokemon Champion, the ultimate Pokemon team builder and strategy resource.')} />
            </Head>

            <Layout>
                <Section className="py-12 bg-white dark:bg-dark-bg-primary" ariaLabel={t('about.title', 'About Us')}>
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-6">
                            {t('about.title', 'About Us')}
                        </h1>

                        <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-dark-text-secondary">
                            <p>
                                {t('about.intro', 'Welcome to Pokemon Champion, your ultimate companion for competitive Pokemon battling and team building.')}
                            </p>

                            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                                {t('about.mission.title', 'Our Mission')}
                            </h2>
                            <p>
                                {t('about.mission.text', 'Our goal is to provide trainers with the best tools to analyze, build, and share their Pokemon teams. Whether you are a seasoned competitive player or just starting your journey, Pokemon Champion offers the insights you need to succeed.')}
                            </p>

                            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                                {t('about.features.title', 'Key Features')}
                            </h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>{t('about.features.builder', 'Advanced Team Builder: Create and analyze your dream team with detailed stats and type coverage.')}</li>
                                <li>{t('about.features.database', 'Comprehensive Database: Access detailed information on Pokemon, moves, abilities, and items.')}</li>
                                <li>{t('about.features.community', 'Community Strategies: Share your teams and discover strategies from other top trainers.')}</li>
                            </ul>
                        </div>
                    </div>
                </Section>
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
