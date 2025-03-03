
export const load = async ({ locals, fetch }) => {
  const { prisma } = locals;
  const phadderGroups = await prisma.phadderGroup.findMany({
    where: {
      year: 2024,
    },
    include: {
      nollor: true,
      phaddrar: {
        include: {
          member: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  let data;
  try {
    const req = await fetch("http://localhost:3000/api/globals/landing?draft=true");
    data = await req.json();
  } catch (e) {
    console.log(e);
  }
  console.log(data);
  return {
    phadderGroups,
    data,
  };
};
