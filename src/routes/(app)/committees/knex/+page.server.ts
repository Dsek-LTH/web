import { type Position, type Committee, type Mandate } from "@prisma/client";
import type { PageServerLoad } from "./$types";
import database from "$lib/server/database";

export const load: PageServerLoad = async () => {
  const committees = (await database
    // Select all committee columns
    .select("committees.*")
    .from("committees")
    // Select positions as an aggregated JSON array
    .select(
      database.raw(`
        json_agg(
          json_build_object(
            'id', positions.id,
            'mandates',
              COALESCE(
                (
                  SELECT json_agg(m.*)
                  FROM mandates m
                  WHERE
                    m.position_id = positions.id
                    AND m.start_date < now()
                    AND m.end_date > now()
                ), '[]'::json
              )
          )
        ) AS positions
      `),
    )
    .join<Position>("positions", "committees.id", "positions.committee_id")
    // Group by committee ID so we get one row per committee
    .groupBy("committees.id")) as Array<
    Committee & {
      positions: Array<
        Position & {
          mandates: Mandate[];
        }
      >;
    }
  >;

  return {
    committees,
  };
};
