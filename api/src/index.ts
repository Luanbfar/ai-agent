import app from "./app/app";
import { port } from "./config/loadEnv";
import { connectToDatabase } from "./database/mongodb";

await connectToDatabase();

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
