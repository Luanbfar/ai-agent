import app from "./app/app.ts";
import { port } from "./config/loadEnv.ts";
import { connectToDatabase } from "./database/mongodb.ts";

await connectToDatabase();

app.listen(port, () => {
  console.log(`Server is running.`);
});
