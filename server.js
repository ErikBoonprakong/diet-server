import { Client } from "https://deno.land/x/postgres@v0.11.3/mod.ts";
import { abcCors } from "https://deno.land/x/cors/mod.ts";
import { Application } from "https://deno.land/x/abc/mod.ts";

const client = new Client(
  "postgres://qrnasxys:AMHvoJK8kxozwb0eEYDo3vKb72QokXBw@surus.db.elephantsql.com/qrnasxys"
);
await client.connect();

const app = new Application();
const PORT = parseInt(Deno.env.get("PORT")) || 8080;

const corsConfig = abcCors({
  origin: true,
  allowedHeaders: [
    "Authorization",
    "Content-Type",
    "Accept",
    "Origin",
    "User-Agent",
  ],
  credentials: true,
});

app
  .use(corsConfig)
  .post("/create", createUser)
  .get("/userlist", getUsernames)
  .post("/newday", loadNutrientLog)
  .post("/addnutrients", addNutrients)
  .start({ port: PORT });

async function createUser(server) {
  const { username } = await server.body;
  const authenticated = await validateAccount(username);
  console.log(authenticated);
  if (authenticated === true) {
    const query = `INSERT INTO testusers(username, calories, protein, eatDate)
                   VALUES ($1, $2, $3, CURRENT_DATE);`;
    await client.queryArray({
      text: query,
      args: [username, 1000, 30],
    });
    return server.json({ message: "User successfully created" }, 200);
  } else {
    return server.json({ message: authenticated }, 400);
  }
}

async function validateAccount(username) {
  const invalidChars = [...`',./;:[]{}"@|<>#~=+()&*%^£$!`];
  const [[userExists]] = (
    await client.queryArray({
      text: `SELECT COUNT(*) FROM testusers WHERE username = $1`,
      args: [username],
    })
  ).rows;
  const invalidCharMsg = "Name contains invalid characters \n";
  const userAlreadyExistsMsg = "User already exists \n";
  let errorMsg = "";
  let nameContainsInvalidChars = false;
  invalidChars.forEach((char) => {
    if (username.split("").includes(char)) {
      nameContainsInvalidChars = true;
    }
  });
  if (nameContainsInvalidChars) {
    errorMsg += invalidCharMsg;
  }
  if (userExists !== 0n) {
    errorMsg += userAlreadyExistsMsg;
  }
  if (!username) {
    errorMsg += "Please enter your name";
  }
  if (errorMsg !== "") {
    return errorMsg;
  } else {
    return true;
  }
}

async function getUsernames(server) {
  const results = await client.queryArray({
    text: `SELECT username FROM testusers`,
  });
  server.json(results.rows);
}

async function loadNutrientLog(server) {
  const { username } = await server.body;
  const [[userDayExists]] = (
    await client.queryArray({
      text: `SELECT COUNT(*) FROM testusers WHERE username = $1 AND eatdate = CURRENT_DATE`,
      args: [username],
    })
  ).rows;
  if (userDayExists === 0n) {
    const query = `INSERT INTO testusers(username, calories, protein, eatDate)
                   VALUES ($1, $2, $3, CURRENT_DATE);`;
    await client.queryArray({
      text: query,
      args: [username, 0, 0],
    });
    return server.json(
      { message: "Beginning nutrition log for new day..." },
      200
    );
  } else {
    const nutrition = await client.queryArray({
      text: `SELECT calories, protein FROM testusers WHERE username = $1 AND eatdate = CURRENT_DATE`,
      args: [username],
    });
    console.log(nutrition.rows);
    return server.json(
      {
        message: "Resuming dieting log for current day...",
        calories: nutrition.rows[0][0],
        protein: nutrition.rows[0][1],
      },
      200
    );
  }
}

async function addNutrients(server) {
  const { username, calories, protein } = await server.body;
  console.log('username: ' + username)
  const nutrition = await client.queryArray({
    text: `SELECT calories, protein FROM testusers WHERE username = $1 AND eatdate = CURRENT_DATE`,
    args: [username],
  });
  console.log('add nuts: ')
  console.log(nutrition.rows)
  const newCalories = parseInt(calories) + parseInt(nutrition.rows[0][0]);
  const newProtein = parseInt(protein) + parseInt(nutrition.rows[0][1]);
  await client.queryArray({
    text: `UPDATE testusers SET calories = $1, protein = $2 WHERE username = $3 AND eatdate = CURRENT_DATE`,
    args: [newCalories, newProtein, username],
  });
  return server.json({message: 'nutrition successfully updated'}, 200)
}

console.log(`Server running on http://localhost:${PORT}`);
