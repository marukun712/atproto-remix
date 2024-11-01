import { Agent } from "@atproto/api";
import { ActionFunctionArgs, LoaderFunction } from "@remix-run/node";
import { Form, Outlet, redirect, useLoaderData } from "@remix-run/react";
import { getSessionAgent } from "~/utils/auth/session";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/ui/app-sidebar";
import { getUserProfile } from "~/utils/user/getUserProfile";
import { Toaster } from "~/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";
import { useState } from "react";

export const loader: LoaderFunction = async ({ request }) => {
  const agent: Agent | null = await getSessionAgent(request);

  if (agent == null) return redirect("/login");

  const { profile } = await getUserProfile(agent, agent.assertDid);

  return { profile };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const agent: Agent | null = await getSessionAgent(request);
  if (!agent) return;

  const formData = await request.formData();
  const content = formData.get("content");

  if (typeof content === "string") {
    await agent.post({
      text: content,
      createdAt: new Date().toISOString(),
    });
  }

  return null;
};

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const { toast } = useToast();
  const [open, SetOpen] = useState(false);

  if (!data) return null;

  return (
    <SidebarProvider>
      {data && (
        <AppSidebar profile={data.profile} open={open} SetOpen={SetOpen} />
      )}
      <SidebarTrigger />
      <div className="m-auto md:w-1/2 w-3/4 py-14">
        <Outlet />
      </div>

      <Toaster />
      <Dialog open={open} onOpenChange={SetOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-bold text-2xl">投稿する</DialogTitle>
          </DialogHeader>
          <Form method="post">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Textarea name="content" id="content" className="w-80 h-64" />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                onClick={() => {
                  SetOpen(!open);
                  toast({
                    title: "投稿完了✅",
                    description: "ポストが投稿されました",
                  });
                }}
              >
                投稿
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
