import Document, { Head, Html, Main, NextScript } from 'next/document';

const CSP =
  "default-src 'self' file: data: blob:; script-src 'self' file: 'unsafe-inline'; style-src 'self' file: 'unsafe-inline'; img-src 'self' file: data: blob:; connect-src 'none'";

export default class MyDocument extends Document {
  render() {
    // 生产构建注入 meta CSP（file:// 下 webRequest 拦截不可靠）；dev 放行 HMR
    const isProd = process.env.NODE_ENV === 'production';
    return (
      <Html>
        <Head>
          {isProd ? <meta httpEquiv="Content-Security-Policy" content={CSP} /> : null}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
