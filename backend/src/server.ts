import app from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`🚀 Bull Connect CRM running on port ${env.PORT}`);
});