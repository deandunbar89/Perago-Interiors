"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function subscribeToPush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId: session.user.id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    create: {
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function unsubscribeFromPush(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}
