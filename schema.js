import { Client } from "https://deno.land/x/postgres@v0.11.3/mod.ts";

const client = new Client(
  "postgres://qrnasxys:AMHvoJK8kxozwb0eEYDo3vKb72QokXBw@surus.db.elephantsql.com/qrnasxys"
);
await client.connect();

await client.queryArray(`DROP TABLE IF EXISTS users CASCADE`);
await client.queryArray(`DROP TABLE IF EXISTS testUsers CASCADE`);

await client.queryArray(
  `CREATE TABLE users (
    username TEXT UNIQUE NOT NULL PRIMARY KEY,
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    satFat INTEGER NOT NULL,
    sugar INTEGER NOT NULL,
    carb INTEGER NOT NULL,
    eatDate DATE NOT NULL
  )`
);

await client.queryArray(
  `CREATE TABLE testUsers (
    entryid SERIAL UNIQUE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    eatDate DATE NOT NULL
  )`
);
