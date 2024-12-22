import { env } from "$env/dynamic/private";
import Knex from "knex";
import humps from "humps";

const knex = Knex({
  client: "pg",
  postProcessResponse: (result) => {
    // When the result is an array, map each row and convert keys
    if (Array.isArray(result)) {
      return result.map((row) => humps.camelizeKeys(row));
    }
    // If the result is an object (e.g. .first())
    if (typeof result === "object" && result !== null) {
      return humps.camelizeKeys(result);
    }
    // Otherwise, just return as is (e.g. number of affected rows)
    return result;
  },
  connection: {
    connectionString: env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  },
});

export default knex;
