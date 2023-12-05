import prisma from "$lib/utils/prisma";
import { superValidate } from "sveltekit-superforms/server";
import type { PageServerLoad } from "./$types";
import { likeSchema } from "../news/likes";

export const load: PageServerLoad = async () => {
  const mostLikedArticles = await prisma.article.findMany({
    take: 3,
    orderBy: {
      likers: {
        _count: "desc",
      },
    },
    include: {
      author: {
        include: {
          member: true,
          mandate: {
            include: {
              position: true,
            },
          },
          customAuthor: true,
        },
      },
      tags: true,
      likers: true,
      comments: true,
    },
  });

  const topLikingMembers = await prisma.member.findMany({
    take: 3,
    orderBy: {
      likedArticles: {
        _count: "desc",
      },
    },
    include: {
      _count: {
        select: {
          likedArticles: true,
        },
      },
    },
  });

  const topAuthors = await prisma.member.findMany({
    take: 3,
    orderBy: {
      authors: {
        _count: "desc",
      },
    },
    include: {
      _count: {
        select: {
          authors: true,
        },
      },
    },
  });

  const topEventAuthors = await prisma.member.findMany({
    take: 3,
    orderBy: {
      authoredEvents: {
        _count: "desc",
      },
    },
    include: {
      _count: {
        select: {
          authoredEvents: true,
        },
      },
    },
  });

  const topPingers = await prisma.member.findMany({
    take: 3,
    orderBy: {
      pingsFromMe: {
        _count: "desc",
      },
    },
    include: {
      _count: {
        select: {
          pingsFromMe: true,
        },
      },
    },
  });

  const topPinged = await prisma.member.findMany({
    take: 3,
    orderBy: {
      pingsToMe: {
        _count: "desc",
      },
    },
    include: {
      _count: {
        select: {
          pingsToMe: true,
        },
      },
    },
  });

  const topArticleCommenters = await prisma.member.findMany({
    take: 3,
    orderBy: {
      articleComments: {
        _count: "desc",
      },
    },
    include: {
      _count: {
        select: {
          articleComments: true,
        },
      },
    },
  });

  const topEventCommenters = await prisma.member.findMany({
    take: 3,
    orderBy: {
      eventComments: {
        _count: "desc",
      },
    },
    include: {
      _count: {
        select: {
          eventComments: true,
        },
      },
    },
  });

  const topGoers = await prisma.member.findMany({
    take: 3,
    orderBy: {
      eventsGoingTos: {
        _count: "desc",
      },
    },
    include: {
      _count: {
        select: {
          eventsGoingTos: true,
        },
      },
    },
  });

  const topInterested = await prisma.member.findMany({
    take: 3,
    orderBy: {
      eventsInterestedIns: {
        _count: "desc",
      },
    },
    include: {
      _count: {
        select: {
          eventsInterestedIns: true,
        },
      },
    },
  });

  // top mandates of all time that also have a active mandate
  /*  const topMandates = await prisma.member.findMany({
    take: 3,
    where: {
      mandates: {
        some: {
          startDate: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
      },
    },
    orderBy: {
      mandates: {
        _count: "desc",
      },
    },
    /*     include: {
      mandates: {
        where: {
          startDate: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
      },
      _count: {
        select: {
          mandates: true,
        },
      },
    }, */
  /*
    include: {
      _count: {
        select: {
          mandates: {
            where: {
              startDate: {
                gte: new Date(new Date().getFullYear(), 0, 1),
              },
            },
          },
        },
      },
    },
  }); */

  const membersWithMandates = await prisma.member.findMany({
    where: {
      mandates: {
        some: {
          startDate: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
      },
    },
    include: {
      mandates: {
        where: {
          startDate: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
      },
      _count: {
        select: {
          mandates: {
            where: {
              startDate: {
                gte: new Date(new Date().getFullYear(), 0, 1),
              },
            },
          },
        },
      },
    },
  });

  // Now sort the results manually in JavaScript
  membersWithMandates.sort((a, b) => b._count.mandates - a._count.mandates);

  // Take the top 3
  const topMandates = membersWithMandates.slice(0, 3);

  return {
    mostLikedArticles,
    topLikingMembers,
    topAuthors,
    topEventAuthors,
    topPingers,
    topPinged,
    topArticleCommenters,
    topEventCommenters,
    topGoers,
    topInterested,
    topMandates,
    likeForm: await superValidate(likeSchema),
  };
};
