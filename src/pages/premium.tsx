import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '@/components/Layout/Layout';
import { Section } from '@/components/Layout/Section';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Sparkles, X, Zap, Shield } from 'lucide-react';

export default function PremiumPage() {
  const { t } = useTranslation('common');
  const { isPremium } = usePremiumStatus();

  const BMC_URL = process.env.NEXT_PUBLIC_BMC_PAGE_URL || 'https://buymeacoffee.com/pokemon.champion.coffee';

  const features = [
    {
      icon: <X className="w-6 h-6" />,
      title: t('premium.features.adFree.title', 'Ad-Free Experience'),
      description: t('premium.features.adFree.description', 'Browse Pokemon Champion without any ads. Clean, distraction-free interface.'),
      highlight: true
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t('premium.features.teamSlots.title', '30 Team Slots'),
      description: t('premium.features.teamSlots.description', 'Create up to 30 teams instead of 10. Build more strategies and experiments.'),
      highlight: true
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: t('premium.features.badge.title', 'Premium Badge'),
      description: t('premium.features.badge.description', 'Show your support with a premium badge on your profile and teams.'),
      highlight: false
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: t('premium.features.support.title', 'Support Development'),
      description: t('premium.features.support.description', 'Help keep Pokemon Champion running and support new feature development.'),
      highlight: false
    }
  ];

  return (
    <>
      <Head>
        <title>{t('premium.title', 'Premium Subscription')} | Pokemon Champion</title>
        <meta
          name="description"
          content="Upgrade to Pokemon Champion Premium for an ad-free experience, 30 team slots, and exclusive features. Support the site for just $5/month."
        />
      </Head>

      <Layout>
        {/* Hero Section */}
        <Section ariaLabel="Premium Subscription Hero" className="bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50">
          <div className="max-w-4xl mx-auto text-center py-12">
            {/* Premium Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-2xl opacity-30"></div>
                <div className="relative bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full p-6">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>

            {/* Already Premium? */}
            {isPremium && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">{t('premium.alreadyPremium', "You're already a Premium member!")}</span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {t('premium.title', 'Premium Subscription')}
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-8">
              {t('premium.subtitle', 'Upgrade your Pokemon Champion experience')}
            </p>

            {/* Pricing */}
            <div className="inline-block bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="text-sm text-gray-600 mb-2">
                {t('premium.pricing.startingAt', 'Starting at')}
              </div>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-5xl font-bold text-gray-900">$5</span>
                <span className="text-xl text-gray-600">/month</span>
              </div>
              <div className="text-sm text-gray-500">
                {t('premium.pricing.cancelAnytime', 'Cancel anytime, no commitment')}
              </div>
            </div>

            {/* CTA Button */}
            {!isPremium && (
              <div>
                <a
                  href={BMC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold text-lg rounded-full hover:from-amber-500 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Sparkles className="w-5 h-5" />
                  {t('premium.cta', 'Subscribe Now')}
                </a>
                <p className="text-sm text-gray-500 mt-4">
                  {t('premium.poweredBy', 'Powered by Buy Me a Coffee')}
                </p>
              </div>
            )}

            {isPremium && (
              <div>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-full hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  {t('premium.viewProfile', 'View Your Profile')}
                </Link>
                <p className="text-sm text-gray-500 mt-4">
                  <a
                    href={BMC_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    {t('premium.manageSubscription', 'Manage your subscription on Buy Me a Coffee')}
                  </a>
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* Features Section */}
        <Section ariaLabel="Premium Features">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              {t('premium.features.title', 'Premium Features')}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${feature.highlight
                      ? 'border-primary-300 bg-primary-50 hover:border-primary-400 hover:shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                >
                  <div className={`inline-flex p-3 rounded-lg mb-4 ${feature.highlight
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                    }`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* FAQ Section */}
        <Section ariaLabel="Frequently Asked Questions" className="bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              {t('premium.faq.title', 'Frequently Asked Questions')}
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('premium.faq.howItWorks.question', 'How does it work?')}
                </h3>
                <p className="text-gray-600">
                  {t('premium.faq.howItWorks.answer', 'Subscribe via Buy Me a Coffee using the same email as your Pokemon Champion account. Your premium benefits will be activated automatically within minutes.')}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('premium.faq.emailMismatch.question', 'What if I use a different email?')}
                </h3>
                <p className="text-gray-600">
                  {t('premium.faq.emailMismatch.answer', 'If you use a different email for Buy Me a Coffee, contact our support team and we will manually link your accounts.')}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('premium.faq.cancel.question', 'Can I cancel anytime?')}
                </h3>
                <p className="text-gray-600">
                  {t('premium.faq.cancel.answer', 'Yes! You can cancel your subscription at any time on Buy Me a Coffee. Your premium benefits will remain active until the end of your current billing period.')}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('premium.faq.refund.question', 'What about refunds?')}
                </h3>
                <p className="text-gray-600">
                  {t('premium.faq.refund.answer', 'Refunds are handled through Buy Me a Coffee according to their refund policy. Generally, subscriptions are non-refundable but you can cancel to prevent future charges.')}
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* Bottom CTA */}
        {!isPremium && (
          <Section ariaLabel="Subscribe Call to Action" className="bg-gradient-to-r from-primary-600 to-blue-600 text-white">
            <div className="max-w-4xl mx-auto text-center py-12">
              <h2 className="text-3xl font-bold mb-4">
                {t('premium.bottomCta.title', 'Ready to upgrade?')}
              </h2>
              <p className="text-xl mb-8 opacity-90">
                {t('premium.bottomCta.subtitle', 'Join Pokemon Champion Premium today')}
              </p>
              <a
                href={BMC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-bold text-lg rounded-full hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Sparkles className="w-5 h-5" />
                {t('premium.cta', 'Subscribe Now')}
              </a>
            </div>
          </Section>
        )}
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
