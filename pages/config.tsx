import React from "react";
import Head from "next/head";
import type { GetStaticProps } from "next";

import Header from "../components/Header";
import { scrapingJobs } from "../lib/scraping-jobs";

type ConfigRoute = {
  endpoint: string;
  id: string;
  label: string;
  sourceUrl: string;
};

type ConfigPageProps = {
  routes: ConfigRoute[];
};

export const getStaticProps: GetStaticProps<ConfigPageProps> = async () => {
  return {
    props: {
      routes: scrapingJobs.map(({ endpoint, id, label, sourceUrl }) => ({
        endpoint,
        id,
        label,
        sourceUrl,
      })),
    },
  };
};

export default function ConfigPage({ routes }: ConfigPageProps) {
  return (
    <>
      <Head>
        <title>BusOnTime - Configurações</title>
        <meta
          name="description"
          content="Configurações e fontes de raspagem cadastradas no BusOnTime."
        />
      </Head>

      <div className="mb-10 pb-10">
        <Header />
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-28">
        <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
            Configurações
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            Fontes de raspagem cadastradas
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
            Esta página confirma que a rota <strong>/config</strong> existe no
            app e lista os endpoints que o painel administrativo usa para
            atualizar os horários. Se a Vercel ainda mostrar 404, o deploy
            publicado provavelmente ainda não recebeu este commit.
          </p>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-900">
          <div className="border-b p-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Rotas configuradas ({routes.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rota</th>
                  <th className="px-4 py-3 font-semibold">Endpoint</th>
                  <th className="px-4 py-3 font-semibold">Fonte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {routes.map((route) => (
                  <tr key={route.id} className="align-top">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {route.label}
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                        /api/{route.endpoint}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={route.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-green-700 hover:underline dark:text-green-400"
                      >
                        {route.sourceUrl}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
