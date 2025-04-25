import { insertEmailSubscriber } from "./sql.js"

await insertEmailSubscriber({
  email: "m@test.com",
})
