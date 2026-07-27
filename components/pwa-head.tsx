import Head from 'expo-router/head';

export function PwaHead() {
  return (
    <Head>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#0b0d10" />
      <meta name="mobile-web-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="GrimKeeper" />
      <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
      <link rel="icon" href="/pwa/icon-192.png" />
    </Head>
  );
}
