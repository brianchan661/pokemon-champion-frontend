import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Layout } from '@/components/Layout/Layout';
import { Section } from '@/components/Layout/Section';
import { ComingSoon } from '@/components/ComingSoon';

export default function GuidesPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>{t('nav.guides', 'Guides')} | Pokemon Champion</title>
        <meta
          name="description"
          content="Pokemon competitive battle guides and strategies coming soon."
        />
      </Head>

      <Layout>
        <Section ariaLabel="Guides Section">
          <ComingSoon
            title={t('nav.guides', 'Guides')}
            description={t('guides.comingSoon', 'In-depth battle guides, strategies, and tutorials are coming soon. Learn from the best!')}
          />
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
