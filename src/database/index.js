import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { mySchema } from "./schema";
import Loan from "./model/Loan";
import Subscription from "./model/Subscription";
import migrations from "./migrations";

const adapter = new SQLiteAdapter({
  schema: mySchema,
  migrations,
  onSetUpError: error => {
    console.error("WatermelonDB SQLite adapter set up error:", error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [Loan, Subscription]
});