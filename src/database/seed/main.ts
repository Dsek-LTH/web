/**
 * Use any TypeScript runner to run this script, for example: `pnpx tsx seed.ts`
 * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
 */
import { createSeedClient } from "@snaplet/seed";
import {
  ACCESS_POLICIES,
  BOOKABLES,
  COMMITTEES,
  DOORS,
  GUIDELINES,
  MARKDOWNS,
  models,
  POLICYS,
} from "./data";
import { checkForPostgresTunnel } from "./helpers";

const main = async () => {
  await checkForPostgresTunnel();

  const seed = await createSeedClient({
    connect: true,
    models,
  });

  await seed.$resetDatabase();

  await seed.tag((x) => x(10));

  if (process.env["USER"]) {
    await seed.member([{ studentId: process.env["USER"] }]);
  }
  await seed.member((x) => x(100));
  await seed.article((x) => x(100));
  await seed.articleComment((x) => x(10));
  await seed.event((x) => x(50));

  await seed.accessPolicy(ACCESS_POLICIES);

  await seed.door(DOORS);
  await seed.doorAccessPolicy((x) => x(50));

  await seed.bookable(BOOKABLES);
  await seed.bookingRequest((x) =>
    x(25, {
      _booking_requests_bookables: (x) => x({ min: 1, max: 5 }),
    })
  );

  await seed.committee(
    COMMITTEES.map((committee) => ({
      ...committee,
      positions: (x) => x(8, { mandates: (x) => x({ min: 1, max: 5 }) }),
    })),
  );

  await seed.document([
    ...POLICYS.map((policy) => ({ title: policy, type: "POLICY" }) as const),
    ...GUIDELINES.map(
      (guideline) => ({ title: guideline, type: "GUIDELINE" }) as const,
    ),
  ]);
  await seed.markdown((x) => [
    ...MARKDOWNS,
    ...x(5, (ctx) => ({
      name: `cafe:open:${ctx.index}`,
      markdownSv: "11:30 - 13:00",
      markdownEn: "11:30 - 13:00",
    })),
  ]);

  await seed.song((x) => x(50));

  await seed.subscriptionSetting((x) => x(100));

  await seed.election((x) => x(5));

  await seed.readme((x) => x(5));

  process.exit();
};

main();
