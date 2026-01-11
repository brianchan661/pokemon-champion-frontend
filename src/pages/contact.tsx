import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { Layout } from '@/components/Layout/Layout';
import { Section } from '@/components/Layout/Section';

export default function ContactPage() {
    const { t } = useTranslation('common');

    return (
        <>
            <Head>
                <title>{t('contact.title', 'Contact Us')} | Pokemon Champion</title>
                <meta name="description" content={t('contact.description', 'Get in touch with the Pokemon Champion team.')} />
            </Head>

            <Layout>
                <Section className="py-12 bg-white dark:bg-dark-bg-primary" ariaLabel={t('contact.title', 'Contact Us')}>
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-6">
                            {t('contact.title', 'Contact Us')}
                        </h1>

                        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-dark-text-secondary">
                            <p className="mb-6">
                                {t('contact.intro', 'Have questions, feedback, or suggestions? We would love to hear from you!')}
                            </p>

                            <p className="mb-6">
                                {t('contact.requests', 'We are always looking to improve. If you have any suggestions or feature requests, please let us know!')}
                            </p>

                            <div className="bg-gray-50 dark:bg-dark-bg-secondary p-6 rounded-lg border border-gray-200 dark:border-dark-border">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
                                    {t('contact.emailLabel', 'Email Us')}
                                </h2>
                                <a
                                    href="mailto:pokemon.champion.unofficial@gmail.com"
                                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-lg break-all"
                                >
                                    pokemon.champion.unofficial@gmail.com
                                </a>
                            </div>
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
