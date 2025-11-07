import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Layout } from '@/components/Layout/Layout';
import { Section } from '@/components/Layout/Section';
import { ComingSoon } from '@/components/ComingSoon';

export default function TiersPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>{t('nav.tiers', 'Tier List')} | Pokemon Champion</title>
        <meta
          name="description"
          content="Pokemon competitive tier lists and rankings coming soon."
        />
      </Head>

      <Layout>
        <Section>
          <ComingSoon
            title={t('nav.tiers', 'Tier List')}
            description={t('tiers.comingSoon', 'Comprehensive Pokemon tier lists and rankings are coming soon. Stay tuned for competitive meta analysis!')}
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
