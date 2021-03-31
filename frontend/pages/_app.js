import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  return (
    <>
    <Head>
        <title>Poke-Battle</title>
        <link rel="icon" href="/favicon.ico" />
        <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet" />
    </Head>
    <Component {...pageProps} />
    </>
  )
}

export default MyApp
