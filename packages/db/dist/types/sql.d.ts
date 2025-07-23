import { NewEmailSubscriber, EmailSubscriber } from "./schema.js";
declare function insertEmailSubscriber(subscriber: NewEmailSubscriber): Promise<EmailSubscriber>;
declare function getEmailSubscriberByEmail(email: string): Promise<EmailSubscriber | undefined>;
declare function getAllActiveSubscribers(): Promise<EmailSubscriber[]>;
export { insertEmailSubscriber, getEmailSubscriberByEmail, getAllActiveSubscribers, };
//# sourceMappingURL=sql.d.ts.map