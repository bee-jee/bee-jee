import app from './app';
import { PORT } from './constants/server';

app.listen(PORT, () => {
  console.log(`API is listening on ${PORT}`);
  console.log("");
});
