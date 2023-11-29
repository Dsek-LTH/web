import prisma from "$lib/utils/prisma";
import type { Bookable } from "@prisma/client";



export const getAllBookables = async (

): Promise<Bookable[]> => {
  const bookingRequests = await prisma.bookable.findMany()
  return bookingRequests;
}