import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import "./tailwind.css";
import { AppSidebar } from "~/components/ui/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { getSessionAgent } from "~/utils/auth/session";
import { Agent } from "@atproto/api";
import { LoaderFunction } from "@remix-run/node";
import * as Profile from "~/lexicon/types/app/bsky/actor/profile";
import NotFound from "./components/ui/404";
import ErrorPage from "./components/ui/errorPage";

export const loader: LoaderFunction = async ({ request }) => {
  const agent: Agent | null = await getSessionAgent(request);

  if (!agent) return null;

  //profileの取得
  const { data: profileRecord } = await agent.com.atproto.repo.getRecord({
    repo: agent.assertDid,
    collection: "app.bsky.actor.profile",
    rkey: "self",
  });

  const profile =
    Profile.isRecord(profileRecord.value) &&
    Profile.validateRecord(profileRecord.value).success
      ? profileRecord.value
      : {};

  //CIDからアイコンデータを取得
  let avatarUrl = null;

  if (profile.avatar) {
    const icon = await agent.com.atproto.sync.getBlob({
      did: agent.assertDid,
      cid: profile.avatar.ref,
    });

    //base64に変換
    const buffer = Buffer.from(icon.data);
    avatarUrl = `data:${icon.headers["content-type"]};base64,${buffer.toString(
      "base64"
    )}`;
  }

  return { profile, avatarUrl };
};

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();

  if (data)
    return (
      <html lang="jp">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body>
          <SidebarProvider>
            <AppSidebar profile={data.profile} avatarUrl={data.avatarUrl} />
            <SidebarTrigger />
            {children}
            <ScrollRestoration />
            <Scripts />
          </SidebarProvider>
        </body>
      </html>
    );

  return (
    <html lang="jp">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const ctx = useLoaderData<typeof loader>();

  return <Outlet context={ctx} />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <>
      <h1>
        {isRouteErrorResponse(error) ? (
          error.status === 404 ? (
            <NotFound />
          ) : error instanceof Error ? (
            <ErrorPage message={error.message} />
          ) : (
            <ErrorPage message={""} />
          )
        ) : (
          <ErrorPage message={""} />
        )}
      </h1>
      <Scripts />
    </>
  );
}
