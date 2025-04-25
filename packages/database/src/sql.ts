import {
  emailSubscribers,
  NewEmailSubscriber,
  EmailSubscriber,
  insertEmailSubscriberSchema,
} from "./schema.js"
import { db } from "./client.js"
import { eq } from "drizzle-orm"

async function insertEmailSubscriber(
  subscriber: NewEmailSubscriber,
): Promise<EmailSubscriber> {
  insertEmailSubscriberSchema.parse(subscriber)

  const [newSubscriber] = await db
    .insert(emailSubscribers)
    .values(subscriber)
    .returning()

  return newSubscriber
}

async function getEmailSubscriberByEmail(
  email: string,
): Promise<EmailSubscriber | undefined> {
  const [subscriber] = await db
    .select()
    .from(emailSubscribers)
    .where(eq(emailSubscribers.email, email))

  return subscriber
}

async function getAllActiveSubscribers(): Promise<EmailSubscriber[]> {
  const subscribers = await db
    .select()
    .from(emailSubscribers)
    .where(eq(emailSubscribers.active, true))
    .orderBy(emailSubscribers.subscribed_at)

  return subscribers
}

export {
  insertEmailSubscriber,
  getEmailSubscriberByEmail,
  getAllActiveSubscribers,
}
