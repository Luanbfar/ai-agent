import app from './app/app.ts';
import { port } from './config/loadEnv.ts';
import { connectToDatabase } from './database/mongodb.ts';

await connectToDatabase();

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on all interfaces.`);
});
