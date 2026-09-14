import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import { getFullName } from "$lib/utils/client/member";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import * as messages from "$paraglide/messages";

export const sendNotificationToSigner = async (
  member: Pick<ExtendedPrismaModel<"Member">, "id" | "firstName" | "lastName">,
  expense: Pick<ExtendedPrismaModel<"Expense">, "description">,
  memberIds: string[],
) => {
  try {
    await sendNotification({
      title: messages.expenses_new_expense(),
      message: messages.expenses_has_filed_new_expense({
        name: getFullName(member, {
          hideNickname: true,
        }),
        expense: expense.description,
      }),
      link: `/expenses`,
      type: NotificationType.EXPENSES,
      memberIds: memberIds,
      fromMemberId: member.id, // send notification from the creator of the expense
    });
  } catch (e) {
    console.error(messages.expenses_error_sending_notification(), e);
  }
};
