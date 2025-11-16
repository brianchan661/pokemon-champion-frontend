import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticPaths, GetStaticProps } from 'next';

export default function TeamEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('common');

  useEffect(() => {
    if (id && typeof id === 'string') {
      // Redirect to builder with teamId query param
      router.replace(`/teams/builder?teamId=${id}`);
    }
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Return empty paths since we don't know team IDs at build time
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
