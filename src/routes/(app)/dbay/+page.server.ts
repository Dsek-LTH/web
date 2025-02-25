import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const { locals, url } = event;
  const { prisma } = locals;

  const urlOrder = url.searchParams.get("order");

  const { field, dir } = ((url) => {
    switch (url) {
      case "oldest":
        return { field: "createdAt", dir: "asc" };
      case "expensive":
        return { field: "price", dir: "desc" };
      case "cheap":
        return { field: "price", dir: "asc" };
      default:
        return { field: "createdAt", dir: "desc" };
    }
  })(urlOrder);

  const dbay = await prisma.dbay.findMany({
    orderBy: { [field]: dir },
  });

  return { dbay };
};
