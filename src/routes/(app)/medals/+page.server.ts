import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;

  const selectedYear =
    parseInt(url.searchParams.get("year") ?? "") || new Date().getFullYear();

  const volonteerRecipientIds = (
    await prisma.mandate.groupBy({
      by: ["memberId"],
      _min: {
        startDate: true,
      },
      having: {
        AND: [
          {
            startDate: {
              _min: {
                gte: new Date(selectedYear + "-01-01"),
              },
            },
          },
          {
            startDate: {
              _min: {
                lte: new Date(selectedYear + "-12-31"),
              },
            },
          },
        ],
      },
    })
  ).map((x) => x.memberId);

  const volonteerRecipients = await prisma.member.findMany({
    where: {
      id: {
        in: volonteerRecipientIds,
      },
    },
  });

  return {
    recipients: volonteerRecipients,
  };
};
