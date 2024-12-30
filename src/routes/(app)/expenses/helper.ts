import { getFullName } from "$lib/utils/client/member";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import type { Expense, Member } from "@prisma/client";

export const sendNotificationToSigner = async (
  member: Pick<Member, "id" | "firstName" | "lastName">,
  expense: Pick<Expense, "description">,
  memberIds: string[],
) => {
  try {
    await sendNotification({
      title: "Nytt utlägg",
      message: `${getFullName(member, {
        hideNickname: true,
      })} har skickat in ett nytt utlägg: ${expense.description}`,
      link: `/expenses`,
      type: NotificationType.EXPENSES,
      memberIds: memberIds,
      fromMemberId: member.id, // send notification from the creator of the expense
    });
  } catch (e) {
    console.error(`Could not send notification when creating expense`, e);
  }
};
