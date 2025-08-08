import app from "./app/app";
import { port } from "./config/loadEnv";

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
